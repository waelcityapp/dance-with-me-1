import test from 'node:test';
import assert from 'node:assert/strict';
import { settleCommission } from '../api/bookings.js';

function scenario(status, exists = true) {
  const writes = [];
  const firestore = { collection: (name) => ({ doc: (id) => ({ name, id }) }) };
  const tx = {
    get: async () => ({ exists, data: () => ({ status }) }),
    update: (ref, value) => writes.push({ type: 'update', ref, value }),
    set: (ref, value) => writes.push({ type: 'set', ref, value }),
  };
  const booking = { commissionLedgerId: 'ledger-1', marketerId: 'marketer-1', marketerCommissionAmount: 20 };
  return { tx, firestore, booking, writes };
}

test('approval makes a pending commission available in the same transaction', async () => {
  const { tx, firestore, booking, writes } = scenario('pending');
  assert.equal(await settleCommission(tx, firestore, booking, 'available'), 'available');
  assert.deepEqual(writes.map(({ type, ref }) => [type, ref.name, ref.id]), [
    ['update', 'marketer_ledger', 'ledger-1'], ['set', 'users', 'marketer-1'],
  ]);
  assert.equal(writes[0].value.status, 'available');
});

test('repeated approval leaves the wallet unchanged', async () => {
  const { tx, firestore, booking, writes } = scenario('available');
  assert.equal(await settleCommission(tx, firestore, booking, 'available'), 'available');
  assert.equal(writes.length, 0);
});

test('rejection or cancellation reverses an available commission', async () => {
  const { tx, firestore, booking, writes } = scenario('available');
  assert.equal(await settleCommission(tx, firestore, booking, 'reversed'), 'reversed');
  assert.equal(writes[0].value.status, 'reversed');
  assert.equal(writes[1].ref.name, 'users');
});

test('an approval cannot reactivate a reversed or missing commission', async () => {
  const reversed = scenario('reversed');
  await assert.rejects(settleCommission(reversed.tx, reversed.firestore, reversed.booking, 'available'), /COMMISSION_ALREADY_REVERSED/);
  assert.equal(reversed.writes.length, 0);
  const missing = scenario('pending', false);
  await assert.rejects(settleCommission(missing.tx, missing.firestore, missing.booking, 'available'), /COMMISSION_LEDGER_MISSING/);
  assert.equal(missing.writes.length, 0);
});

test('bookings without commission require no ledger or wallet update', async () => {
  const { tx, firestore, booking, writes } = scenario('pending');
  booking.marketerCommissionAmount = 0;
  assert.equal(await settleCommission(tx, firestore, booking, 'available'), 'none');
  assert.equal(writes.length, 0);
});
