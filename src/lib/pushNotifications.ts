/**
 * Web Push Notification Management for CityEve
 * Handles VAPID public key retrieval, Service Worker subscription,
 * saving subscriber endpoints to Firestore & server, and testing chimes.
 */

import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db, sanitizeForFirestore } from './firebase';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
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
  return ('Notification' in window) || ('serviceWorker' in navigator);
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
export async function autoRegisterDevice(userId?: string, userEmail?: string): Promise<void> {
  try {
    const deviceId = getDeviceId();
    const permission = typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
    
    let subJson: any = null;
    if ('serviceWorker' in navigator && 'PushManager' in window && permission === 'granted') {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existingSub = await reg.pushManager.getSubscription();
        if (existingSub) {
          subJson = existingSub.toJSON();
        }
      } catch (e) {}
    }

    const subscriberDocId = `dev_${deviceId}`;
    const payload = {
      id: subscriberDocId,
      deviceId,
      userId: userId || null,
      userEmail: userEmail || null,
      permission,
      subscription: subJson,
      endpoint: subJson?.endpoint || null,
      platform: navigator.userAgent,
      active: true,
      lastSeen: new Date().toISOString()
    };

    // 1. Sync to server API
    fetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriberId: subscriberDocId,
        deviceId,
        userId: userId || null,
        userEmail: userEmail || null,
        platform: navigator.userAgent,
        permission,
        subscription: subJson
      })
    }).catch(() => {});

    // 2. Sync to Firestore
    try {
      const docRef = doc(db, 'push_subscribers', subscriberDocId);
      await setDoc(docRef, sanitizeForFirestore(payload), { merge: true });
    } catch (e) {
      console.warn('Firestore device auto-register note:', e);
    }
  } catch (e) {
    console.warn('Auto register device note:', e);
  }
}

/**
 * Subscribe current browser device to Web Push notifications
 */
export async function subscribeUserToPush(
  userId?: string, 
  userEmail?: string,
  triggerTestAlert: boolean = false
): Promise<{ success: boolean; message?: string }> {
  try {
    const deviceId = getDeviceId();
    let permission: NotificationPermission = 'default';

    // 1. Request permission if supported
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        permission = await Notification.requestPermission();
      } catch (permErr) {
        // Fallback for older Safari
        permission = await new Promise((resolve) => {
          Notification.requestPermission((p) => resolve(p));
        });
      }
    }

    // 2. Ensure Service Worker is registered & ready
    let activeRegistration: ServiceWorkerRegistration | null = null;
    if ('serviceWorker' in navigator) {
      try {
        let registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
          registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        }
        activeRegistration = await navigator.serviceWorker.ready;
      } catch (swErr) {
        console.warn('Service worker setup note:', swErr);
      }
    }

    // 3. Get VAPID Key and subscribe with PushManager if available
    let subJson: any = null;
    let pushSubError = '';
    if (activeRegistration && 'PushManager' in window && permission === 'granted') {
      try {
        let subscription = await activeRegistration.pushManager.getSubscription();
        if (!subscription) {
          const vapidPublicKey = await getVapidPublicKey();
          if (vapidPublicKey) {
            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
            subscription = await activeRegistration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: convertedVapidKey
            });
          }
        }
        if (subscription) {
          subJson = subscription.toJSON();
        }
      } catch (pushErr: any) {
        console.warn('PushManager subscription note:', pushErr);
        pushSubError = pushErr?.message || String(pushErr);
      }
    }

    const subscriberDocId = `dev_${deviceId}`;
    const payload = {
      id: subscriberDocId,
      deviceId,
      userId: userId || null,
      userEmail: userEmail || null,
      permission,
      subscription: subJson,
      endpoint: subJson?.endpoint || null,
      platform: navigator.userAgent,
      active: true,
      updatedAt: new Date().toISOString()
    };

    // 4. Send to Server API
    try {
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriberId: subscriberDocId,
          deviceId,
          userId: userId || null,
          userEmail: userEmail || null,
          platform: navigator.userAgent,
          permission,
          subscription: subJson
        })
      });
    } catch (e) {
      console.warn('Server push subscribe failed:', e);
    }

    // 5. Save in Firestore 'push_subscribers' collection
    try {
      const docRef = doc(db, 'push_subscribers', subscriberDocId);
      await setDoc(docRef, sanitizeForFirestore(payload), { merge: true });
    } catch (dbErr) {
      console.warn('Firestore push subscriber save note:', dbErr);
    }

    // 6. Only if explicitly requested, trigger single test notification
    if (triggerTestAlert && permission === 'granted') {
      playNotificationChime();
      await showTestNotification('ar');
    }

    if (permission === 'granted') {
      const extra = subJson ? ' (تم ربط رمز التشفير بنجاح)' : (pushSubError ? ` (ملاحظة: ${pushSubError})` : '');
      return { success: true, message: `تم تفعيل الإشعارات الفورية لجهازك بنجاح! 🔔${extra}` };
    } else if (permission === 'denied') {
      return { success: false, message: 'المتصفح يقرأ الإذن كـ "محظور". يرجى التأكد من تفعيل خيار الإشعارات في إعدادات الموقع.' };
    } else {
      return { success: true, message: 'تم تسجيل جهازك بنجاح في نظام التنبيهات.' };
    }
  } catch (err: any) {
    console.error('Error during push subscription:', err);
    return { success: false, message: err.message || 'حدث خطأ أثناء تفعيل الإشعارات' };
  }
}

/**
 * Unsubscribe user device from Push Notifications
 */
export async function unsubscribeUserFromPush(userId?: string): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const subJson = subscription.toJSON();
      const endpoint = subJson.endpoint;
      await subscription.unsubscribe();

      // Notify Server
      await fetch('/api/push-unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint })
      }).catch(() => {});
    }
    return true;
  } catch (err) {
    console.warn('Unsubscribe error:', err);
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
}): Promise<{ success: boolean; sentCount?: number; totalSubscribers?: number; error?: string }> {
  try {
    const res = await fetch('/api/send-push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Error broadcasting push notification:', err);
    return { success: false, error: err.message || 'Failed to dispatch push notification' };
  }
}

/**
 * Fetch total push subscribers count for Admin Dashboard
 */
export async function getPushSubscribersCount(): Promise<number> {
  let serverCount = 0;
  let firestoreCount = 0;

  try {
    const res = await fetch('/api/push-stats');
    if (res.ok) {
      const data = await res.json();
      if (typeof data.count === 'number') {
        serverCount = data.count;
      }
    }
  } catch (e) {
    console.warn('Server push-stats fetch note:', e);
  }

  try {
    const colRef = collection(db, 'push_subscribers');
    const snap = await getDocs(colRef);
    firestoreCount = snap.size;
  } catch (e) {
    console.warn('Firestore push_subscribers count note:', e);
  }

  return Math.max(serverCount, firestoreCount);
}
