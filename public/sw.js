const CACHE_NAME = 'mezmur-hub-v3';
const BRANDING_CACHE = 'branding-assets-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== BRANDING_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // APP ICON HIJACKING: Serve the custom logo if available when /logo.png is requested
  if (url.pathname === '/logo.png') {
    event.respondWith(
      caches.open(BRANDING_CACHE).then(cache => {
        return cache.match('custom-logo').then(matched => {
          return matched || fetch(event.request);
        });
      })
    );
    return;
  }

  // Network-first strategy for index.html and assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && event.request.method === 'GET') {
          if (!url.pathname.includes('audio') && !url.hostname.includes('firestore')) {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, cacheCopy));
          }
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
