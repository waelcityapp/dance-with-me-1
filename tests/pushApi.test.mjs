import assert from 'node:assert/strict';
import { test } from 'node:test';
import gateway from '../api/index.js';
import { validSubscription } from '../api/_lib/handlers/push.js';

async function call(path, method) {
  const response = {
    setHeader() {},
    status(value) { this.code = value; return this; },
    json(value) { this.body = value; },
  };
  await gateway({ url: '/api/' + path, method, headers: {} }, response);
  return response;
}

test('Vercel registers all push routes and protects private operations', async () => {
  assert.equal((await call('push-vapid-key', 'POST')).code, 405);
  for (const [path, method] of [
    ['push-stats', 'GET'], ['send-push', 'POST'],
  ]) {
    assert.equal((await call(path, method)).code, 401);
  }
});

test('subscription destinations are restricted to known HTTPS push providers', () => {
  const keys = { auth: 'a'.repeat(22), p256dh: 'b'.repeat(87) };
  for (const endpoint of ['https://web.push.apple.com/push/123', 'https://fcm.googleapis.com/fcm/send/123',
    'https://updates.push.services.mozilla.com/wpush/v2/123']) {
    assert.equal(validSubscription({ endpoint, keys }), true);
  }
  assert.equal(validSubscription({ endpoint: 'https://example.com/push/123', keys }), false);
  assert.equal(validSubscription({ endpoint: 'http://fcm.googleapis.com/fcm/send/123', keys }), false);
});
