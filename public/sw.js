const VERSION = 'escape-math-v1';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
];

const isStaticAsset = (requestUrl, request) => {
  if (request.destination === 'style' || request.destination === 'script') {
    return true;
  }

  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'manifest'
  ) {
    return true;
  }

  return (
    requestUrl.pathname.startsWith('/_next/static/') ||
    requestUrl.pathname.startsWith('/_next/image') ||
    /\.(?:js|css|png|jpg|jpeg|svg|webp|gif|ico|woff2?)$/i.test(
      requestUrl.pathname
    )
  );
};

const isBypassedPath = (pathname) =>
  pathname.startsWith('/api/') ||
  pathname.startsWith('/auth/') ||
  pathname.startsWith('/_next/webpack-hmr');

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (isBypassedPath(requestUrl.pathname)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches
              .open(RUNTIME_CACHE)
              .then((cache) => cache.put(request, responseClone));
          }

          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          return cachedPage || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  if (isStaticAsset(requestUrl, request)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const responseClone = response.clone();
              caches
                .open(RUNTIME_CACHE)
                .then((cache) => cache.put(request, responseClone));
            }

            return response;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkFetch;
      })
    );
  }
});
