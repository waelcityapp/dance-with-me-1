import { isEventExpired } from '../../../shared/eventExpiry.js';
import { admin, getAdminDb, verifyRequestUser } from '../firebaseAdmin.js';
import { adReportActions, adReportSources } from '../../../shared/adReporting.js';

const cairoDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' });
const validEventId = id => typeof id === 'string' && id.length > 0 && id.length <= 150 && id !== '.' && id !== '..' && !/[\\/\u0000-\u001f]/.test(id);

export default async function adReport(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();

  const { eventId, action, source, days: requestedDays } = req.body ?? {};
  if (!validEventId(eventId)) return res.status(400).end();

  if (action !== 'summary') {
    if (!adReportSources.includes(source) || !adReportActions.includes(action)) return res.status(400).end();
    if (req.headers['sec-fetch-site'] !== 'same-origin') return res.status(403).end();
    // Preview deployments share Firestore with production.
    if (process.env.VERCEL_ENV !== 'production') return res.status(204).end();
    try {
      const db = getAdminDb();
      const event = (await db.collection('events').doc(eventId).get()).data();
      if (!event || event.isPaused || event.isEmpty || event.isArchived || event.isExpiredBy15DaysRule || isEventExpired(event.eventDate)) return res.status(204).end();
      const day = cairoDate.format(new Date());
      const field = `${source}_${action}`;
      await db.collection('ad_reports').doc(eventId).collection('days').doc(day).set({
        [field]: admin.firestore.FieldValue.increment(1),
      }, { merge: true });
      return res.status(204).end();
    } catch (error) {
      console.error('Ad report write failed:', error.message);
      return res.status(503).end();
    }
  }

  try {
    const actor = await verifyRequestUser(req).catch(() => null);
    if (!actor) return res.status(401).end();
    const db = getAdminDb();
    const owner = String(process.env.ADMIN_EMAIL || 'waelvts@gmail.com').trim().toLowerCase();
    const isOwner = actor.email_verified && actor.email?.trim().toLowerCase() === owner;
    if (!isOwner && actor.admin !== true) {
      return res.status(403).end();
    }

    const days = requestedDays === 30 ? 30 : 7;
    // Move across calendar days using noon UTC, which also falls on that day in Cairo.
    const today = new Date(`${cairoDate.format(new Date())}T12:00:00Z`);
    today.setUTCDate(today.getUTCDate() - days + 1);
    const start = today.toISOString().slice(0, 10);
    const snapshot = await db.collection('ad_reports').doc(eventId).collection('days')
      .where(admin.firestore.FieldPath.documentId(), '>=', start).limit(days).get();
    const totals = {};
    for (const day of snapshot.docs) {
      const counts = day.data();
      for (const source of adReportSources) {
        for (const action of adReportActions) {
          const field = `${source}_${action}`;
          const count = counts[field];
          if (Number.isSafeInteger(count) && count > 0) totals[field] = (totals[field] || 0) + count;
        }
      }
    }
    return res.status(200).json({ totals });
  } catch (error) {
    console.error('Ad report read failed:', error.message);
    return res.status(503).end();
  }
}
