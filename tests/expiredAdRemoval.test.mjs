import assert from 'node:assert/strict';
import test from 'node:test';
import { removeExpiredAd } from '../api/_lib/handlers/ad-change-requests.js';

const now = Date.parse('2026-12-02T12:00:00Z');
const owner = 'owner';

function makeStore(ad, events = {}) {
  const state = {
    ad_submissions: { ad: { advertiserId: owner, ...ad } },
    events,
    bookings: { ticket: { eventId: 'event', status: 'confirmed' } }
  };
  const firestore = {
    collection: (name) => ({
      doc: (id) => ({ name, id }),
      where: (field, _operation, value) => ({ name, field, value })
    }),
    runTransaction: (execute) => execute({
      async get({ name, id, field, value }) {
        if (field) {
          const docs = Object.values(state[name])
            .filter(record => record[field] === value)
            .map(record => ({ data: () => record }));
          return { docs };
        }
        return { data: () => state[name][id] };
      },
      update({ name, id }, fields) {
        state[name][id] = { ...state[name][id], ...fields };
      }
    })
  };
  return { state, firestore };
}

test('an approved ad past its expiry is removed once while invoices and tickets survive', async () => {
  const { state, firestore } = makeStore({
    status: 'approved', expiresAt: '2026-12-01T21:00:00Z', invoiceNumber: 'invoice',
    eventData: { id: 'event' }
  }, { event: { creatorId: owner } });
  const timestamp = await removeExpiredAd(firestore, 'ad', owner, now);
  assert.equal(timestamp, new Date(now).toISOString());
  assert.equal(await removeExpiredAd(firestore, 'ad', owner, now + 1000), timestamp);
  assert.deepEqual(state, {
    ad_submissions: { ad: {
      advertiserId: owner, status: 'approved', expiresAt: '2026-12-01T21:00:00Z',
      invoiceNumber: 'invoice', eventData: { id: 'event' }, removedFromAdvertiserAt: timestamp
    } },
    events: { event: { creatorId: owner } },
    bookings: { ticket: { eventId: 'event', status: 'confirmed' } }
  });
});

test('an archived submission is removable only by its owner', async () => {
  const { state, firestore } = makeStore({ status: 'archived' });
  await assert.rejects(removeExpiredAd(firestore, 'ad', 'another-user', now), /FORBIDDEN/);
  assert.equal(state.ad_submissions.ad.removedFromAdvertiserAt, undefined);
  assert.equal(await removeExpiredAd(firestore, 'ad', owner, now), new Date(now).toISOString());
});

test('a legacy submission can use its owned event reference to determine expiry', async () => {
  const { firestore } = makeStore({ status: 'approved', eventRef: 3879 }, {
    event: { creatorId: owner, eventRef: 3879, eventDate: '2026-12-01' }
  });
  assert.equal(await removeExpiredAd(firestore, 'ad', owner, now), new Date(now).toISOString());
});

test('active and pending submissions are not eligible', async () => {
  for (const status of ['approved', 'pending']) {
    const { state, firestore } = makeStore({
      status, expiresAt: '2026-12-03T21:00:00Z',
      eventData: { id: 'event', eventDate: '2026-12-01' }
    }, { event: { creatorId: 'another-user', eventDate: '2026-12-01' } });
    await assert.rejects(removeExpiredAd(firestore, 'ad', owner, now), /AD_NOT_EXPIRED/);
    assert.equal(state.ad_submissions.ad.removedFromAdvertiserAt, undefined);
  }
});
