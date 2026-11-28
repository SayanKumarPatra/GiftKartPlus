// GiftKart PWA Service Worker v8 — fast Cache-First static bundles/icons,
// Stale-While-Revalidate for public Supabase product media, Network-Only for live APIs & HTML,
// plus background Web Push notifications.
const STATIC_CACHE = 'giftkart-static-v8';
const MEDIA_CACHE = 'giftkart-media-v8';
const ACTIVE_CACHES = new Set([STATIC_CACHE, MEDIA_CACHE]);
const MAX_MEDIA_ENTRIES = 120;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if ('caches' in self) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => !ACTIVE_CACHES.has(key))
            .map((key) => caches.delete(key))
        );
      }
      await self.clients.claim();
    })()
  );
});

async function trimCache(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxEntries) {
      const toDelete = keys.slice(0, keys.length - maxEntries);
      await Promise.all(toDelete.map((req) => cache.delete(req)));
    }
  } catch {
    // Ignore cache trim errors
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // 1. Public Supabase Storage media images -> Stale-While-Revalidate (fast repeat loads)
  const isSupabasePublicMedia =
    url.hostname.endsWith('.supabase.co') &&
    url.pathname.startsWith('/storage/v1/object/public/');

  if (isSupabasePublicMedia) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(MEDIA_CACHE);
        const cached = await cache.match(event.request);
        const networkPromise = fetch(event.request)
          .then((response) => {
            if (response && (response.ok || response.type === 'opaque')) {
              cache.put(event.request, response.clone()).then(() => {
                void trimCache(MEDIA_CACHE, MAX_MEDIA_ENTRIES);
              });
            }
            return response;
          })
          .catch(() => cached);

        return cached || networkPromise;
      })()
    );
    return;
  }

  // Never intercept cross-origin APIs (Supabase REST/Auth/Realtime, Google Fonts, etc.)
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // 2. HTML navigations -> Always Network-First (no-store) so new Vercel deploys load fresh
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(new Request(event.request.url, { cache: 'no-store' })).catch(() =>
        fetch(event.request)
      )
    );
    return;
  }

  // 3. Immutable static bundles & local assets (/assets/*, /icons/*) -> Cache-First
  const isStaticAsset =
    url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/');

  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(event.request);
        if (cached) return cached;

        const response = await fetch(event.request);
        if (response && response.ok) {
          cache.put(event.request, response.clone());
        }
        return response;
      })()
    );
    return;
  }

  // 4. Everything else -> pass through to network
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
