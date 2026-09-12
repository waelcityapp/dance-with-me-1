export function money(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw new Error('INVALID_AMOUNT');
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function calculateReward(baseAmount, rule) {
  const base = money(baseAmount);
  const type = rule?.type;
  const value = money(rule?.value ?? 0);
  if (type === 'percentage') return money((base * value) / 100);
  if (type === 'fixed') return Math.min(base, value);
  throw new Error('INVALID_RULE_TYPE');
}

export function calculateConversion(baseAmount, rule) {
  const base = money(baseAmount);
  const customerDiscount = Math.min(base, calculateReward(base, rule.customerDiscount));
  const marketerReward = calculateReward(base, rule.marketerReward);
  return {
    originalAmount: base,
    customerDiscount,
    customerFinalAmount: money(base - customerDiscount),
    marketerReward,
  };
}
