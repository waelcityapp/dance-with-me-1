import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveBookingRule, marketingQuote } from '../api/_lib/marketingRules.js';

const rule = (id, data) => ({ id, data: () => data });
const firestore = (rules) => ({
  collection: () => ({
    where: () => ({ limit: () => ({ get: async () => ({ docs: rules }) }) }),
  }),
});

const defaultRule = rule('default', {
  marketerId: 'marketer-1', active: true, scope: 'default', targetType: 'booking', targetId: 'default',
  customerDiscount: { type: 'percentage', value: 10 }, marketerReward: { type: 'fixed', value: 20 },
});
const eventRule = rule('event', {
  marketerId: 'marketer-1', active: true, scope: 'event', targetType: 'booking', targetId: 'old-event-id',
  targetReference: 'EVENT-42', customerDiscount: { type: 'percentage', value: 20 },
  marketerReward: { type: 'fixed', value: 30 },
});

test('specific booking agreement overrides the default by event reference', async () => {
  const result = await resolveBookingRule(firestore([defaultRule, eventRule]), {
    marketerId: 'marketer-1', eventId: 'new-event-id', eventReference: 'EVENT-42',
  });
  assert.equal(result.rule.id, 'event');
  assert.equal(marketingQuote(1000, result.rule).customerFinalAmount, 800);
});

test('default booking agreement applies to other events', async () => {
  const result = await resolveBookingRule(firestore([defaultRule, eventRule]), {
    marketerId: 'marketer-1', eventId: 'another-event', eventReference: 'OTHER',
  });
  assert.equal(result.rule.id, 'default');
  assert.equal(marketingQuote(1000, result.rule).customerFinalAmount, 900);
});

test('an active code alone does not create a discount without a booking agreement', async () => {
  const result = await resolveBookingRule(firestore([]), { marketerId: 'marketer-1', eventId: 'event-1' });
  assert.equal(result.reason, 'no_applicable_rule');
  assert.equal(marketingQuote(1000, result.rule).customerFinalAmount, 1000);
});
