const CACHE_VERSION = 'v=20260717';
const CACHE_NAME = `dwm-luxury-cache-${CACHE_VERSION}`;

// Core assets to cache one by one defensively
const CORE_ASSETS = [
  '/',
  `/?${CACHE_VERSION}`,
  `/index.html?${CACHE_VERSION}`,
  `/manifest.json?${CACHE_VERSION}`,
  `/icon.svg?${CACHE_VERSION}`
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
