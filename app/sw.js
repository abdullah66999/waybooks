// Service Worker for WayBooks PWA — full offline reading
const CACHE_NAME = 'waybooks-v2.6-clean';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Only handle HTTP/HTTPS requests
  if (!url.protocol.startsWith('http')) return;

  // Network-first for html and library index/manifest to always fetch the latest books catalog
  const isCatalogOrHtml = url.pathname.endsWith('index.html') || 
                          url.pathname.endsWith('/') || 
                          url.pathname.includes('/library/index.json') ||
                          url.pathname.includes('/books/manifest.json');

  if (isCatalogOrHtml) {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const toCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, toCache));
          }
          return response;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first for images, fonts, static hashed assets
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, toCache);
          });
          return response;
        })
        .catch(() => cached);
    })
  );
});
