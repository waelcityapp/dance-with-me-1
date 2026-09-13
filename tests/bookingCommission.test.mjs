import test from 'node:test';
import assert from 'node:assert/strict';
import { settleCommission } from '../api/bookings.js';

function scenario(initialStatus) {
  const writes = [];
  const ledger = { id: 'booking_1_commission', type: 'ledger' };
  const user = { id: 'marketer_1', type: 'user' };
  const firestore = { collection: (name) => ({ doc: () => name === 'marketer_ledger' ? ledger : user }) };
  const tx = {
    get: async () => ({ exists: true, data: () => ({ status: initialStatus }) }),
    update: (ref, patch) => writes.push({ ref, patch }),
    set: (ref, patch) => writes.push({ ref, patch }),
  };
  const booking = { commissionLedgerId: ledger.id, marketerId: user.id, marketerCommissionAmount: 15, status: 'approved' };
  return { tx, firestore, booking, writes };
}

test('approval moves pending commission into available balance once', async () => {
  const x = scenario('pending');
  await settleCommission(x.tx, x.firestore, x.booking, 'available');
  assert.equal(x.writes[0].patch.status, 'available');
  assert.equal(x.writes[1].patch.marketerWalletPending.operand, -15);
  assert.equal(x.writes[1].patch.marketerWalletAvailable.operand, 15);
  const repeated = scenario('available');
  await settleCommission(repeated.tx, repeated.firestore, repeated.booking, 'available');
  assert.equal(repeated.writes.length, 0);
});

test('rejection or deletion reverses a pending commission', async () => {
  const x = scenario('pending');
  await settleCommission(x.tx, x.firestore, x.booking, 'reversed');
  assert.equal(x.writes[0].patch.status, 'reversed');
  assert.equal(x.writes[1].patch.marketerWalletPending.operand, -15);
});

test('cancelling an approved booking reverses available commission only once', async () => {
  const x = scenario('available');
  await settleCommission(x.tx, x.firestore, x.booking, 'reversed');
  assert.equal(x.writes[0].patch.status, 'reversed');
  assert.equal(x.writes[1].patch.marketerWalletAvailable.operand, -15);
  const repeated = scenario('reversed');
  await settleCommission(repeated.tx, repeated.firestore, repeated.booking, 'reversed');
  assert.equal(repeated.writes.length, 0);
});
