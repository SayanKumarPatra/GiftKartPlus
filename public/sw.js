// GiftKart PWA Service Worker v4 — purges stale caches and always fetches fresh HTML on navigation
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if ('caches' in self) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Never serve stale cached HTML documents when deploying new live builds
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(new Request(event.request.url, { cache: 'no-store' })).catch(() =>
        fetch(event.request)
      )
    );
    return;
  }

  event.respondWith(fetch(event.request));
});
