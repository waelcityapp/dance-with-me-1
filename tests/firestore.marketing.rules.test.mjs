import fs from 'node:fs/promises';
import { after, afterEach, before } from 'node:test';
import test from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const PROJECT_ID = 'demo-cityeve-marketing';
const OWNER_EMAIL = 'waelvts@gmail.com';
let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8081,
      rules: await fs.readFile('firestore.marketing-test.rules', 'utf8'),
    },
  });
});

afterEach(async () => testEnv.clearFirestore());
after(async () => testEnv.cleanup());

async function seed(path, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

function auth(uid, email, emailVerified = true) {
  return testEnv.authenticatedContext(uid, { email, email_verified: emailVerified }).firestore();
}

test('user can update personal profile fields', async () => {
  await seed('users/user-a', { id: 'user-a', email: 'a@example.com', isAdmin: false, accountTier: 'free', name: 'Old', phone: '0100' });
  const user = auth('user-a', 'a@example.com');
  await assertSucceeds(updateDoc(doc(user, 'users/user-a'), { name: 'New', phone: '0111', avatar: 'avatar.png' }));
});

test('user can request a tier but cannot activate it themselves', async () => {
  await seed('users/user-a', { id: 'user-a', email: 'a@example.com', isAdmin: false, accountTier: 'free' });
  const user = auth('user-a', 'a@example.com');
  await assertSucceeds(updateDoc(doc(user, 'users/user-a'), { requestedTier: 'featured' }));
  await assertFails(updateDoc(doc(user, 'users/user-a'), { accountTier: 'vip' }));
});

test('event views are public but likes require sign in', async () => {
  await seed('events/event-1', { titleAr: 'فعالية', viewsCount: 0, likesCount: 0 });
  const guest = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(updateDoc(doc(guest, 'events/event-1'), { viewsCount: 1 }));
  await assertFails(updateDoc(doc(guest, 'events/event-1'), { likesCount: 1 }));
  await assertSucceeds(updateDoc(doc(auth('user-a', 'a@example.com'), 'events/event-1'), { likesCount: 1 }));
});

test('password cannot be stored in a user profile', async () => {
  const user = auth('user-a', 'a@example.com');
  await assertFails(setDoc(doc(user, 'users/user-a'), {
    id: 'user-a', email: 'a@example.com', name: 'A', phone: '', avatar: '',
    favoriteStyles: [], likedEventIds: [], bookedEventIds: [], isAdmin: false,
    accountTier: 'free', createdAt: new Date().toISOString(), password: 'secret123',
  }));
});

test('user cannot grant admin or marketer permissions', async () => {
  await seed('users/user-a', { id: 'user-a', email: 'a@example.com', isAdmin: false });
  const user = auth('user-a', 'a@example.com');
  await assertFails(updateDoc(doc(user, 'users/user-a'), { isAdmin: true }));
  await assertFails(updateDoc(doc(user, 'users/user-a'), { isMarketer: true, marketerCode: 'SELF' }));
});

test('user cannot change wallet totals in their profile', async () => {
  await seed('users/user-a', { id: 'user-a', email: 'a@example.com', isAdmin: false, marketerWalletAvailable: 0 });
  const user = auth('user-a', 'a@example.com');
  await assertFails(updateDoc(doc(user, 'users/user-a'), { marketerWalletAvailable: 5000 }));
});

test('owner can manage user roles but an unverified owner cannot', async () => {
  await seed('users/user-a', { id: 'user-a', email: 'a@example.com', isAdmin: false });
  await assertSucceeds(updateDoc(doc(auth('owner', OWNER_EMAIL), 'users/user-a'), { isMarketer: true, marketerStatus: 'active' }));
  await assertFails(updateDoc(doc(auth('owner', OWNER_EMAIL, false), 'users/user-a'), { isAdmin: true }));
});

test('new advertisement must be pending and owned by its creator', async () => {
  const user = auth('user-a', 'a@example.com');
  await assertSucceeds(setDoc(doc(user, 'ad_submissions/ad-1'), { advertiserId: 'user-a', status: 'pending', titleAr: 'إعلان' }));
  await assertFails(setDoc(doc(user, 'ad_submissions/ad-2'), { advertiserId: 'user-a', status: 'approved', titleAr: 'إعلان' }));
  await assertFails(setDoc(doc(user, 'ad_submissions/ad-3'), { advertiserId: 'user-b', status: 'pending', titleAr: 'إعلان' }));
});

test('advertiser cannot directly edit, reactivate or republish an existing advertisement', async () => {
  await seed('ad_submissions/ad-1', { advertiserId: 'user-a', status: 'archived', titleAr: 'قديم' });
  const user = auth('user-a', 'a@example.com');
  await assertFails(updateDoc(doc(user, 'ad_submissions/ad-1'), { titleAr: 'تعديل بسيط' }));
  await assertFails(updateDoc(doc(user, 'ad_submissions/ad-1'), { status: 'pending' }));
  await assertFails(updateDoc(doc(user, 'ad_submissions/ad-1'), { status: 'approved' }));
});

test('advertiser can delete only their own advertisement and event', async () => {
  await seed('ad_submissions/ad-a', { advertiserId: 'user-a', status: 'approved' });
  await seed('ad_submissions/ad-b', { advertiserId: 'user-b', status: 'approved' });
  await seed('events/event-a', { creatorId: 'user-a', titleAr: 'A' });
  await seed('events/event-b', { creatorId: 'user-b', titleAr: 'B' });
  const user = auth('user-a', 'a@example.com');
  await assertSucceeds(deleteDoc(doc(user, 'ad_submissions/ad-a')));
  await assertFails(deleteDoc(doc(user, 'ad_submissions/ad-b')));
  await assertSucceeds(deleteDoc(doc(user, 'events/event-a')));
  await assertFails(deleteDoc(doc(user, 'events/event-b')));
});

test('advertiser cannot bypass Backend to submit an edit or republish request', async () => {
  const user = auth('user-a', 'a@example.com');
  await assertFails(setDoc(doc(user, 'ad_change_requests/request-1'), {
    advertiserId: 'user-a', targetId: 'ad-1', requestType: 'edit',
    status: 'pending', proposedData: { titleAr: 'عنوان جديد' },
  }));
  await assertFails(setDoc(doc(user, 'ad_change_requests/request-2'), {
    advertiserId: 'user-a', targetId: 'ad-1', requestType: 'republish',
    status: 'pending', proposedData: {},
  }));
});

test('advertiser cannot approve their own change request', async () => {
  await seed('ad_change_requests/request-1', { advertiserId: 'user-a', targetId: 'ad-1', requestType: 'edit', status: 'pending', proposedData: {} });
  const user = auth('user-a', 'a@example.com');
  await assertFails(updateDoc(doc(user, 'ad_change_requests/request-1'), { status: 'approved' }));
});

test('client cannot create or alter final bookings', async () => {
  const user = auth('user-a', 'a@example.com');
  await assertFails(setDoc(doc(user, 'bookings/booking-1'), { userId: 'user-a', status: 'pending', totalAmount: 1 }));
  await assertSucceeds(setDoc(doc(user, 'booking_requests/request-1'), { userId: 'user-a', eventId: 'event-1', status: 'pending', quantity: 2 }));
});

test('marketer can read only their own wallet and ledger', async () => {
  await seed('marketer_wallets/user-a', { available: 100 });
  await seed('marketer_wallets/user-b', { available: 200 });
  await seed('marketer_ledger/entry-a', { marketerId: 'user-a', amount: 20 });
  const user = auth('user-a', 'a@example.com');
  await assertSucceeds(getDoc(doc(user, 'marketer_wallets/user-a')));
  await assertSucceeds(getDoc(doc(user, 'marketer_ledger/entry-a')));
  await assertFails(getDoc(doc(user, 'marketer_wallets/user-b')));
});

test('browser cannot write wallet, ledger, rules or withdrawals', async () => {
  const user = auth('user-a', 'a@example.com');
  await assertFails(setDoc(doc(user, 'marketer_wallets/user-a'), { available: 9999 }));
  await assertFails(setDoc(doc(user, 'marketer_ledger/entry-1'), { marketerId: 'user-a', amount: 9999 }));
  await assertFails(setDoc(doc(user, 'marketer_rules/rule-1'), { marketerId: 'user-a', value: 100 }));
  await assertFails(setDoc(doc(user, 'marketer_withdrawal_requests/request-1'), { marketerId: 'user-a', amount: 9999 }));
});

test('admin codes are never readable from the browser', async () => {
  await seed('admin_codes/2233', { active: true });
  await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), 'admin_codes/2233')));
  await assertFails(getDoc(doc(auth('owner', OWNER_EMAIL), 'admin_codes/2233')));
});
