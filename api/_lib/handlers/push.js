import { isIP } from 'node:net';
import { createHash, createHmac } from 'node:crypto';
import webpush from 'web-push';
import { getAdminDb, verifyRequestUser } from '../firebaseAdmin.js';

const routes = ['push-vapid-key', 'push-subscribe', 'push-unsubscribe', 'push-stats', 'send-push'];
export function createPushHandlers({
  verifyUser = verifyRequestUser,
  getDb = getAdminDb,
  sendNotification = webpush.sendNotification,
  env = process.env,
} = {}) {
  return new Map(routes.map(route => [
    `/${route}`, (req, res) => handle(route, req, res, { verifyUser, getDb, sendNotification, env }),
  ]));
}
export const pushHandlers = createPushHandlers();

const hash = value => createHash('sha256').update(value).digest('hex');
const ownerOnly = (actor, env) => actor.email_verified === true &&
  actor.email?.toLowerCase() === (env.ADMIN_EMAIL || 'waelvts@gmail.com').trim().toLowerCase();

export function validSubscription(subscription) {
  if (typeof subscription?.endpoint !== 'string' || subscription.endpoint.length > 2048) return false;
  try {
    const url = new URL(subscription.endpoint);
    const host = url.hostname;
    const allowed = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com', 'notify.windows.com'];
    return url.protocol === 'https:' && !url.port && !url.username && !url.password && !url.hash &&
      allowed.some(domain => host === domain || (['notify.windows.com', 'web.push.apple.com'].includes(domain) && host.endsWith('.' + domain))) &&
      /^[A-Za-z0-9_-]{87}$/.test(subscription.keys?.p256dh || '') &&
      /^[A-Za-z0-9_-]{22}$/.test(subscription.keys?.auth || '');
  } catch {
    return false;
  }
}

async function handle(route, req, res, { verifyUser, getDb, sendNotification, env }) {
  const reply = (status, body) => res.status(status).json(body);
  res.setHeader('Cache-Control', 'no-store');
  const read = route === 'push-vapid-key' || route === 'push-stats';
  if (req.method !== (read ? 'GET' : 'POST')) return reply(405, { error: 'METHOD_NOT_ALLOWED' });
  const publicKey = env.VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  const ready = env.PUSH_ENABLED === 'true' && publicKey && privateKey;
  if (route === 'push-vapid-key') return ready
    ? reply(200, { publicKey })
    : reply(503, { error: 'PUSH_DISABLED' });

  const deviceRoute = route === 'push-subscribe' || route === 'push-unsubscribe';
  if (deviceRoute && req.headers['sec-fetch-site'] === 'cross-site') return reply(403, { error: 'INVALID_ORIGIN' });
  let actor;
  if (!deviceRoute || req.headers.authorization) {
    try {
      actor = await verifyUser(req);
    } catch {
      return reply(401, { error: 'UNAUTHENTICATED' });
    }
  }
  if ((route === 'send-push' || route === 'push-stats') && !ownerOnly(actor, env)) return reply(403, { error: 'FORBIDDEN' });
  if (!ready && route !== 'push-unsubscribe') return reply(503, { error: 'PUSH_DISABLED' });

  try {
    const db = getDb();
    const devices = db.collection('push_subscribers');
    if (deviceRoute) {
      const { deviceId, deviceSecret, subscription } = req.body || {};
      if (typeof deviceId !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(deviceId)) return reply(400, { error: 'INVALID_DEVICE' });
      const legacy = actor && devices.doc(hash(JSON.stringify([actor.uid, deviceId])));
      const hasSecret = typeof deviceSecret === 'string' && /^[0-9a-f]{64}$/.test(deviceSecret);
      if (!hasSecret && (!legacy || deviceSecret !== undefined)) return reply(400, { error: 'INVALID_DEVICE_SECRET' });
      const ref = hasSecret ? devices.doc(hash(deviceSecret)) : legacy;
      if (route === 'push-subscribe') {
        if (!validSubscription(subscription) || req.body?.publicKey !== publicKey) return reply(400, { error: 'INVALID_SUBSCRIPTION' });
      }
      const result = await db.runTransaction(async tx => {
        const saved = await tx.get(ref);
        if (route === 'push-unsubscribe') {
          if (saved.exists) tx.delete(ref);
          if (hasSecret && legacy) tx.delete(legacy);
          return 200;
        }
        if (!actor && !saved.exists) {
          const ip = String(req.headers['x-vercel-forwarded-for'] || req.ip || '').split(',')[0].trim();
          if (!isIP(ip)) return 400;
          const bucket = createHmac('sha256', privateKey).update(ip).digest('hex');
          const rate = db.collection('push_registration_limits').doc(bucket);
          const previous = (await tx.get(rate)).data();
          const day = Math.floor(Date.now() / 86400000);
          const count = previous?.day === day ? previous.count : 0;
          if (count >= 20) return 429;
          tx.set(rate, { day, count: count + 1 });
        }
        tx.set(ref, {
          userId: actor?.uid ?? saved.get('userId') ?? null, deviceId, publicKey,
          subscription: { endpoint: subscription.endpoint, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } },
          updatedAt: new Date().toISOString(),
        });
        if (hasSecret && legacy) tx.delete(legacy);
        return 200;
      });
      if (result === 429) return reply(429, { error: 'PUSH_REGISTRATION_LIMIT' });
      if (result !== 200) return reply(result, { error: 'INVALID_DEVICE_NETWORK' });
      return reply(200, { success: true });
    }

    const current = devices.where('publicKey', '==', publicKey);
    if (route === 'push-stats') return reply(200, { count: (await current.count().get()).data().count });
    const pilot = req.body?.pilot === true;
    if (!pilot && env.PUSH_BROADCAST_ENABLED !== 'true') return reply(503, { error: 'BROADCAST_DISABLED' });
    const { title, body, url = '/' } = req.body || {};
    if (typeof title !== 'string' || !title.trim() || title.length > 120 ||
        typeof body !== 'string' || !body.trim() || body.length > 400 ||
        typeof url !== 'string' || !/^\/(?!\/)[^\\\s]*$/.test(url) || url.length > 512) {
      return reply(400, { error: 'INVALID_NOTIFICATION' });
    }
    const recipients = await (pilot ? current.where('userId', '==', actor.uid) : current).get();
    const endpoints = new Set();
    let sentCount = 0;
    let failCount = 0;
    for (let offset = 0; offset < recipients.docs.length; offset += 20) {
      await Promise.all(recipients.docs.slice(offset, offset + 20).map(async doc => {
        const { subscription } = doc.data();
        if (!validSubscription(subscription)) { failCount++; return; }
        if (endpoints.has(subscription.endpoint)) return;
        endpoints.add(subscription.endpoint);
        try {
          await sendNotification(subscription, JSON.stringify({ title, body, url }), {
            TTL: 300, timeout: 5000, vapidDetails: { subject: 'mailto:support@cityeve.online', publicKey, privateKey },
          });
          sentCount++;
        } catch (error) {
          failCount++;
          if ([404, 410].includes(error.statusCode)) await doc.ref.delete({ lastUpdateTime: doc.updateTime }).catch(() => {});
        }
      }));
    }
    return reply(200, { success: sentCount > 0, sentCount, failCount, totalSubscribers: sentCount + failCount, pilot });
  } catch {
    return reply(503, { error: 'PUSH_UNAVAILABLE' });
  }
}
