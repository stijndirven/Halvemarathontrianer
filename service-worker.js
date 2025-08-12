// Service worker that builds absolute URLs from its registration scope,
// so it works when served from a GitHub Pages subpath (e.g. username.github.io/repo/).
const CACHE = 'hm-coach-v2';
const PRECACHE_FILES = [
  '',
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

// Build absolute URLs based on the service worker scope
const FILES = (function(){
  const base = self.registration && self.registration.scope ? self.registration.scope : './';
  return PRECACHE_FILES.map(p => new URL(p, base).href);
})();

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  evt.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', evt => {
  evt.respondWith(
    caches.match(evt.request).then(resp => resp || fetch(evt.request))
  );
});
