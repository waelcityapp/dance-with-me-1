import fs from 'node:fs/promises';
import { after, afterEach, before } from 'node:test';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-cityeve-security';
const OWNER_EMAIL = 'waelvts@gmail.com';

let testEnv;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: await fs.readFile('firestore.phase0.rules', 'utf8'),
    },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

async function seed(path, data) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
}

function auth(uid, email, emailVerified = true) {
  return testEnv.authenticatedContext(uid, {
    email,
    email_verified: emailVerified,
  }).firestore();
}

test('public visitors can read events but cannot edit them', async () => {
  await seed('events/event-1', { titleAr: 'فعالية' });
  const guest = testEnv.unauthenticatedContext().firestore();

  await assertSucceeds(getDoc(doc(guest, 'events/event-1')));
  await assertFails(setDoc(doc(guest, 'events/event-1'), { titleAr: 'تم التعديل' }));
});

test('admin codes are never readable from the browser', async () => {
  await seed('admin_codes/owner-code', { active: true });
  const guest = testEnv.unauthenticatedContext().firestore();
  const owner = auth('owner-uid', OWNER_EMAIL);

  await assertFails(getDoc(doc(guest, 'admin_codes/owner-code')));
  await assertFails(getDoc(doc(owner, 'admin_codes/owner-code')));
});

test('a user can read their own profile but not another profile', async () => {
  await seed('users/user-a', { id: 'user-a', email: 'a@example.com', isAdmin: false });
  await seed('users/user-b', { id: 'user-b', email: 'b@example.com', isAdmin: false });
  const userA = auth('user-a', 'a@example.com');

  await assertSucceeds(getDoc(doc(userA, 'users/user-a')));
  await assertFails(getDoc(doc(userA, 'users/user-b')));
});

test('a new user cannot grant themselves admin or marketer privileges', async () => {
  const userA = auth('user-a', 'a@example.com');

  await assertFails(setDoc(doc(userA, 'users/user-a'), {
    id: 'user-a',
    email: 'a@example.com',
    isAdmin: true,
  }));

  await assertFails(setDoc(doc(userA, 'users/user-a'), {
    id: 'user-a',
    email: 'a@example.com',
    isAdmin: false,
    isMarketer: true,
    marketerCode: 'TEST',
  }));
});

test('passwords cannot be written to user profiles', async () => {
  const userA = auth('user-a', 'a@example.com');

  await assertFails(setDoc(doc(userA, 'users/user-a'), {
    id: 'user-a',
    email: 'a@example.com',
    isAdmin: false,
    password: 'not-allowed',
  }));
});

test('a user cannot promote an existing profile', async () => {
  await seed('users/user-a', { id: 'user-a', email: 'a@example.com', isAdmin: false });
  const userA = auth('user-a', 'a@example.com');

  await assertFails(updateDoc(doc(userA, 'users/user-a'), { isAdmin: true }));
  await assertFails(updateDoc(doc(userA, 'users/user-a'), { isMarketer: true }));
});

test('the verified platform owner can manage user privileges', async () => {
  await seed('users/user-a', { id: 'user-a', email: 'a@example.com', isAdmin: false });
  const owner = auth('owner-uid', OWNER_EMAIL);

  await assertSucceeds(getDoc(doc(owner, 'users/user-a')));
  await assertSucceeds(updateDoc(doc(owner, 'users/user-a'), {
    isMarketer: true,
    marketerStatus: 'active',
  }));
});

test('an unverified owner email does not receive owner access', async () => {
  await seed('users/user-a', { id: 'user-a', email: 'a@example.com', isAdmin: false });
  const unverifiedOwner = auth('owner-uid', OWNER_EMAIL, false);

  await assertFails(getDoc(doc(unverifiedOwner, 'users/user-a')));
});

test('a user can create and read only their own pending booking', async () => {
  const userA = auth('user-a', 'a@example.com');
  const userB = auth('user-b', 'b@example.com');
  const booking = {
    id: 'booking-1',
    userId: 'user-a',
    status: 'pending',
    totalAmount: 100,
  };

  await assertSucceeds(setDoc(doc(userA, 'bookings/booking-1'), booking));
  await assertSucceeds(getDoc(doc(userA, 'bookings/booking-1')));
  await assertFails(getDoc(doc(userB, 'bookings/booking-1')));
});

test('a user cannot approve a booking or change its amount', async () => {
  await seed('bookings/booking-1', {
    id: 'booking-1',
    userId: 'user-a',
    status: 'pending',
    totalAmount: 100,
  });
  const userA = auth('user-a', 'a@example.com');

  await assertFails(updateDoc(doc(userA, 'bookings/booking-1'), { status: 'approved' }));
  await assertFails(updateDoc(doc(userA, 'bookings/booking-1'), {
    status: 'cancelled',
    totalAmount: 1,
  }));
});

test('a user can cancel their own booking without changing protected data', async () => {
  await seed('bookings/booking-1', {
    id: 'booking-1',
    userId: 'user-a',
    status: 'pending',
    totalAmount: 100,
  });
  const userA = auth('user-a', 'a@example.com');

  await assertSucceeds(updateDoc(doc(userA, 'bookings/booking-1'), {
    status: 'cancelled',
    cancelledAt: '2026-09-10T00:00:00.000Z',
  }));

  const snapshot = await getDoc(doc(userA, 'bookings/booking-1'));
  assert.equal(snapshot.data().totalAmount, 100);
});
