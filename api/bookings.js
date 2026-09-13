import { getAdminDb, verifyRequestUser, admin } from './_lib/firebaseAdmin.js';
import { calculateConversion } from './_lib/marketingMath.js';
import { findActiveMarketerByCode, resolveBookingRule } from './_lib/marketingRules.js';

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
function noMarketingQuote(amount) {
  return { originalAmount: amount, customerDiscount: 0, customerFinalAmount: amount, marketerReward: 0 };
}

export async function settleCommission(tx, firestore, booking, nextStatus) {
  const ledgerId = String(booking.commissionLedgerId || '').trim();
  const marketerId = String(booking.marketerId || '').trim();
  const amount = Number(booking.marketerCommissionAmount || 0);
  if (!ledgerId || !marketerId || !Number.isFinite(amount) || amount <= 0) return;

  const ledgerRef = firestore.collection('marketer_ledger').doc(ledgerId);
  const ledgerSnap = await tx.get(ledgerRef);
  if (!ledgerSnap.exists) return;
  const currentStatus = ledgerSnap.data()?.status;
  if (currentStatus === nextStatus || currentStatus === 'reversed') return;
  if (currentStatus !== 'pending' && currentStatus !== 'available') return;

  const userRef = firestore.collection('users').doc(marketerId);
  if (nextStatus === 'available' && currentStatus === 'pending') {
    tx.update(ledgerRef, { status: 'available', approvedAt: new Date().toISOString() });
    tx.set(userRef, {
      marketerWalletPending: admin.firestore.FieldValue.increment(-amount),
      marketerWalletAvailable: admin.firestore.FieldValue.increment(amount),
    }, { merge: true });
  } else if (nextStatus === 'reversed') {
    tx.update(ledgerRef, { status: 'reversed', reversedAt: new Date().toISOString(), reversalReason: booking.status });
    tx.set(userRef, {
      [currentStatus === 'available' ? 'marketerWalletAvailable' : 'marketerWalletPending']:
        admin.firestore.FieldValue.increment(-amount),
    }, { merge: true });
  }
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
      await firestore.runTransaction(async (tx) => {
        const fresh = await tx.get(bookingRef);
        if (!fresh.exists) return;
        await settleCommission(tx, firestore, fresh.data() || {}, 'reversed');
        tx.delete(bookingRef);
      });
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
      const originalAmount = Math.round(unitPrice * quantity * 100) / 100;
      const code = text(incoming.marketerCode, 32).toUpperCase();
      let marketer = null;
      let resolved = { rule: null, reason: 'no_marketer_code' };
      if (code) {
        marketer = await findActiveMarketerByCode(firestore, code);
        if (!marketer) return reply(res, 400, { error: 'MARKETER_CODE_INACTIVE' });
        resolved = await resolveBookingRule(firestore, { marketerId: marketer.id, eventId, eventReference: text(event.eventRef || event.adNumber || '') });
      }
      const quote = marketer ? (resolved.rule ? calculateConversion(originalAmount, resolved.rule) : noMarketingQuote(originalAmount)) : noMarketingQuote(originalAmount);
      const refNumber = text(incoming.refNumber, 80);
      const booking = {
        id: bookingId,
        eventId,
        eventTitleAr: text(event.titleAr || incoming.eventTitleAr),
        eventTitleEn: text(event.titleEn || incoming.eventTitleEn),
        eventPrice: unitPrice,
        originalTotalAmount: quote.originalAmount,
        marketingDiscountAmount: quote.customerDiscount,
        totalAmount: quote.customerFinalAmount,
        userId: actor.uid,
        userName: text(incoming.userName, 120),
        userPhone: text(incoming.userPhone, 30),
        numberOfIndividuals: quantity,
        receiptImage: text(incoming.receiptImage, 1500),
        status: 'pending',
        refNumber,
        submittedAt: new Date().toISOString(),
        eventDate: text(event.eventDate || incoming.eventDate, 80),
        marketerCode: marketer?.code || '',
        marketerId: marketer?.id || '',
        marketerRuleId: resolved.rule?.id || '',
        marketerRuleReason: resolved.reason,
        marketerCommissionAmount: quote.marketerReward,
        commissionStatus: quote.marketerReward > 0 ? 'pending' : 'none',
        commissionLedgerId: quote.marketerReward > 0 ? `booking_${bookingId}_commission` : '',
        marketingRuleSnapshot: resolved.rule || null,
      };
      const ledgerRef = booking.commissionLedgerId ? firestore.collection('marketer_ledger').doc(booking.commissionLedgerId) : null;
      await firestore.runTransaction(async (tx) => {
        const current = await tx.get(bookingRef);
        if (current.exists) return;
        tx.create(bookingRef, booking);
        if (ledgerRef && marketer) {
          tx.create(ledgerRef, {
            id: ledgerRef.id,
            marketerId: marketer.id,
            bookingId,
            eventId,
            type: 'commission',
            status: 'pending',
            amount: quote.marketerReward,
            customerDiscount: quote.customerDiscount,
            originalAmount: quote.originalAmount,
            customerFinalAmount: quote.customerFinalAmount,
            ruleSnapshot: resolved.rule,
            ruleReason: resolved.reason,
            createdAt: new Date().toISOString(),
            source: 'booking',
          });
          tx.set(firestore.collection('users').doc(marketer.id), {
            marketerWalletPending: admin.firestore.FieldValue.increment(quote.marketerReward),
          }, { merge: true });
        }
      });
      return reply(res, 200, { ok: true, booking });
    }

    const current = existing.data() || {};
    if (isAdmin && ['approved', 'rejected'].includes(incoming.status)) {
      const nextStatus = incoming.status;
      const discount = Math.max(0, Math.min(Number(incoming.discountAmount || 0), Number(current.totalAmount || 0)));
      const update = {
        status: nextStatus,
        userRead: false,
        adminNotes: text(incoming.adminNotes, 1000),
        reviewedAt: new Date().toISOString(),
      };
      if (nextStatus === 'approved') {
        update.discountAmount = Math.round(discount * 100) / 100;
        update.finalAmount = Math.round((Number(current.totalAmount || 0) - discount) * 100) / 100;
        update.barcodeUrl = text(incoming.barcodeUrl, 1500);
        update.accessCode = text(incoming.accessCode, 100);
      }
      await firestore.runTransaction(async (tx) => {
        const fresh = await tx.get(bookingRef);
        if (!fresh.exists) throw new Error('BOOKING_NOT_FOUND');
        const freshBooking = fresh.data() || {};
        await settleCommission(tx, firestore, freshBooking, nextStatus === 'approved' ? 'available' : 'reversed');
        tx.set(bookingRef, update, { merge: true });
      });
      return reply(res, 200, { ok: true });
    }

    if (current.userId === actor.uid && incoming.status === 'cancelled') {
      await firestore.runTransaction(async (tx) => {
        const fresh = await tx.get(bookingRef);
        if (!fresh.exists) throw new Error('BOOKING_NOT_FOUND');
        const freshBooking = fresh.data() || {};
        await settleCommission(tx, firestore, freshBooking, 'reversed');
        tx.set(bookingRef, { status: 'cancelled', userRead: false, cancelledAt: new Date().toISOString() }, { merge: true });
      });
      return reply(res, 200, { ok: true });
    }

    return reply(res, 403, { error: 'BOOKING_UPDATE_NOT_ALLOWED' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const status = message === 'UNAUTHENTICATED' ? 401 : message.startsWith('INVALID_') ? 400 : 500;
    return reply(res, status, { error: message });
  }
}
