const CACHE_NAME = 'touch-grass-shell-v1';
const APP_SHELL = ['/', '/manifest.webmanifest', '/icon.svg'];
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    const shell = await cache.match('/');
    const markup = await shell.text();
    const assets = [...markup.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(([, asset]) => asset);
    await Promise.all(assets.map(async (asset) => {
      const response = await fetch(asset);
      if (response.ok) await cache.put(asset, response);
    }));
  })());
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(caches.match(request).then((cached) => {
    const networkRequest = fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
      return response;
    }).catch(() => cached || (request.mode === 'navigate' ? caches.match('/') : undefined));
    return cached || networkRequest;
  }));
});