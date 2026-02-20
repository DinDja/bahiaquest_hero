self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Optional: very small cache to allow offline fallback of basic shell
const CACHE_NAME = 'bahiaquest-shell-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/index.css',
  '/js/index.js'
];

self.addEventListener('fetch', (event) => {
  // Try network first, fallback to cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
