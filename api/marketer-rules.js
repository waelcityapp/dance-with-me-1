import { getAdminDb, verifyRequestUser } from './_lib/firebaseAdmin.js';

function cleanId(value, field) {
  const result = String(value || '').trim();
  if (!result || result.length > 160 || /[\\/]/.test(result)) throw new Error(`INVALID_${field}`);
  return result;
}

function ruleValue(input, field) {
  if (!['fixed', 'percentage'].includes(input?.type)) throw new Error(`INVALID_${field}_TYPE`);
  const value = Number(input?.value);
  if (!Number.isFinite(value) || value < 0 || (input.type === 'percentage' && value > 100)) throw new Error(`INVALID_${field}_VALUE`);
  return { type: input.type, value: Math.round(value * 100) / 100 };
}

async function requireAdmin(req) {
  const decoded = await verifyRequestUser(req);
  const profile = await getAdminDb().collection('users').doc(decoded.uid).get();
  if (!profile.exists || profile.data()?.isAdmin !== true) throw new Error('ADMIN_REQUIRED');
  return decoded.uid;
}

const now = () => new Date().toISOString();
const reply = (res, status, body) => res.status(status).json(body);

export default async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  try {
    const adminId = await requireAdmin(req);
    const firestore = getAdminDb();
    const action = String(req.body?.action || '');
    const marketerId = cleanId(req.body?.marketerId, 'MARKETER_ID');
    const marketer = await firestore.collection('users').doc(marketerId).get();
    if (!marketer.exists || (!marketer.data()?.isMarketer && !marketer.data()?.marketerCode)) throw new Error('MARKETER_NOT_FOUND');

    if (action === 'list') {
      const snapshot = await firestore.collection('marketer_rules').where('marketerId', '==', marketerId).limit(100).get();
      const rules = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        .filter((item) => item.configurationSource === 'admin_marketer_settings')
        .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
      return reply(res, 200, { ok: true, rules });
    }

    if (action === 'save') {
      const scope = req.body?.scope === 'event' ? 'event' : 'default';
      const targetType = scope === 'event' ? 'event' : (req.body?.targetType === 'booking' ? 'booking' : 'advertisement');
      let targetId = 'default';
      let targetReference = '';
      let eventSnapshot;

      if (scope === 'event') {
        targetId = cleanId(req.body?.targetId, 'TARGET_ID');
        const event = await firestore.collection('events').doc(targetId).get();
        if (!event.exists) throw new Error('EVENT_NOT_FOUND');
        const data = event.data() || {};
        targetReference = String(data.eventRef || data.adNumber || '').trim();
        if (!targetReference) throw new Error('EVENT_REFERENCE_REQUIRED');
        eventSnapshot = {
          titleAr: String(data.titleAr || ''), titleEn: String(data.titleEn || ''),
          mediaUrl: String(data.mediaUrl || ''), thumbnailUrl: String(data.thumbnailUrl || ''),
          eventDate: String(data.eventDate || ''), adType: String(data.adType || ''),
          priceAr: String(data.priceAr || ''), priceEn: String(data.priceEn || ''),
        };
      }

      const ruleId = `settings_${marketerId}_${targetType}_${targetId}`;
      const rule = {
        id: ruleId, marketerId, scope, targetType, targetId, targetReference,
        customerDiscount: ruleValue(req.body?.customerDiscount, 'CUSTOMER_DISCOUNT'),
        marketerReward: ruleValue(req.body?.marketerReward, 'MARKETER_REWARD'),
        active: req.body?.active !== false,
        startsAt: String(req.body?.startsAt || ''), endsAt: String(req.body?.endsAt || ''),
        eventSnapshot: eventSnapshot || null,
        configurationSource: 'admin_marketer_settings', appliedToLivePricing: false,
        updatedAt: now(), updatedBy: adminId,
      };
      await firestore.collection('marketer_rules').doc(ruleId).set(rule, { merge: true });
      return reply(res, 200, { ok: true, rule });
    }

    if (action === 'set_status') {
      const ruleId = cleanId(req.body?.ruleId, 'RULE_ID');
      const ref = firestore.collection('marketer_rules').doc(ruleId);
      const current = await ref.get();
      if (!current.exists || current.data()?.marketerId !== marketerId || current.data()?.configurationSource !== 'admin_marketer_settings') throw new Error('RULE_NOT_FOUND');
      const patch = { active: req.body?.active === true, updatedAt: now(), updatedBy: adminId };
      await ref.set(patch, { merge: true });
      return reply(res, 200, { ok: true, rule: { id: ruleId, ...current.data(), ...patch } });
    }

    return reply(res, 400, { error: 'UNKNOWN_ACTION' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    return reply(res, ['UNAUTHENTICATED', 'ADMIN_REQUIRED'].includes(message) ? 403 : 400, { error: message });
  }
}
