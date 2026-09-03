// FRAZX PRO Service Worker
// Strategy:
// - Static assets (CSS/JS/icons): cache-first (fast repeat loads, rarely change)
// - HTML pages: network-first, falls back to cache when offline
// - Supabase/API calls: always network (never cache live data)

const CACHE_NAME = 'frazxpro-v1';

const STATIC_ASSETS = [
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/apple-touch-icon.png'
];

// Install: pre-cache core static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean up old cache versions
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Never touch cross-origin requests (Supabase, Cloudinary, Groq, CDNs, Analytics) - always network
    if (url.origin !== self.location.origin) {
        return;
    }

    // Never cache the API proxy route
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // HTML page navigations: network-first, fallback to cache, then a minimal offline message
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const resClone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
                    return res;
                })
                .catch(() =>
                    caches.match(req).then((cached) => cached || caches.match('/'))
                )
        );
        return;
    }

    // Static assets: cache-first, fall back to network, update cache in background
    event.respondWith(
        caches.match(req).then((cached) => {
            const networkFetch = fetch(req)
                .then((res) => {
                    if (res && res.ok) {
                        const resClone = res.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
                    }
                    return res;
                })
                .catch(() => cached);
            return cached || networkFetch;
        })
    );
});
