import { getAdminDb, verifyRequestUser } from './_lib/firebaseAdmin.js';
import { marketingQuote, findActiveMarketerByCode, resolveBookingRule } from './_lib/marketingRules.js';

function reply(res, status, body) { return res.status(status).json(body); }
function text(value, max = 160) { return String(value || '').trim().slice(0, max); }
function eventUnitPrice(event) {
  const candidates = [event?.ticketPrice, event?.price, event?.priceAr, event?.priceEn];
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0) return candidate;
    const match = String(candidate || '').replace(/,/g, '').match(/\d+(?:\.\d+)?/);
    if (match) return Number(match[0]);
  }
  return 0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { ok: false, error: 'METHOD_NOT_ALLOWED' });
  try {
    await verifyRequestUser(req);
    const code = text(req.body?.code, 32).toUpperCase();
    const eventId = text(req.body?.eventId, 140);
    const quantity = Math.max(1, Math.min(20, Math.trunc(Number(req.body?.quantity || 1))));
    if (!code || !eventId) return reply(res, 400, { ok: false, error: 'CODE_AND_EVENT_REQUIRED' });

    const firestore = getAdminDb();
    const marketer = await findActiveMarketerByCode(firestore, code);
    if (!marketer) return reply(res, 404, { ok: false, error: 'MARKETER_CODE_INACTIVE' });
    const eventSnap = await firestore.collection('events').doc(eventId).get();
    if (!eventSnap.exists) return reply(res, 404, { ok: false, error: 'EVENT_NOT_FOUND' });
    const originalAmount = Math.round(eventUnitPrice(eventSnap.data()) * quantity * 100) / 100;
    const resolved = await resolveBookingRule(firestore, { marketerId: marketer.id, eventId });
    const quote = marketingQuote(originalAmount, resolved.rule);
    return reply(res, 200, { ok: true, code: marketer.code, marketerId: marketer.id, ...quote, ruleReason: resolved.reason });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    return reply(res, message === 'UNAUTHENTICATED' ? 401 : 500, { ok: false, error: message });
  }
}
