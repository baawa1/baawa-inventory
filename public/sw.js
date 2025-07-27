/**
 * Service Worker for BaaWA Accessories POS
 * Handles offline caching, background sync, and PWA functionality
 */

const CACHE_NAME = 'baawa-pos-v2';
const OFFLINE_CACHE = 'baawa-pos-offline-v2';
const DYNAMIC_CACHE = 'baawa-pos-dynamic-v2';

// Files to cache immediately - only include files that actually exist
const STATIC_ASSETS = [
  '/',
  '/login',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
];

// URLs that should always go to network first
const NETWORK_FIRST_URLS = [
  '/api/auth/',
  '/api/pos/create-sale',
  '/api/pos/transactions',
  '/api/pos/products',
  '/api/pos/search-products',
];

// URLs that can be served from cache first
const CACHE_FIRST_URLS = ['/_next/static/', '/icons/', '/fonts/', '/images/'];

self.addEventListener('install', event => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(async cache => {
        console.log('[SW] Caching static assets');

        // Cache each asset individually to avoid complete failure if one fails
        const cachePromises = STATIC_ASSETS.map(async asset => {
          try {
            await cache.add(asset);
            console.log(`[SW] Cached: ${asset}`);
          } catch (error) {
            console.warn(`[SW] Failed to cache ${asset}:`, error);
          }
        });

        await Promise.allSettled(cachePromises);
        console.log('[SW] Static assets caching completed');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to open cache:', error);
        return self.skipWaiting(); // Continue installation even if caching fails
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== OFFLINE_CACHE &&
              cacheName !== DYNAMIC_CACHE
            ) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activated');
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Skip external domains (like placeholder images) - let browser handle them
  if (
    url.hostname !== 'localhost' &&
    url.hostname !== '127.0.0.1' &&
    !url.hostname.includes('localhost')
  ) {
    return;
  }

  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets with cache first strategy
  if (CACHE_FIRST_URLS.some(pattern => url.pathname.startsWith(pattern))) {
    event.respondWith(handleCacheFirst(request));
    return;
  }

  // Handle navigation requests
  if (request.destination === 'document') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Default network first strategy
  event.respondWith(handleNetworkFirst(request));
});

async function handleApiRequest(request) {
  const url = new URL(request.url);

  try {
    // Always try network first for API requests
    const response = await fetch(request);

    // Cache successful responses for offline fallback
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] API request failed, checking cache:', url.pathname);

    // Try to serve from cache if network fails
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[SW] Serving API response from cache');
      return cachedResponse;
    }

    // Return offline response for specific endpoints
    if (url.pathname.includes('/api/pos/products')) {
      return new Response(
        JSON.stringify({
          products: [],
          message: 'Offline mode - using cached data',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    throw error;
  }
}

async function handleCacheFirst(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      // Serve from cache and update in background
      fetch(request)
        .then(response => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
        })
        .catch(() => {
          // Network error is fine for cache-first strategy
        });

      return cachedResponse;
    }

    // Not in cache, fetch from network
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('[SW] Cache first strategy failed:', error);
    throw error;
  }
}

async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const response = await fetch(request);

    // Cache successful navigation responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Navigation request failed, trying cache');

    // Try to serve from cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Serve offline page for navigation failures
    const offlineCache = await caches.open(CACHE_NAME);
    const offlinePage = await offlineCache.match('/offline');

    if (offlinePage) {
      return offlinePage;
    }

    // Last resort - basic offline response
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Offline - BaaWA POS</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; }
            .offline-message { max-width: 400px; margin: 0 auto; }
            .icon { font-size: 64px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <div class="icon">📱</div>
            <h1>You're Offline</h1>
            <p>This page is not available offline. Please check your connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' },
        status: 200,
      }
    );
  }
}

async function handleNetworkFirst(request) {
  try {
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Try to serve from cache
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }

    throw error;
  }
}

// Background sync for offline transactions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'pos-transactions-sync') {
    event.waitUntil(syncOfflineTransactions());
  }
});

async function syncOfflineTransactions() {
  try {
    console.log('[SW] Syncing offline transactions...');

    // This would integrate with your offline storage
    // For now, we'll just post a message to the main thread
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_OFFLINE_TRANSACTIONS',
        timestamp: Date.now(),
      });
    });

    console.log('[SW] Offline transaction sync completed');
  } catch (error) {
    console.error('[SW] Failed to sync offline transactions:', error);
  }
}

// Handle messages from the main thread
self.addEventListener('message', event => {
  const { data } = event;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (data.type === 'CLAIM_CLIENTS') {
    self.clients.claim();
  }

  if (data.type === 'CACHE_PRODUCTS') {
    event.waitUntil(cacheProductsData(data.products));
  }
});

async function cacheProductsData(products) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);

    // Cache products as a JSON response
    const response = new Response(JSON.stringify({ products }), {
      headers: { 'Content-Type': 'application/json' },
    });

    await cache.put('/api/pos/products?offline=true', response);
    console.log('[SW] Cached products data for offline use');
  } catch (error) {
    console.error('[SW] Failed to cache products:', error);
  }
}

console.log('[SW] Service Worker loaded');
