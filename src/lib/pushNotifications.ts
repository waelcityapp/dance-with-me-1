/**
 * Web Push Notification Management for CityEve
 * Handles VAPID public key retrieval, Service Worker subscription,
 * saving subscriber endpoints to Firestore & server, and testing chimes.
 */

import { auth } from './firebase';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server_device';
  let deviceId = localStorage.getItem('cityeve_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    try {
      localStorage.setItem('cityeve_device_id', deviceId);
    } catch (e) {}
  }
  return deviceId;
}

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Plays a pleasant, crystal-clear notification chime using Web Audio API synthesis
 */
export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    // Notes: E6 -> B6 -> E7 (Luxury Arpeggio Chime)
    const notes = [1318.51, 1975.53, 2637.02];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.08 + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.55);
    });
  } catch (e) {
    console.warn('Audio chime playback failed:', e);
  }
}

/**
 * Fetch VAPID Public Key from server
 */
export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch('/api/push-vapid-key');
    if (!res.ok) throw new Error('Failed to fetch VAPID key');
    const data = await res.json();
    return data.publicKey || null;
  } catch (err) {
    console.warn('Error fetching VAPID public key:', err);
    return null;
  }
}

/**
 * Background auto-registration of device without forcing permission prompt
 */
async function pushRequest(path: string, payload?: object) {
  const user = auth.currentUser;
  const token = await user?.getIdToken();
  const response = await fetch(`/api/${path}`, {
    method: payload ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    ...(payload && { body: JSON.stringify(payload) }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'PUSH_UNAVAILABLE');
  return data;
}

function getDeviceSecret() {
  const key = 'cityeve_push_device_secret';
  const existing = localStorage.getItem(key);
  if (existing && /^[a-f0-9]{64}$/.test(existing)) return existing;
  const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(key, secret);
  return secret;
}

export function isDevicePushRegistered() {
  return localStorage.getItem('cityeve_push_registered') === 'true';
}

function updateDevicePushState(registered: boolean) {
  localStorage.setItem('cityeve_push_registered', String(registered));
  window.dispatchEvent(new Event('cityeve-push-change'));
}

async function saveDevice(registration: ServiceWorkerRegistration, replace: boolean) {
  const publicKey = await getVapidPublicKey();
  if (!publicKey) return false;
  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const storedKey = subscription.options.applicationServerKey;
    const matches = storedKey && new Uint8Array(storedKey).length === applicationServerKey.length &&
      new Uint8Array(storedKey).every((byte, index) => byte === applicationServerKey[index]);
    if (!matches) {
      if (!replace) return false;
      if (!await subscription.unsubscribe()) return false;
      subscription = null;
    }
  }
  if (!subscription && replace) {
    subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
  }
  if (!subscription) return false;
  await pushRequest('push-subscribe', { deviceId: getDeviceId(), deviceSecret: getDeviceSecret(), subscription: subscription.toJSON(), publicKey });
  updateDevicePushState(true);
  return true;
}

export async function autoRegisterDevice(_userId?: string, _email?: string): Promise<void> {
  if (localStorage.getItem('cityeve_push_registered') === 'false' || !isPushSupported() || Notification.permission !== 'granted') return;
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.active && await registration.pushManager.getSubscription()) await saveDevice(registration, false);
}

export async function subscribeUserToPush(
  _userId?: string, _email?: string, triggerTestAlert = false
): Promise<{ success: boolean; message?: string }> {
  if (!isPushSupported()) return { success: false, message: 'المتصفح لا يدعم الإشعارات على هذا الجهاز.' };
  try {
    const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    if (permission !== 'granted') return { success: false, message: 'اسمح بالإشعارات من إعدادات الموقع أولًا.' };
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    if (!await saveDevice(await navigator.serviceWorker.ready, true)) throw new Error('PUSH_UNAVAILABLE');
    if (triggerTestAlert) await showTestNotification('ar').catch(() => {});
    return { success: true, message: 'تم تسجيل إشعارات هذا الجهاز بنجاح.' };
  } catch {
    return { success: false, message: 'تعذّر تسجيل الإشعارات. حاول مرة أخرى.' };
  }
}

export async function unsubscribeUserFromPush(_userId?: string): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    await pushRequest('push-unsubscribe', { deviceId: getDeviceId(), deviceSecret: getDeviceSecret() });
    updateDevicePushState(false);
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe();
    return true;
  } catch {
    return false;
  }
}

/**
 * Trigger local test notification (welcome message upon subscription)
 */
export async function showTestNotification(lang: 'ar' | 'en' = 'ar'): Promise<void> {
  await showCustomNotification({
    title: lang === 'ar' ? '🎉 مرحباً بك في تنبيهات سيتي إيف' : '🎉 Welcome to CityEve Alerts',
    body: lang === 'ar' 
      ? 'تم تفعيل التنبيهات بنجاح! ستصلك أحدث الحفلات والكورسات فور نشرها.'
      : 'Alerts successfully enabled! You will be notified instantly when new events drop.',
    url: '/'
  });
}

/**
 * Display a custom/real notification on the device
 */
export async function showCustomNotification(params: {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  url?: string;
  tag?: string;
}): Promise<void> {
  playNotificationChime();
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const title = params.title || 'CityEve | إشعار جديد 🔔';
  const body = params.body || '';
  const icon = params.icon || 'https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png';
  const tag = params.tag || ('cityeve-alert-' + Date.now());
  const url = params.url || '/';

  // 1. Prefer Service Worker registration showNotification (Required for Mobile & Android lock screen)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon,
          badge: icon,
          image: params.image || undefined,
          vibrate: [200, 100, 200],
          tag,
          renotify: true,
          requireInteraction: true,
          data: { url }
        } as any);
        return;
      }
    } catch (e) {
      console.warn('Service worker showNotification note:', e);
    }
  }

  // 2. Fallback to standard Window Notification object
  try {
    new Notification(title, {
      body,
      icon,
      badge: icon,
      tag
    } as any);
  } catch (e) {
    console.warn('Window Notification fallback note:', e);
  }
}

/**
 * Display a NotificationItem with actual event details on the device screen
 */
export async function showNotificationItem(item: any, lang: 'ar' | 'en' = 'ar'): Promise<void> {
  if (!item) return;
  const title = lang === 'ar' ? (item.titleAr || item.titleEn) : (item.titleEn || item.titleAr);
  const body = lang === 'ar' ? (item.messageAr || item.messageEn) : (item.messageEn || item.messageAr);
  const eventId = item.targetEventId || item.relatedEventId;
  const url = eventId ? `/?event=${eventId}` : '/';

  await showCustomNotification({
    title: title || 'CityEve 🔔',
    body: body || '',
    url,
    tag: item.id || ('cityeve-alert-' + Date.now())
  });
}

/**
 * Trigger broadcast push notification via server endpoint
 */
export async function sendBroadcastPushNotification(payload: {
  title: string;
  body: string;
  url?: string;
  image?: string;
  eventId?: string;
  pilot?: boolean;
}): Promise<{ success: boolean; sentCount?: number; totalSubscribers?: number; error?: string; pilot?: boolean }> {
  try {
    return await pushRequest('send-push', payload);
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'PUSH_UNAVAILABLE' };
  }
}

export async function getPushSubscribersCount(): Promise<number> {
  try {
    return (await pushRequest('push-stats')).count;
  } catch {
    return 0;
  }
}
