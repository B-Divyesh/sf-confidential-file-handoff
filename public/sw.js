const VERSION = 'confidential-handoff-v1';
const APP_SHELL = ['/', '/index.html', '/offline.html', '/manifest.webmanifest', '/print-desk.webp', '/icons/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/assets/app.js', '/assets/style.css'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => { const copy = response.clone(); caches.open(VERSION).then((cache) => cache.put('/index.html', copy)); return response; }).catch(() => caches.match('/index.html').then((response) => response || caches.match('/offline.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => { if (new URL(event.request.url).origin === location.origin) { const copy = response.clone(); caches.open(VERSION).then((cache) => cache.put(event.request, copy)); } return response; })));
});
