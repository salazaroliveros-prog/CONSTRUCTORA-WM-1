const CACHE_NAME = 'wm-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/main.css',
  '/assets/css/style.css',
  '/assets/js/app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Use a more robust caching strategy: cache one by one to avoid total failure
        return Promise.allSettled(
          urlsToCache.map(url => cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err)))
        );
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then(response => {
          // Don't cache if not a valid response or if it's from a CDN we don't want to cache
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Dynamically cache other successful GET requests
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return response;
        }).catch(() => {
          // Offline fallback could go here
        });
      })
  );
});
