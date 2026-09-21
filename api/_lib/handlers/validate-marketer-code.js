import { getAdminDb, verifyRequestUser } from '../firebaseAdmin.js';

function reply(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

function normalizeCode(value) {
  const code = String(value || '').trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,32}$/.test(code)) throw new Error('INVALID_CODE_FORMAT');
  return code;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { valid: false, error: 'METHOD_NOT_ALLOWED' });

  try {
    await verifyRequestUser(req);
    const code = normalizeCode(req.body?.code);
    const snapshot = await getAdminDb().collection('users').where('marketerCode', '==', code).limit(1).get();
    if (snapshot.empty) return reply(res, 404, { valid: false, error: 'MARKETER_CODE_NOT_FOUND' });

    const marketer = snapshot.docs[0];
    const data = marketer.data() || {};
    if (data.isMarketer !== true || data.marketerStatus !== 'active') {
      return reply(res, 404, { valid: false, error: 'MARKETER_CODE_INACTIVE' });
    }

    return reply(res, 200, { valid: true, code, marketerId: marketer.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const status = message === 'UNAUTHENTICATED' ? 401 : message === 'INVALID_CODE_FORMAT' ? 400 : 500;
    return reply(res, status, { valid: false, error: message });
  }
}
