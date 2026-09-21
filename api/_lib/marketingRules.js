import { calculateConversion } from './marketingMath.js';

function inWindow(rule, at = new Date()) {
  if (rule?.active !== true) return false;
  const time = at.getTime();
  const starts = rule?.startsAt ? new Date(rule.startsAt).getTime() : -Infinity;
  const ends = rule?.endsAt ? new Date(rule.endsAt).getTime() : Infinity;
  return Number.isFinite(starts) && starts > time ? false : Number.isFinite(ends) && ends < time ? false : true;
}

export async function findActiveMarketerByCode(firestore, code) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,32}$/.test(normalized)) return null;
  const snapshot = await firestore.collection('users').where('marketerCode', '==', normalized).limit(1).get();
  if (snapshot.empty) return null;
  const marketer = snapshot.docs[0];
  const data = marketer.data() || {};
  if (data.isMarketer !== true || data.marketerStatus !== 'active') return null;
  return { id: marketer.id, code: normalized, data };
}

export async function resolveBookingRule(firestore, { marketerId, eventId, eventReference, at = new Date() }) {
  const [snapshot, generalSnapshot] = await Promise.all([
    firestore.collection('marketer_rules').where('marketerId', '==', marketerId).limit(100).get(),
    firestore.collection('marketer_rules').where('marketerId', '==', '__all_marketers__').limit(20).get(),
  ]);
  const rules = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    .filter((rule) => rule.testMode !== true && inWindow(rule, at));
  const generalRules = generalSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    .filter((rule) => rule.configurationSource === 'admin_general_plan' && inWindow(rule, at));

  const specific = rules
     .filter((rule) => (rule.targetType === 'booking' || rule.targetType === 'event') && (rule.targetId === eventId || (eventReference && String(rule.targetReference || '').trim() === String(eventReference).trim())))
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))[0];
  if (specific) return { rule: specific, reason: 'marketer_event_booking' };

  // The global plan is the default. Personal rules are only event-specific exceptions.
  const generalFallback = generalRules.find((rule) => rule.targetType === 'booking' && rule.targetId === 'default');
  if (generalFallback) return { rule: generalFallback, reason: 'general_default_booking' };

  return { rule: null, reason: 'no_applicable_rule' };
}

export function marketingQuote(originalAmount, rule) {
  if (!rule) {
    return { originalAmount, customerDiscount: 0, customerFinalAmount: originalAmount, marketerReward: 0 };
  }
  return calculateConversion(originalAmount, rule);
}
