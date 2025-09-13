// Service Worker for Zen Store - Advanced Caching and PWA Features
// Version: 1.0.0

const CACHE_VERSION = 'zen-store-v1';
const STATIC_CACHE = 'zen-store-static-v1';
const API_CACHE = 'zen-store-api-v1';
const IMAGE_CACHE = 'zen-store-images-v1';
const FONT_CACHE = 'zen-store-fonts-v1';

// Cache configuration
const CACHE_CONFIG = {
  static: {
    name: STATIC_CACHE,
    maxEntries: 100,
    maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  },
  api: {
    name: API_CACHE,
    maxEntries: 50,
    maxAgeSeconds: 5 * 60, // 5 minutes
  },
  images: {
    name: IMAGE_CACHE,
    maxEntries: 200,
    maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
  },
  fonts: {
    name: FONT_CACHE,
    maxEntries: 20,
    maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
  }
};

// Resources to cache on install
const STATIC_RESOURCES = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/_next/static/css/',
  '/_next/static/js/',
];

// API endpoints that should be cached
const CACHEABLE_API_ROUTES = [
  '/api/auth/me',
  '/api/analytics',
  '/api/performance',
];

/**
 * Install Event - Cache static resources
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_RESOURCES.filter(url => url));
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!Object.values(CACHE_CONFIG).some(config => config.name === cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ])
  );
});

/**
 * Fetch Event - Handle all network requests with appropriate caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Route to appropriate caching strategy
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else if (isFontRequest(url)) {
    event.respondWith(handleFontRequest(request));
  } else {
    event.respondWith(handleNavigationRequest(request));
  }
});

/**
 * Static Assets - Cache First Strategy
 * Fast loading for CSS, JS, and other static files
 */
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Return cached version immediately
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await cleanupCache(STATIC_CACHE, CACHE_CONFIG.static.maxEntries);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    return new Response('Static asset unavailable', { status: 503 });
  }
}

/**
 * API Requests - Network First with Stale While Revalidate
 * Fresh data when possible, cached fallback when offline
 */
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(API_CACHE);
    
    // Try network first
    try {
      const networkResponse = await fetch(request, {
        headers: {
          ...request.headers,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (networkResponse.ok) {
        // Cache successful response
        await cache.put(request, networkResponse.clone());
        await cleanupCache(API_CACHE, CACHE_CONFIG.api.maxEntries);
        return networkResponse;
      }
    } catch (networkError) {
      console.log('[SW] Network failed for API request, trying cache');
    }
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Check if cached response is still fresh
      const cacheDate = new Date(cachedResponse.headers.get('date') || 0);
      const now = new Date();
      const age = (now - cacheDate) / 1000; // age in seconds
      
      if (age < CACHE_CONFIG.api.maxAgeSeconds) {
        return cachedResponse;
      }
    }
    
    return new Response(JSON.stringify({ error: 'API unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[SW] API request failed:', error);
    return new Response(JSON.stringify({ error: 'Service unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Images - Cache First with Network Fallback
 * Fast image loading with automatic optimization
 */
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await cleanupCache(IMAGE_CACHE, CACHE_CONFIG.images.maxEntries);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Image fetch failed:', error);
    // Return placeholder or fallback image
    return new Response('', { status: 404 });
  }
}

/**
 * Fonts - Cache First (Long-term caching)
 * Fonts rarely change, so cache aggressively
 */
async function handleFontRequest(request) {
  try {
    const cache = await caches.open(FONT_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      await cleanupCache(FONT_CACHE, CACHE_CONFIG.fonts.maxEntries);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Font fetch failed:', error);
    return new Response('', { status: 404 });
  }
}

/**
 * Navigation Requests - Network First with Cache Fallback
 * Always try to get fresh HTML, fallback to cached version
 */
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for navigation, trying cache');
  }
  
  // Fallback to cache
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Ultimate fallback - offline page
  return new Response(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Offline - Zen Store</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
          .offline { color: #666; }
        </style>
      </head>
      <body>
        <div class="offline">
          <h1>You're Offline</h1>
          <p>Please check your internet connection and try again.</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

/**
 * Helper Functions
 */

// Check if request is for static assets
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.ico') ||
    url.pathname === '/manifest.json'
  );
}

// Check if request is for API
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/');
}

// Check if request is for images
function isImageRequest(url) {
  return (
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i) ||
    url.pathname.startsWith('/_next/image')
  );
}

// Check if request is for fonts
function isFontRequest(url) {
  return url.pathname.match(/\.(woff|woff2|ttf|eot)$/i);
}

// Clean up cache when it exceeds max entries
async function cleanupCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxEntries) {
    // Remove oldest entries (FIFO)
    const entriesToDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(entriesToDelete.map(key => cache.delete(key)));
  }
}

/**
 * Background Sync for offline actions
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  console.log('[SW] Handling background sync');
  // Implement background sync logic for offline actions
  // This could include syncing user data, analytics, etc.
}

/**
 * Push Notifications (for future PWA features)
 */
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/dashboard')
  );
});

/**
 * Message Handler for communication with main thread
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATS') {
    getCacheStats().then(stats => {
      event.ports[0].postMessage(stats);
    });
  }
});

// Get cache statistics for monitoring
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = {
      entries: keys.length,
      size: await getCacheSize(cache, keys)
    };
  }
  
  return stats;
}

// Calculate approximate cache size
async function getCacheSize(cache, keys) {
  let totalSize = 0;
  
  for (const key of keys.slice(0, 10)) { // Sample first 10 entries
    try {
      const response = await cache.match(key);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    } catch (error) {
      // Ignore errors for size calculation
    }
  }
  
  // Estimate total size based on sample
  return Math.round((totalSize / Math.min(keys.length, 10)) * keys.length);
}

console.log('[SW] Service Worker loaded successfully');