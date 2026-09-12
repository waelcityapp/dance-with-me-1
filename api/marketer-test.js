import { createRequire } from 'node:module';
import { calculateConversion, money } from './_lib/marketingMath.js';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

function getAdminApp() {
  if (admin.apps.length) return admin.app();
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) throw new Error('FIREBASE_ADMIN_NOT_CONFIGURED');
  return admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
}

function db() {
  const databaseId = process.env.FIREBASE_DATABASE_ID;
  return admin.firestore(getAdminApp(), databaseId && databaseId !== '(default)' ? databaseId : undefined);
}

function now() { return new Date().toISOString(); }
function id(value, field) {
  const clean = String(value || '').trim();
  if (!clean || clean.length > 120 || /[\\/]/.test(clean)) throw new Error(`INVALID_${field}`);
  return clean;
}
function ruleValue(input, field) {
  const type = input?.type;
  if (type !== 'fixed' && type !== 'percentage') throw new Error(`INVALID_${field}_TYPE`);
  const value = money(input?.value);
  if (type === 'percentage' && value > 100) throw new Error(`INVALID_${field}_PERCENTAGE`);
  return { type, value };
}
function reply(res, status, body) { return res.status(status).json(body); }

async function actor(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('UNAUTHENTICATED');
  const decoded = await admin.auth(getAdminApp()).verifyIdToken(token);
  const profile = await db().collection('users').doc(decoded.uid).get();
  if (!profile.exists || profile.data()?.isAdmin !== true) throw new Error('ADMIN_REQUIRED');
  return { uid: decoded.uid, email: String(decoded.email || '').toLowerCase(), profile: profile.data() || {} };
}

function testOwner(actorData) {
  const configuredEmail = String(process.env.MARKETER_TEST_OWNER_EMAIL || '').trim().toLowerCase();
  return Boolean(configuredEmail) && actorData.email === configuredEmail && actorData.profile.isTestAccount === true;
}

function ledgerId(uid, clientRequestId) { return `test_${id(uid, 'UID')}_${id(clientRequestId, 'REQUEST_ID')}`; }

async function getWallet(uid) {
  const user = await db().collection('users').doc(uid).get();
  return {
    available: Number(user.data()?.marketerWalletAvailable || 0),
    pending: Number(user.data()?.marketerWalletPending || 0),
    paid: Number(user.data()?.marketerWalletPaid || 0),
  };
}

async function latestLedger(uid) {
  const snapshot = await db().collection('marketer_ledger').where('marketerId', '==', uid).where('testMode', '==', true).limit(30).get();
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  try {
    const action = String(req.body?.action || '');
    const user = await actor(req);
    const firestore = db();

    if (action === 'activate_test_owner') {
      const configuredEmail = String(process.env.MARKETER_TEST_OWNER_EMAIL || '').trim().toLowerCase();
      if (!configuredEmail || user.email !== configuredEmail) return reply(res, 403, { error: 'TEST_OWNER_NOT_CONFIGURED' });
      await firestore.collection('users').doc(user.uid).set({ isTestAccount: true, testAccountEnabledAt: now() }, { merge: true });
      return reply(res, 200, { ok: true, testMode: true });
    }

    if (!testOwner(user)) return reply(res, 403, { error: 'TEST_OWNER_REQUIRED' });

    if (action === 'save_test_rule') {
      const targetType = req.body?.targetType === 'advertisement' ? 'advertisement' : 'event';
      const targetId = id(req.body?.targetId, 'TARGET_ID');
      const rule = {
        id: `${user.uid}_${targetType}_${targetId}`,
        marketerId: user.uid,
        targetType,
        targetId,
        customerDiscount: ruleValue(req.body?.customerDiscount, 'CUSTOMER_DISCOUNT'),
        marketerReward: ruleValue(req.body?.marketerReward, 'MARKETER_REWARD'),
        active: req.body?.active !== false,
        testMode: true,
        updatedAt: now(),
      };
      await firestore.collection('marketer_rules').doc(rule.id).set(rule, { merge: true });
      return reply(res, 200, { ok: true, rule });
    }

    if (action === 'simulate_test_conversion') {
      const targetType = req.body?.targetType === 'advertisement' ? 'advertisement' : 'event';
      const targetId = id(req.body?.targetId, 'TARGET_ID');
      const requestId = id(req.body?.clientRequestId, 'REQUEST_ID');
      const ledgerRef = firestore.collection('marketer_ledger').doc(ledgerId(user.uid, requestId));
      const ruleRef = firestore.collection('marketer_rules').doc(`${user.uid}_${targetType}_${targetId}`);
      const result = await firestore.runTransaction(async (tx) => {
        const existing = await tx.get(ledgerRef);
        if (existing.exists) return { ...existing.data(), duplicate: true };
        const ruleSnap = await tx.get(ruleRef);
        if (!ruleSnap.exists || ruleSnap.data()?.active !== true || ruleSnap.data()?.testMode !== true) throw new Error('ACTIVE_TEST_RULE_REQUIRED');
        const conversion = calculateConversion(req.body?.originalAmount, ruleSnap.data());
        const entry = {
          id: ledgerRef.id, marketerId: user.uid, targetType, targetId,
          type: 'commission', status: 'pending', testMode: true,
          customerDiscount: conversion.customerDiscount, originalAmount: conversion.originalAmount,
          customerFinalAmount: conversion.customerFinalAmount, amount: conversion.marketerReward,
          ruleSnapshot: ruleSnap.data(), createdAt: now(), clientRequestId: requestId,
        };
        tx.set(ledgerRef, entry);
        tx.set(firestore.collection('users').doc(user.uid), { marketerWalletPending: admin.firestore.FieldValue.increment(conversion.marketerReward) }, { merge: true });
        return entry;
      });
      return reply(res, 200, { ok: true, entry: result, wallet: await getWallet(user.uid) });
    }

    if (action === 'approve_test_commission') {
      const entryRef = firestore.collection('marketer_ledger').doc(id(req.body?.ledgerId, 'LEDGER_ID'));
      const entry = await firestore.runTransaction(async (tx) => {
        const snap = await tx.get(entryRef);
        if (!snap.exists || snap.data()?.marketerId !== user.uid || snap.data()?.testMode !== true) throw new Error('TEST_ENTRY_NOT_FOUND');
        if (snap.data()?.status === 'available') return { ...snap.data(), duplicate: true };
        if (snap.data()?.status !== 'pending') throw new Error('ENTRY_NOT_PENDING');
        const amount = money(snap.data()?.amount);
        tx.update(entryRef, { status: 'available', approvedAt: now() });
        tx.set(firestore.collection('users').doc(user.uid), { marketerWalletPending: admin.firestore.FieldValue.increment(-amount), marketerWalletAvailable: admin.firestore.FieldValue.increment(amount) }, { merge: true });
        return { ...snap.data(), status: 'available' };
      });
      return reply(res, 200, { ok: true, entry, wallet: await getWallet(user.uid) });
    }

    if (action === 'request_test_withdrawal') {
      const amount = money(req.body?.amount);
      const requestId = id(req.body?.clientRequestId, 'REQUEST_ID');
      const withdrawalRef = firestore.collection('marketer_withdrawal_requests').doc(ledgerId(user.uid, requestId));
      const withdrawal = await firestore.runTransaction(async (tx) => {
        const existing = await tx.get(withdrawalRef);
        if (existing.exists) return { ...existing.data(), duplicate: true };
        const userRef = firestore.collection('users').doc(user.uid);
        const userSnap = await tx.get(userRef);
        const data = userSnap.data() || {};
        if (data.marketerWalletStatus && data.marketerWalletStatus !== 'active') throw new Error('WITHDRAWALS_NOT_AVAILABLE');
        const available = Number(data.marketerWalletAvailable || 0);
        if (amount > available) throw new Error('INSUFFICIENT_BALANCE');
        const entry = { id: withdrawalRef.id, marketerId: user.uid, amount, status: 'requested', testMode: true, requestedAt: now(), clientRequestId: requestId };
        tx.set(withdrawalRef, entry);
        tx.set(userRef, { marketerWalletAvailable: admin.firestore.FieldValue.increment(-amount) }, { merge: true });
        return entry;
      });
      return reply(res, 200, { ok: true, withdrawal, wallet: await getWallet(user.uid) });
    }

    if (action === 'mark_test_withdrawal_paid') {
      const withdrawalRef = firestore.collection('marketer_withdrawal_requests').doc(id(req.body?.withdrawalId, 'WITHDRAWAL_ID'));
      const withdrawal = await firestore.runTransaction(async (tx) => {
        const snap = await tx.get(withdrawalRef);
        if (!snap.exists || snap.data()?.marketerId !== user.uid || snap.data()?.testMode !== true) throw new Error('TEST_WITHDRAWAL_NOT_FOUND');
        if (snap.data()?.status === 'paid') return { ...snap.data(), duplicate: true };
        if (snap.data()?.status !== 'requested') throw new Error('WITHDRAWAL_NOT_REQUESTED');
        const amount = money(snap.data()?.amount);
        tx.update(withdrawalRef, { status: 'paid', paidAt: now(), transferReference: String(req.body?.transferReference || 'TEST-INSTAPAY').slice(0, 100) });
        tx.set(firestore.collection('users').doc(user.uid), { marketerWalletPaid: admin.firestore.FieldValue.increment(amount) }, { merge: true });
        return { ...snap.data(), status: 'paid' };
      });
      return reply(res, 200, { ok: true, withdrawal, wallet: await getWallet(user.uid) });
    }

    if (action === 'get_test_wallet') return reply(res, 200, { ok: true, wallet: await getWallet(user.uid), ledger: await latestLedger(user.uid) });
    return reply(res, 400, { error: 'UNKNOWN_ACTION' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const status = ['UNAUTHENTICATED', 'ADMIN_REQUIRED', 'TEST_OWNER_REQUIRED'].includes(message) ? 403 : 400;
    return reply(res, status, { error: message });
  }
}
