/**
 * MedCalc Pro — Service Worker
 * Offline-first PWA strategy:
 *   - App shell: Cache First (HTML, JS, CSS)
 *   - API calls: Network First with fallback
 *   - Static assets: Stale While Revalidate
 */

const CACHE_VERSION = 'v1.0.0';
const SHELL_CACHE = `medcalc-shell-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `medcalc-dynamic-${CACHE_VERSION}`;
const API_CACHE = `medcalc-api-${CACHE_VERSION}`;

const APP_SHELL_URLS = [
  '/',
  '/calculators/egfr',
  '/calculators/child-pugh',
  '/calculators/meld-na',
  '/calculators/bmi',
  '/calculators/edd',
  '/calculators/sofa',
  '/calculators/vasopressor',
  '/calculators/tsat',
  '/history',
  '/favorites',
  '/settings',
  '/manifest.json',
];

const CACHE_STRATEGIES = {
  isAppShell: (url) => APP_SHELL_URLS.some(u => url.pathname === u) || url.pathname.startsWith('/_next/static/'),
  isAPICall: (url) => url.pathname.startsWith('/api/'),
  isStaticAsset: (url) => /\.(png|jpg|jpeg|svg|ico|woff2?|ttf)$/.test(url.pathname),
};

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(APP_SHELL_URLS.map(u => new Request(u, { cache: 'reload' })));
    }).catch((err) => {
      console.warn('[SW] Pre-cache failed:', err);
    })
  );
  self.skipWaiting();
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(key => key !== SHELL_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  if (CACHE_STRATEGIES.isAPICall(url)) {
    // Network First — cache API responses as fallback
    event.respondWith(networkFirstWithCache(event.request, API_CACHE, 5000));
  } else if (CACHE_STRATEGIES.isAppShell(url)) {
    // Cache First — serve from cache, fallback to network
    event.respondWith(cacheFirstWithFallback(event.request, SHELL_CACHE));
  } else if (CACHE_STRATEGIES.isStaticAsset(url)) {
    // Stale While Revalidate
    event.respondWith(staleWhileRevalidate(event.request, DYNAMIC_CACHE));
  } else {
    // Default: Network First
    event.respondWith(networkFirstWithCache(event.request, DYNAMIC_CACHE, 3000));
  }
});

async function networkFirstWithCache(request, cacheName, timeoutMs = 5000) {
  const cache = await caches.open(cacheName);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(request.clone(), { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'Offline — cached data not available', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function cacheFirstWithFallback(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request.clone());
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/');
      if (offlinePage) return offlinePage;
    }
    throw new Error('Network and cache both failed');
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request.clone()).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached ?? await networkFetch;
}
