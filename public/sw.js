const CACHE_VERSION = 'v=20260804';
const CACHE_NAME = `dwm-luxury-cache-${CACHE_VERSION}`;

// Core assets to cache one by one defensively
const CORE_ASSETS = [
  '/',
  `/?${CACHE_VERSION}`,
  `/index.html?${CACHE_VERSION}`,
  `/manifest.json?${CACHE_VERSION}`
];

// Defensive One-by-One Installation Strategy
self.addEventListener('install', (event) => {
  console.log('[SW Defensive] Installing & caching core assets one-by-one...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of CORE_ASSETS) {
        try {
          await cache.add(url);
          console.log(`[SW Defensive] Cached successfully: ${url}`);
        } catch (error) {
          // Failure of one item will not break PWA installation!
          console.warn(`[SW Defensive] Failed to cache item (skipped): ${url}`, error);
        }
      }
    }).then(() => {
      console.log('[SW Defensive] Install complete, skipping waiting.');
      return self.skipWaiting();
    })
  );
});

// Activate & clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW Defensive] Activating new Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name.startsWith('dwm-luxury-cache-')) {
            console.log('[SW Defensive] Removing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      // Clear out older non-versioned caches to ensure fresh start
      return self.clients.claim();
    })
  );
});

// Fetch strategy: Network First for fast loading and offline resilience
// This ensures that updates are always delivered immediately.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin or extension requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
      }
      return networkResponse;
    }).catch((err) => {
      console.warn('[SW Defensive] Network fetch failed, relying on cache:', event.request.url);
      return caches.match(event.request);
    })
  );
});

// Push Notification Listener (Web Push / FCM)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification event received:', event);
  let payload = {
    title: 'CityEve | إشعار جديد 🔔',
    body: 'يوجد إعلان جديد أو تحديث مهم في التطبيق!',
    icon: 'https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png',
    badge: 'https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png',
    url: '/',
    tag: 'cityeve-alert-' + Date.now()
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch (e) {
      const text = event.data.text();
      if (text) payload.body = text;
    }
  }

  const notificationOptions = {
    body: payload.body,
    icon: payload.icon || 'https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png',
    badge: payload.badge || 'https://res.cloudinary.com/dynasmcaj/image/upload/fbyjfjq8equle5pl7kwz.png',
    image: payload.image || undefined,
    vibrate: [300, 100, 400, 100, 300],
    tag: payload.tag || ('cityeve-alert-' + Date.now()),
    renotify: true,
    requireInteraction: true,
    data: {
      url: payload.url || '/',
      dateOfArrival: Date.now(),
      eventId: payload.eventId
    },
    actions: [
      { action: 'open', title: 'فتح الإعلان 🎟️' },
      { action: 'close', title: 'إغلاق ✕' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

// Client Message Listener for direct push notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    if (self.registration && self.registration.showNotification) {
      self.registration.showNotification(title, options);
    }
  }
});

// Handle Notification Click & Redirect
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click action:', event.action);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const rawUrl = event.notification.data?.url || '/';
  const targetUrl = rawUrl.startsWith('http') ? rawUrl : new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

