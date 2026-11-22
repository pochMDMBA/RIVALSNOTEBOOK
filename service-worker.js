/* OLFACULATOR PWA shell: navigation is network-first so GitHub/Vercel updates appear promptly. */
const CACHE_NAME = 'olfaculator-shell-v14';
const ROOT = new URL('./', self.registration.scope).toString();
const SHELL_FILES = [
  ROOT,
  new URL('manifest.webmanifest', ROOT).toString(),
  new URL('icons/favicon.svg', ROOT).toString(),
  new URL('icons/favicon-32.png', ROOT).toString(),
  new URL('icons/apple-touch-icon.png', ROOT).toString(),
  new URL('icons/icon-192.png', ROOT).toString(),
  new URL('icons/icon-512.png', ROOT).toString(),
  new URL('icons/icon-maskable-512.png', ROOT).toString()
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('olfaculator-shell-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        return (await caches.match(request)) || (await caches.match(ROOT));
      }
    })());
    return;
  }
  if (url.pathname.includes('/icons/') || url.pathname.endsWith('/manifest.webmanifest')) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })());
  }
});
