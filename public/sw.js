/* Development fallback. Production builds replace this file with a content-versioned worker. */
const CACHE = 'confidential-handoff-development';
const SHELL = ['/', '/index.html', '/offline.html', '/privacy/', '/terms/', '/manifest.webmanifest'];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') event.respondWith(fetch(event.request).catch(async () => (await caches.match(event.request)) || (await caches.match('/offline.html'))));
});
