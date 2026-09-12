import { getAdminDb, verifyRequestUser } from './_lib/firebaseAdmin.js';

const OWNER_EMAIL = String(process.env.ADMIN_EMAIL || 'waelvts@gmail.com').trim().toLowerCase();

function reply(res, status, body) { return res.status(status).json(body); }
function cleanId(value, field) {
  const result = String(value || '').trim();
  if (!result || result.length > 140 || result.includes('/')) throw new Error(`INVALID_${field}`);
  return result;
}
function text(value, max = 300) { return String(value || '').trim().slice(0, max); }
function eventUnitPrice(event) {
  const candidates = [event?.ticketPrice, event?.price, event?.priceAr, event?.priceEn];
  for (const candidate of candidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0) return candidate;
    const normalized = String(candidate || '').replace(/,/g, '');
    const match = normalized.match(/\d+(?:\.\d+)?/);
    if (match) return Number(match[0]);
  }
  return 0;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  try {
    const actor = await verifyRequestUser(req);
    const firestore = getAdminDb();
    const actorEmail = String(actor.email || '').trim().toLowerCase();
    const actorProfile = await firestore.collection('users').doc(actor.uid).get();
    const isAdmin = (actorEmail === OWNER_EMAIL && actor.email_verified === true)
      || actorProfile.data()?.isAdmin === true;
    const action = String(req.body?.action || 'save');
    const incoming = req.body?.booking || {};
    const bookingId = cleanId(req.body?.bookingId || incoming.id, 'BOOKING_ID');
    const bookingRef = firestore.collection('bookings').doc(bookingId);

    if (action === 'delete') {
      const existing = await bookingRef.get();
      if (!existing.exists) return reply(res, 404, { error: 'BOOKING_NOT_FOUND' });
      if (!isAdmin && existing.data()?.userId !== actor.uid) return reply(res, 403, { error: 'FORBIDDEN' });
      await bookingRef.delete();
      return reply(res, 200, { ok: true });
    }

    const existing = await bookingRef.get();
    if (!existing.exists) {
      const eventId = cleanId(incoming.eventId, 'EVENT_ID');
      const eventSnapshot = await firestore.collection('events').doc(eventId).get();
      if (!eventSnapshot.exists) return reply(res, 404, { error: 'EVENT_NOT_FOUND' });
      const event = eventSnapshot.data() || {};
      const quantity = Math.max(1, Math.min(20, Math.trunc(Number(incoming.numberOfIndividuals || 1))));
      const unitPrice = eventUnitPrice(event);
      const booking = {
        id: bookingId,
        eventId,
        eventTitleAr: text(event.titleAr || incoming.eventTitleAr),
        eventTitleEn: text(event.titleEn || incoming.eventTitleEn),
        eventPrice: unitPrice,
        userId: actor.uid,
        userName: text(incoming.userName, 120),
        userPhone: text(incoming.userPhone, 30),
        numberOfIndividuals: quantity,
        totalAmount: Math.round(unitPrice * quantity * 100) / 100,
        receiptImage: text(incoming.receiptImage, 1500),
        status: 'pending',
        refNumber: text(incoming.refNumber, 80),
        submittedAt: new Date().toISOString(),
        eventDate: text(event.eventDate || incoming.eventDate, 80),
      };
      await bookingRef.create(booking);
      return reply(res, 200, { ok: true, booking });
    }

    const current = existing.data() || {};
    if (isAdmin && ['approved', 'rejected'].includes(incoming.status)) {
      const update = {
        status: incoming.status,
        userRead: false,
        adminNotes: text(incoming.adminNotes, 1000),
        reviewedAt: new Date().toISOString(),
      };
      if (incoming.status === 'approved') {
        const discount = Math.max(0, Math.min(Number(incoming.discountAmount || 0), Number(current.totalAmount || 0)));
        update.discountAmount = Math.round(discount * 100) / 100;
        update.finalAmount = Math.round((Number(current.totalAmount || 0) - discount) * 100) / 100;
        update.barcodeUrl = text(incoming.barcodeUrl, 1500);
        update.accessCode = text(incoming.accessCode, 100);
      }
      await bookingRef.set(update, { merge: true });
      return reply(res, 200, { ok: true });
    }

    if (current.userId === actor.uid && incoming.status === 'cancelled') {
      await bookingRef.set({ status: 'cancelled', userRead: false, cancelledAt: new Date().toISOString() }, { merge: true });
      return reply(res, 200, { ok: true });
    }

    return reply(res, 403, { error: 'BOOKING_UPDATE_NOT_ALLOWED' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const status = message === 'UNAUTHENTICATED' ? 401 : message.startsWith('INVALID_') ? 400 : 500;
    return reply(res, status, { error: message });
  }
}

