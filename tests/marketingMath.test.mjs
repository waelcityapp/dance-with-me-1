import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateConversion, calculateReward } from '../api/_lib/marketingMath.js';

test('calculates a fixed customer discount and marketer reward', () => {
  assert.deepEqual(calculateConversion(1000, {
    customerDiscount: { type: 'fixed', value: 50 },
    marketerReward: { type: 'fixed', value: 20 },
  }), { originalAmount: 1000, customerDiscount: 50, customerFinalAmount: 950, marketerReward: 20 });
});

test('calculates percentage agreements without rounding drift', () => {
  assert.deepEqual(calculateConversion(999.99, {
    customerDiscount: { type: 'percentage', value: 10 },
    marketerReward: { type: 'percentage', value: 5 },
  }), { originalAmount: 999.99, customerDiscount: 100, customerFinalAmount: 899.99, marketerReward: 50 });
});

test('does not let a customer discount exceed the order amount', () => {
  assert.equal(calculateReward(100, { type: 'fixed', value: 250 }), 100);
});

test('rejects invalid money and agreement types', () => {
  assert.throws(() => calculateReward(-1, { type: 'fixed', value: 1 }), /INVALID_AMOUNT/);
  assert.throws(() => calculateReward(1, { type: 'unknown', value: 1 }), /INVALID_RULE_TYPE/);
});

