import { createHash } from 'node:crypto';
import webpush from 'web-push';
import { getAdminDb, verifyRequestUser } from '../firebaseAdmin.js';

const routes = ['push-vapid-key', 'push-subscribe', 'push-unsubscribe', 'push-stats', 'send-push'];
export const pushHandlers = new Map(routes.map(route => [`/${route}`, (req, res) => handle(route, req, res)]));

const hash = value => createHash('sha256').update(value).digest('hex');
const ownerOnly = actor => actor.email_verified === true &&
  actor.email?.toLowerCase() === (process.env.ADMIN_EMAIL || 'waelvts@gmail.com').trim().toLowerCase();

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

async function handle(route, req, res) {
  const reply = (status, body) => res.status(status).json(body);
  res.setHeader('Cache-Control', 'no-store');
  const read = route === 'push-vapid-key' || route === 'push-stats';
  if (req.method !== (read ? 'GET' : 'POST')) return reply(405, { error: 'METHOD_NOT_ALLOWED' });
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const ready = process.env.PUSH_ENABLED === 'true' && publicKey && privateKey;
  if (route === 'push-vapid-key') return ready
    ? reply(200, { publicKey })
    : reply(503, { error: 'PUSH_DISABLED' });

  let actor;
  try {
    actor = await verifyRequestUser(req);
  } catch {
    return reply(401, { error: 'UNAUTHENTICATED' });
  }
  if ((route === 'send-push' || route === 'push-stats') && !ownerOnly(actor)) return reply(403, { error: 'FORBIDDEN' });
  if (!ready && route !== 'push-unsubscribe') return reply(503, { error: 'PUSH_DISABLED' });

  try {
    const devices = getAdminDb().collection('push_subscribers');
    const deviceId = req.body?.deviceId;
    if (route === 'push-subscribe' || route === 'push-unsubscribe') {
      if (typeof deviceId !== 'string' || !/^[a-zA-Z0-9_-]{8,100}$/.test(deviceId)) return reply(400, { error: 'INVALID_DEVICE' });
      const ref = devices.doc(hash(JSON.stringify([actor.uid, deviceId])));
      if (route === 'push-unsubscribe') {
        await ref.delete();
      } else {
        const subscription = req.body?.subscription;
        if (!validSubscription(subscription) || req.body?.publicKey !== publicKey) return reply(400, { error: 'INVALID_SUBSCRIPTION' });
        await ref.set({
          userId: actor.uid, deviceId, publicKey,
          subscription: { endpoint: subscription.endpoint, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } },
          updatedAt: new Date().toISOString(),
        });
      }
      return reply(200, { success: true });
    }

    const current = devices.where('publicKey', '==', publicKey);
    if (route === 'push-stats') return reply(200, { count: (await current.count().get()).data().count });
    const pilot = req.body?.pilot === true;
    if (!pilot && process.env.PUSH_BROADCAST_ENABLED !== 'true') return reply(503, { error: 'BROADCAST_DISABLED' });
    const { title, body, url = '/' } = req.body || {};
    if (typeof title !== 'string' || !title.trim() || title.length > 120 ||
        typeof body !== 'string' || !body.trim() || body.length > 400 ||
        typeof url !== 'string' || !/^\/(?!\/)[^\\\s]*$/.test(url) || url.length > 512) {
      return reply(400, { error: 'INVALID_NOTIFICATION' });
    }
    const recipients = await (pilot ? current.where('userId', '==', actor.uid) : current).get();
    let sentCount = 0;
    let failCount = 0;
    for (let offset = 0; offset < recipients.docs.length; offset += 20) {
      await Promise.all(recipients.docs.slice(offset, offset + 20).map(async doc => {
        const { subscription } = doc.data();
        if (!validSubscription(subscription)) { failCount++; return; }
        try {
          await webpush.sendNotification(subscription, JSON.stringify({ title, body, url }), {
            TTL: 300, timeout: 5000, vapidDetails: { subject: 'mailto:support@cityeve.online', publicKey, privateKey },
          });
          sentCount++;
        } catch (error) {
          failCount++;
          if ([404, 410].includes(error.statusCode)) await doc.ref.delete({ lastUpdateTime: doc.updateTime }).catch(() => {});
        }
      }));
    }
    return reply(200, { success: sentCount > 0, sentCount, failCount, totalSubscribers: recipients.size, pilot });
  } catch {
    return reply(503, { error: 'PUSH_UNAVAILABLE' });
  }
}
