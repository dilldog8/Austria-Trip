// ───────────────────────────────────────────────────────────────
// Service Worker — Bennett Austria Base Camp
// Gives the app offline support (works with no signal once installed).
// Upload this file alongside index.html in the same GitHub repo folder.
// ───────────────────────────────────────────────────────────────

const CACHE = 'austria-app-v1';

// The core files to cache for offline use.
// './' is the app itself (index.html). The two CDN URLs are the font + PDF library.
const ASSETS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];

// On install: pre-cache the app shell.
self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // Cache the app itself first (most important); CDN assets are best-effort.
      return cache.add('./').then(function () {
        return Promise.all(
          ASSETS.map(function (url) {
            return cache.add(url).catch(function () { /* ignore individual failures */ });
          })
        );
      });
    })
  );
});

// On activate: clean up any old caches from previous versions.
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

// On fetch: serve from cache first (fast + offline), update cache in background.
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var networkFetch = fetch(event.request).then(function (response) {
        if (response && response.status === 200) {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(event.request, copy);
          }).catch(function () {});
        }
        return response;
      }).catch(function () {
        // Network failed — return cached app shell for navigations.
        if (event.request.mode === 'navigate') {
          return caches.match('./');
        }
        return cached;
      });

      // Serve cached version immediately if present, else wait for network.
      return cached || networkFetch;
    })
  );
});
