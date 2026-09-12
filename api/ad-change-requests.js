import { getAdminDb, verifyRequestUser } from './_lib/firebaseAdmin.js';

const MAX_REQUESTS_PER_DAY = 4;

function reply(res, status, body) { return res.status(status).json(body); }
function safeId(value, field) {
  const clean = String(value || '').trim();
  if (!clean || clean.length > 140 || /[\\/]/.test(clean)) throw new Error(`INVALID_${field}`);
  return clean;
}
function cairoDayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' }).format(date);
}
function isAdminProfile(decoded, profile) {
  const owner = String(process.env.ADMIN_EMAIL || 'waelvts@gmail.com').trim().toLowerCase();
  return (String(decoded.email || '').trim().toLowerCase() === owner && decoded.email_verified === true)
    || profile?.isAdmin === true;
}
function safeProposedData(data) {
  const copy = { ...data };
  for (const key of ['id', 'advertiserId', 'status', 'eventRef', 'reviewedAt', 'reviewedBy', 'expiresAt', 'archivedAt', 'submittedAt']) delete copy[key];
  if (copy.eventData && typeof copy.eventData === 'object') {
    copy.eventData = { ...copy.eventData };
    delete copy.eventData.id;
    delete copy.eventData.eventRef;
    delete copy.eventData.creatorId;
  }
  return copy;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  try {
    const actor = await verifyRequestUser(req);
    const firestore = getAdminDb();
    const actorProfile = await firestore.collection('users').doc(actor.uid).get();
    const action = String(req.body?.action || 'create');

    if (action === 'review') {
      if (!isAdminProfile(actor, actorProfile.data() || {})) return reply(res, 403, { error: 'ADMIN_REQUIRED' });
      const requestId = safeId(req.body?.requestId, 'REQUEST_ID');
      const decision = String(req.body?.decision || '');
      if (!['approve', 'reject'].includes(decision)) return reply(res, 400, { error: 'INVALID_DECISION' });
      const requestRef = firestore.collection('ad_change_requests').doc(requestId);
      const result = await firestore.runTransaction(async (tx) => {
        const requestSnapshot = await tx.get(requestRef);
        if (!requestSnapshot.exists) throw new Error('CHANGE_REQUEST_NOT_FOUND');
        const request = requestSnapshot.data() || {};
        if (request.status !== 'pending') throw new Error('CHANGE_REQUEST_ALREADY_REVIEWED');
        const adRef = firestore.collection('ad_submissions').doc(request.targetId);
        const adSnapshot = await tx.get(adRef);
        if (!adSnapshot.exists) throw new Error('AD_NOT_FOUND');
        const now = new Date().toISOString();
        const review = { status: decision === 'approve' ? 'approved' : 'rejected', reviewedAt: now, reviewedBy: actor.uid, reviewNote: String(req.body?.reviewNote || '').slice(0, 1000) };
        if (decision === 'reject') {
          tx.set(requestRef, review, { merge: true });
          return { eventId: null };
        }
        const currentAd = adSnapshot.data() || {};
        const change = safeProposedData(request.proposedData || {});
        const nextAd = { ...change, reviewedAt: now };
        if (request.requestType === 'renew') nextAd.renewalCount = Number(currentAd.renewalCount || 0) + 1;
        if (request.requestType === 'archive') {
          nextAd.status = 'archived';
          nextAd.archivedAt = now;
        }
        if (['renew', 'republish', 'reactivate'].includes(request.requestType)) {
          nextAd.status = 'approved';
          nextAd.archivedAt = null;
        }
        tx.set(adRef, nextAd, { merge: true });
        const eventId = String(currentAd.eventData?.id || '').trim();
        if (eventId) {
          const eventChange = change.eventData && typeof change.eventData === 'object' ? { ...change.eventData } : {};
          delete eventChange.id;
          delete eventChange.eventRef;
          tx.set(firestore.collection('events').doc(eventId), {
            ...eventChange,
            ...(request.requestType === 'archive' ? { status: 'archived', archivedAt: now } : {}),
            id: eventId,
            eventRef: currentAd.eventRef || currentAd.eventData?.eventRef,
          }, { merge: true });
        }
        tx.set(requestRef, review, { merge: true });
        return { eventId: eventId || null };
      });
      return reply(res, 200, { ok: true, ...result });
    }

    const targetId = safeId(req.body?.targetId, 'TARGET_ID');
    const requestType = String(req.body?.requestType || '');
    if (!['edit', 'renew', 'republish', 'reactivate', 'archive'].includes(requestType)) {
      return reply(res, 400, { error: 'INVALID_REQUEST_TYPE' });
    }
    if (!req.body?.proposedData || typeof req.body.proposedData !== 'object' || Array.isArray(req.body.proposedData)) {
      return reply(res, 400, { error: 'INVALID_PROPOSED_DATA' });
    }

    const adRef = firestore.collection('ad_submissions').doc(targetId);
    const day = cairoDayKey();
    const limitRef = firestore.collection('ad_change_rate_limits').doc(`${actor.uid}_${targetId}_${day}`);
    const requestRef = firestore.collection('ad_change_requests').doc();

    const result = await firestore.runTransaction(async (tx) => {
      const [adSnapshot, limitSnapshot] = await Promise.all([tx.get(adRef), tx.get(limitRef)]);
      if (!adSnapshot.exists) throw new Error('AD_NOT_FOUND');
      if (adSnapshot.data()?.advertiserId !== actor.uid) throw new Error('FORBIDDEN');
      const used = Number(limitSnapshot.data()?.count || 0);
      if (used >= MAX_REQUESTS_PER_DAY) throw new Error('DAILY_CHANGE_LIMIT_REACHED');

      const now = new Date().toISOString();
      const changeRequest = {
        id: requestRef.id,
        advertiserId: actor.uid,
        targetId,
        requestType,
        status: 'pending',
        proposedData: req.body.proposedData,
        submittedAt: now,
        dayKey: day,
      };
      tx.set(requestRef, changeRequest);
      tx.set(limitRef, { advertiserId: actor.uid, targetId, dayKey: day, count: used + 1, updatedAt: now }, { merge: true });
      return { id: requestRef.id, remainingToday: MAX_REQUESTS_PER_DAY - used - 1 };
    });

    return reply(res, 200, { ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const status = message === 'UNAUTHENTICATED' ? 401
      : message === 'FORBIDDEN' ? 403
      : message === 'DAILY_CHANGE_LIMIT_REACHED' ? 429
      : message === 'AD_NOT_FOUND' ? 404
      : message.startsWith('INVALID_') ? 400 : 500;
    return reply(res, status, { error: message });
  }
}
