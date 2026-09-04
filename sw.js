/* Tower Siege — service worker.
   The point of it is that an installed copy opens with no connection at all,
   not that it loads faster: the game is one HTML file plus three libraries off
   a CDN, and a phone underground should still get the thing it already
   downloaded once. Nothing here is required for the game to run in a tab. */

const CACHE = 'siege-v1';

// Everything the game needs to start, taken during install rather than on the
// way past: the first visit is not under this worker's control, so anything
// left to be picked up opportunistically would not be on disk until the second
// one. The library URLs carry their version, so bumping the import map fetches
// the new file instead of being served the old one forever.
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './favicon.svg',
  './icon-32.png',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
  'https://unpkg.com/three@0.160.0/build/three.module.js',
  'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js',
  'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js',
];

// Fonts come back opaque, because a stylesheet link is a no-cors request. An
// opaque response cannot be inspected, so caching one is caching something that
// might be an error page — worth it here and nowhere else, since the worst case
// is the game falling back to the system font it already names.
const OPAQUE_OK = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

self.addEventListener('install', e => {
  // One at a time and forgiving: a single missing file must not throw the whole
  // install away.
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function store(req, res) {
  if (!res) return;
  const ok = res.status === 200 || (res.type === 'opaque' && OPAQUE_OK.test(req.url));
  if (!ok) return;
  caches.open(CACHE).then(c => c.put(req, res)).catch(() => {});
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // The page itself is network-first, so a push actually reaches players and
  // the cached copy is only the offline fallback. ignoreSearch because a link
  // game arrives with a room id on the query string.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => { store(req, r.clone()); return r; })
        .catch(() => caches.match(req, { ignoreSearch: true })
                       .then(m => m || caches.match('./index.html')))
    );
    return;
  }

  // Everything else is versioned or immutable, so the copy on disk wins and a
  // miss is filled in behind it. ignoreVary because the CDNs vary on
  // Accept-Encoding, and a stored copy that the page's own request does not
  // match is a copy that only exists to be missed while offline.
  e.respondWith(
    caches.match(req, { ignoreVary: true })
      .then(hit => hit || fetch(req).then(r => { store(req, r.clone()); return r; }))
  );
});
