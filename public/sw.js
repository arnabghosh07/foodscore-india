const CACHE_NAME = 'foodscore-v2';
const STATIC_ASSETS = [
  '/',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Open Food Facts API: both .org and .net domains
  // Strategy: Network first, fall back to cache (for offline support)
  const isOFFApi =
    url.hostname === 'world.openfoodfacts.org' ||
    url.hostname === 'world.openfoodfacts.net';

  if (isOFFApi) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline fallback: return cached response if available
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // No cache either — return a synthetic "offline" JSON response
            return new Response(
              JSON.stringify({ status: 0, status_verbose: 'offline', product: null }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Product images from Open Food Facts: Cache first (images rarely change)
  const isOFFImage =
    url.hostname === 'images.openfoodfacts.org' ||
    url.hostname === 'images.openfoodfacts.net';

  if (isOFFImage) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Static assets (JS/CSS/fonts): Cache first, update in background
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cached) => {
          const fetched = fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          });
          return cached || fetched;
        });
      })
    );
    return;
  }

  // Navigation requests: Network first, fall back to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match('/').then((cached) => {
            return (
              cached ||
              new Response('Offline', {
                status: 503,
                headers: { 'Content-Type': 'text/html' },
              })
            );
          });
        })
    );
    return;
  }

  // Default: Network only (don't cache arbitrary requests)
  // Previously this fell back to cache which returned undefined → TypeError
  event.respondWith(fetch(request));
});
