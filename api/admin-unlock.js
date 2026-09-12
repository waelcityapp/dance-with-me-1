import crypto from 'node:crypto';
import { getAdminDb, verifyRequestUser } from './_lib/firebaseAdmin.js';

function reply(res, status, body) { return res.status(status).json(body); }
function sameSecret(input, secret) {
  const left = Buffer.from(String(input || ''), 'utf8');
  const right = Buffer.from(String(secret || ''), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  try {
    const actor = await verifyRequestUser(req);
    const ownerEmail = String(process.env.ADMIN_EMAIL || 'waelvts@gmail.com').trim().toLowerCase();
    const profile = await getAdminDb().collection('users').doc(actor.uid).get();
    const isOwner = String(actor.email || '').trim().toLowerCase() === ownerEmail && actor.email_verified === true;
    if (!isOwner && profile.data()?.isAdmin !== true) return reply(res, 403, { error: 'ADMIN_ACCOUNT_REQUIRED' });
    const secret = process.env.ADMIN_UNLOCK_CODE;
    if (!secret) return reply(res, 503, { error: 'ADMIN_UNLOCK_NOT_CONFIGURED' });
    if (!sameSecret(req.body?.code, secret)) return reply(res, 401, { error: 'INVALID_CODE' });
    return reply(res, 200, { ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    return reply(res, message === 'UNAUTHENTICATED' ? 401 : 500, { error: message });
  }
}
