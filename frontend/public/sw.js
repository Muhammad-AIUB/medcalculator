/**
 * Pocket Medical Calculator — Service Worker v1.2.0
 * Offline-first: Cache all assets aggressively on first visit.
 * All calculations are client-side → full offline support once cached.
 */

const CACHE_VERSION = 'v1.2.0';
const CACHE_NAME = `medcalc-${CACHE_VERSION}`;

const SHELL_URLS = [
  '/',
  '/calculators/egfr',
  '/calculators/child-pugh',
  '/calculators/meld-na',
  '/calculators/bmi',
  '/calculators/edd',
  '/calculators/sofa',
  '/calculators/vasopressor',
  '/calculators/tsat',
  '/manifest.json',
];

// ─── Install: pre-cache app shell ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Add shell pages; ignore failures (chunks will be cached on first visit)
      Promise.allSettled(SHELL_URLS.map(url =>
        cache.add(new Request(url, { cache: 'reload' }))
      ))
    )
  );
  self.skipWaiting();
});

// ─── Activate: wipe old caches ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  // /_next/static/ → Cache First (hashed filenames = immutable, safe to cache forever)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Images, fonts, icons → Cache First
  if (/\.(png|jpg|jpeg|svg|ico|webp|woff2?|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // API calls → Network First, short timeout, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request, 4000));
    return;
  }

  // Navigation + everything else → Stale While Revalidate
  // Shows cached page instantly offline, updates in background when online
  event.respondWith(staleWhileRevalidate(event.request));
});

// ─── Strategies ───────────────────────────────────────────────────────────────

/** Cache First: serve from cache, fetch + store if miss */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Asset not available offline', { status: 503 });
  }
}

/** Stale While Revalidate: serve cache immediately, update in background */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Always try to refresh from network in background
  const networkPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  // If we have a cached version, return it immediately
  if (cached) return cached;

  // Otherwise wait for the network
  const networkResponse = await networkPromise;
  if (networkResponse) return networkResponse;

  // Complete offline fallback: return home page for navigation requests
  if (request.mode === 'navigate') {
    const home = await cache.match('/');
    if (home) return home;
  }

  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MedCalc Pro — Offline</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0F2744;color:white;text-align:center;padding:20px}h1{font-size:1.5rem;margin-bottom:8px}p{opacity:.7;font-size:.9rem}button{margin-top:20px;padding:12px 24px;background:#0E7490;color:white;border:none;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer}</style></head><body><div><div style="font-size:3rem;margin-bottom:16px">📡</div><h1>You're offline</h1><p>Please open the app once with internet<br>to cache all calculators for offline use.</p><button onclick="location.reload()">Retry</button></div></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

/** Network First: try network, fallback to cache, then error */
async function networkFirst(request, timeoutMs) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(request.clone(), { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached ?? new Response(JSON.stringify({ offline: true }), {
      status: 503, headers: { 'Content-Type': 'application/json' }
    });
  }
}
