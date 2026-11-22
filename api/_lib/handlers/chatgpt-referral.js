import { admin, getAdminDb } from '../firebaseAdmin.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  if (req.headers['sec-fetch-site'] !== 'same-origin') return res.status(403).end();

  // Preview and production share Firestore. Exercise the request without updating live totals.
  if (process.env.VERCEL_ENV !== 'production') return res.status(204).end();

  try {
    const db = getAdminDb();
    const batch = db.batch();
    const date = new Date().toISOString().slice(0, 10);
    const chatgpt_visits = admin.firestore.FieldValue.increment(1);
    batch.set(db.doc('analytics/counters'), { chatgpt_visits }, { merge: true });
    batch.set(db.doc(`analytics_daily/${date}`), { date, chatgpt_visits }, { merge: true });
    await batch.commit();
    return res.status(204).end();
  } catch (error) {
    console.error('ChatGPT referral counter failed:', error.message);
    return res.status(503).end();
  }
}
