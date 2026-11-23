import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

test('profile permissions protect the admin role while allowing ordinary profile changes', async () => {
  const address = process.env.FIRESTORE_EMULATOR_HOST;
  assert.match(address ?? '', /^127\.0\.0\.1:\d+$/);
  const env = await initializeTestEnvironment({
    projectId: 'demo-cityeve-push-profile',
    firestore: { host: '127.0.0.1', port: Number(address.split(':')[1]), rules: await readFile('firestore.rules', 'utf8') },
  });
  try {
    const db = env.authenticatedContext('person', { email: 'person@example.test', email_verified: true }).firestore();
    const profile = doc(db, 'users/person');
    await assertSucceeds(setDoc(profile, { name: 'Person', isAdmin: false }));
    await assertSucceeds(updateDoc(profile, { name: 'Updated' }));
    assert.equal((await getDoc(profile)).get('name'), 'Updated');
    await assertFails(updateDoc(profile, { isAdmin: true }));
    await assertFails(setDoc(doc(db, 'push_subscribers/device'), { userId: 'person' }));
  } finally {
    await env.clearFirestore();
    await env.cleanup();
  }
});
