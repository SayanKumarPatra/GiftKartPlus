// GiftKart PWA Service Worker v7 — supports background Web Push lock-screen alerts, vibration, click routing & fresh HTML
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

// Background & Lock-Screen Web Push Handler
self.addEventListener('push', (event) => {
  let payload = {
    id: `push-${Date.now()}`,
    title: 'GiftKart Update',
    body: 'You have a new update from GiftKart!',
    url: '/',
    tag: `giftkart-alert-${Date.now()}`,
    icon: '/icons/icon-192x192.png?v=2',
    badge: '/icons/icon-192x192.png?v=2',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      if (parsed && typeof parsed === 'object') {
        payload = {
          ...payload,
          id: typeof parsed.id === 'string' && parsed.id ? parsed.id : payload.id,
          title: typeof parsed.title === 'string' && parsed.title ? parsed.title : payload.title,
          body: typeof parsed.body === 'string' && parsed.body ? parsed.body : payload.body,
          url: typeof parsed.url === 'string' && parsed.url ? parsed.url : payload.url,
          tag: typeof parsed.tag === 'string' && parsed.tag ? parsed.tag : payload.tag,
          icon: typeof parsed.icon === 'string' && parsed.icon ? parsed.icon : payload.icon,
          badge: typeof parsed.badge === 'string' && parsed.badge ? parsed.badge : payload.badge,
        };
      }
    } catch {
      const text = event.data.text();
      if (text) payload.body = text;
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag,
    renotify: true,
    silent: false,
    vibrate: [220, 100, 220, 100, 320],
    data: {
      url: payload.url,
      id: payload.id,
    },
  };

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(payload.title, options);

      // Notify any open GiftKart windows so they immediately play the custom GiftKart chime & refresh
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        try {
          client.postMessage({
            type: 'GIFTKART_PUSH_RECEIVED',
            payload: {
              ...payload,
              fromServiceWorker: true,
            },
          });
        } catch {
          // Ignore individual client postMessage failures
        }
      }
    })()
  );
});

// Tap on Lock-Screen / System Notification -> Open or Focus GiftKart App
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl =
    (event.notification.data && typeof event.notification.data.url === 'string'
      ? event.notification.data.url
      : '/') || '/';

  // Only allow safe same-origin relative URLs
  const safePath = rawUrl.startsWith('/') && !rawUrl.startsWith('//') ? rawUrl : '/';
  const targetUrl = new URL(safePath, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of windowClients) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            try {
              await client.navigate(targetUrl);
            } catch {
              // Ignore if SPA navigation is preferred
            }
          }
          return;
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});
