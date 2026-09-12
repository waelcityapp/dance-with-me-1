import { getAdminDb, verifyRequestUser } from './_lib/firebaseAdmin.js';

const FIRST_ACCOUNT_NUMBER = 10001;
const OWNER_ACCOUNT_REFERENCE = 'CE1000';
const OWNER_EMAIL = String(process.env.ADMIN_EMAIL || 'waelvts@gmail.com').trim().toLowerCase();

function reply(res, status, body) {
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { error: 'METHOD_NOT_ALLOWED' });

  try {
    const actor = await verifyRequestUser(req);
    const requestedUserId = String(req.body?.userId || actor.uid).trim();
    if (!requestedUserId || requestedUserId.includes('/')) return reply(res, 400, { error: 'INVALID_USER_ID' });

    const actorEmail = String(actor.email || '').trim().toLowerCase();
    const isOwner = actorEmail === OWNER_EMAIL && actor.email_verified === true;
    if (requestedUserId !== actor.uid && !isOwner) return reply(res, 403, { error: 'FORBIDDEN' });

    const firestore = getAdminDb();
    const userRef = firestore.collection('users').doc(requestedUserId);
    const counterRef = firestore.collection('system_counters').doc('user_account_reference');

    const accountReference = await firestore.runTransaction(async (tx) => {
      const userSnapshot = await tx.get(userRef);
      if (!userSnapshot.exists) throw new Error('USER_NOT_FOUND');

      const userData = userSnapshot.data() || {};
      const userEmail = String(userData.email || '').trim().toLowerCase();
      const current = String(userData.accountReference || '').trim();
      const now = new Date().toISOString();

      if (userEmail === OWNER_EMAIL) {
        if (current !== OWNER_ACCOUNT_REFERENCE) {
          tx.set(userRef, { accountReference: OWNER_ACCOUNT_REFERENCE, accountReferenceUpdatedAt: now }, { merge: true });
        }
        return OWNER_ACCOUNT_REFERENCE;
      }

      if (/^CE\d{5,}$/.test(current)) return current;
      const legacy = current.match(/^CE-(\d{5,})$/);
      if (legacy) {
        const migrated = `CE${legacy[1]}`;
        tx.set(userRef, { accountReference: migrated, accountReferenceUpdatedAt: now }, { merge: true });
        return migrated;
      }

      const counterSnapshot = await tx.get(counterRef);
      const stored = Number(counterSnapshot.data()?.lastNumber || FIRST_ACCOUNT_NUMBER - 1);
      const next = Math.max(Number.isFinite(stored) ? stored : 0, FIRST_ACCOUNT_NUMBER - 1) + 1;
      const reference = `CE${next}`;
      tx.set(counterRef, { lastNumber: next, updatedAt: now }, { merge: true });
      tx.set(userRef, { accountReference: reference, accountReferenceCreatedAt: now }, { merge: true });
      return reference;
    });

    return reply(res, 200, { ok: true, accountReference });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const status = message === 'UNAUTHENTICATED' ? 401 : message === 'USER_NOT_FOUND' ? 404 : 500;
    return reply(res, status, { error: message });
  }
}

