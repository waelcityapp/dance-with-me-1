/**
 * Web Push Notification Management for CityEve
 * Handles VAPID public key retrieval, Service Worker subscription,
 * saving subscriber endpoints to Firestore & server, and testing chimes.
 */

import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
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

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
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
 * Subscribe current browser device to Web Push notifications
 */
export async function subscribeUserToPush(userId?: string, userEmail?: string): Promise<{ success: boolean; message?: string }> {
  if (!isPushSupported()) {
    return { success: false, message: 'المتصفح أو الجهاز لا يدعم الإشعارات الفورية (تأكد من فتح الرابط عبر Chrome أو Safari)' };
  }

  try {
    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, message: permission === 'denied' ? 'تم حظر الإشعارات في إعدادات المتصفح، يرجى السماح بها من رمز القفل بجانب الرابط' : 'لم يتم منح إذن الإشعارات' };
    }

    // 2. Ensure Service Worker is registered & ready
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration || !registration.active) {
      registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }
    
    // Wait until service worker is active
    if (registration.installing || registration.waiting) {
      await new Promise<void>((resolve) => {
        const sw = registration?.installing || registration?.waiting;
        if (sw) {
          sw.addEventListener('statechange', () => {
            if (sw.state === 'activated') resolve();
          });
        } else {
          resolve();
        }
        setTimeout(resolve, 1500);
      });
    }

    const activeRegistration = await navigator.serviceWorker.ready;

    // 3. Get VAPID Key
    const vapidPublicKey = await getVapidPublicKey();
    
    // 4. Subscribe with PushManager
    let subscription = await activeRegistration.pushManager.getSubscription();
    if (!subscription && vapidPublicKey) {
      try {
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        subscription = await activeRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      } catch (subErr) {
        console.warn('VAPID subscription error, falling back to local notifications:', subErr);
      }
    }

    if (subscription) {
      const subJson = subscription.toJSON();
      const endpointHash = btoa(subJson.endpoint || '').slice(-32).replace(/[^a-zA-Z0-9]/g, '_');
      const subscriberId = userId ? `sub_${userId}_${endpointHash}` : `sub_guest_${endpointHash}`;

      // 5. Send to Server API
      fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subJson,
          userId: userId || null,
          userEmail: userEmail || null,
          subscriberId,
          userAgent: navigator.userAgent
        })
      }).catch((e) => console.warn('Server push subscribe failed:', e));

      // 6. Save in Firestore 'push_subscribers' collection
      try {
        const docRef = doc(db, 'push_subscribers', subscriberId);
        await setDoc(docRef, sanitizeForFirestore({
          id: subscriberId,
          subscription: subJson,
          endpoint: subJson.endpoint,
          userId: userId || null,
          userEmail: userEmail || null,
          userAgent: navigator.userAgent,
          active: true,
          updatedAt: new Date().toISOString()
        }), { merge: true });
      } catch (dbErr) {
        console.warn('Firestore push subscriber save note:', dbErr);
      }
    }

    // Play chime & show immediate test notification on phone lock screen
    playNotificationChime();
    await showTestNotification('ar');

    return { success: true, message: 'تم تفعيل الإشعارات الفورية بنجاح!' };
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
 * Trigger local test notification
 */
export async function showTestNotification(lang: 'ar' | 'en' = 'ar'): Promise<void> {
  playNotificationChime();
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const title = lang === 'ar' ? '🎉 مرحباً بك في تنبيهات سيتي إيف' : '🎉 Welcome to CityEve Alerts';
  const body = lang === 'ar' 
    ? 'تم تفعيل التنبيهات بنجاح! ستصلك أحدث الحفلات والكورسات فور نشرها.'
    : 'Alerts successfully enabled! You will be notified instantly when new events drop.';
  const icon = 'https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png';

  // 1. Prefer Service Worker registration showNotification (Required for Mobile & Android lock screen)
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon,
          badge: icon,
          vibrate: [200, 100, 200],
          tag: 'cityeve-alert-' + Date.now(),
          renotify: true,
          requireInteraction: true,
          data: { url: '/' }
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
      tag: 'cityeve-alert-' + Date.now()
    } as any);
  } catch (e) {
    console.warn('Window Notification fallback note:', e);
  }
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
