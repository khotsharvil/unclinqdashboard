/* Minimal service worker — required for PWA installability ("Add to home screen").
 * Network-first for navigations with a tiny offline shell; passthrough otherwise.
 * Intentionally does NOT cache API responses (clinical data stays fresh + server-authoritative). */
const SHELL = 'unclinq-dash-shell-v1';

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never intercept API calls — always hit the network.
  if (url.pathname.startsWith('/api') || url.hostname.includes('clinic-api')) return;
  // App navigations: network-first, fall back to cached index for offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(SHELL).then((c) => c.put('/', copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('/'))
    );
  }
});
