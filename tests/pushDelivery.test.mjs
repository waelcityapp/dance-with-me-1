import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createPushHandlers } from '../api/_lib/handlers/push.js';

test('pilot delivers only to the verified owner’s marked device, and opt-out removes it', async () => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST ?? '', /^127\.0\.0\.1:\d+$/);
  const app = initializeApp({ projectId: 'demo-cityeve-push-' + randomUUID().slice(0, 8) });
  const db = getFirestore(app);
  const publicKey = 'test-key';
  const verifiedOwner = { uid: 'owner', email: 'owner@example.test', email_verified: true };
  const user = { uid: 'guest', email: 'guest@example.test', email_verified: true, isAdmin: true };
  const sent = [];
  const handlers = createPushHandlers({
    env: { PUSH_BROADCAST_ENABLED: 'true', PUSH_ENABLED: 'true', VAPID_PUBLIC_KEY: publicKey, VAPID_PRIVATE_KEY: 'test-only', ADMIN_EMAIL: `  '${verifiedOwner.email.toUpperCase()}'  ` },
    getDb: () => db,
    verifyUser: async req => req.actor,
    sendNotification: async (subscription, payload) => sent.push({ subscription, payload: JSON.parse(payload) }),
  });
  async function call(route, actor, body) {
    const response = {
      setHeader() {},
      status(code) { this.code = code; return this; },
      json(data) { this.data = data; },
    };
    await handlers.get('/' + route)({ actor, body, method: 'POST', headers: actor ? { authorization: 'Bearer test' } : { 'x-vercel-forwarded-for': '192.0.2.4' } }, response);
    return response;
  }
  const subscribe = (actor, suffix) => call('push-subscribe', actor, {
    deviceId: 'same-device-id', publicKey,
    subscription: { endpoint: 'https://fcm.googleapis.com/fcm/send/' + suffix,
      keys: { p256dh: 'a'.repeat(87), auth: 'b'.repeat(22) } },
  });
  try {
    assert.equal((await subscribe(verifiedOwner, 'owner')).code, 200);
    assert.equal((await subscribe(user, 'guest')).code, 200);

    const payload = { title: 'Pilot', body: 'Testing delivery', url: '/', pilot: true };
    assert.equal((await call('send-push', user, payload)).data.error, 'PUSH_OWNER_REQUIRED');
    assert.equal((await call('send-push', { ...verifiedOwner, email_verified: false }, payload)).data.error, 'PUSH_EMAIL_UNVERIFIED');

    assert.equal((await call('send-push', verifiedOwner, payload)).data.sentCount, 1);
    assert.equal(sent.length, 1);
    assert.match(sent[0].subscription.endpoint, /\/owner$/);
    assert.equal(sent[0].payload.title, 'Pilot');
    assert.equal((await call('push-unsubscribe', user, { deviceId: 'same-device-id' })).code, 200);
    assert.equal((await db.collection('push_subscribers').get()).size, 1);
    assert.equal((await call('push-unsubscribe', verifiedOwner, { deviceId: 'same-device-id' })).code, 200);
    assert.equal((await call('send-push', verifiedOwner, payload)).data.sentCount, 0);
    assert.equal(sent.length, 1);

    const secret = 'c'.repeat(64);
    const guest = { deviceId: 'same-device-id', publicKey, deviceSecret: secret, subscription: {
      endpoint: 'https://fcm.googleapis.com/fcm/send/visitor',
      keys: { p256dh: 'a'.repeat(87), auth: 'b'.repeat(22) },
    } };
    assert.equal((await call('push-subscribe', null, { ...guest, deviceSecret: undefined })).code, 400);
    assert.equal((await call('push-subscribe', null, guest)).code, 200);
    await call('push-unsubscribe', null, { deviceId: guest.deviceId, deviceSecret: 'd'.repeat(64) });
    assert.equal((await call('send-push', verifiedOwner, payload)).data.sentCount, 0);
    const duplicateSecret = 'e'.repeat(64);
    assert.equal((await call('push-subscribe', null, { ...guest, deviceSecret: duplicateSecret })).code, 200);
    const delivered = await call('send-push', verifiedOwner, { ...payload, pilot: false });
    assert.equal(delivered.data.sentCount, 1);
    assert.equal(delivered.data.totalSubscribers, 1);
    await call('push-unsubscribe', null, { deviceId: guest.deviceId, deviceSecret: duplicateSecret });
    assert.match(sent.at(-1).subscription.endpoint, /visitor$/);
    await call('push-unsubscribe', null, { deviceId: guest.deviceId, deviceSecret: secret });
    assert.equal((await call('send-push', verifiedOwner, { ...payload, pilot: false })).data.sentCount, 0);
  } finally {
    await db.terminate();
    await deleteApp(app);
  }
});
