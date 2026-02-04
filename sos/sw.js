// SOS Service Worker - Offline-First Disaster Coordination
const CACHE_NAME = 'sos-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Network first, fall back to cache (for API calls)
  networkFirst: ['api.', 'supabase.co'],
  // Cache first, fall back to network (for static assets)
  cacheFirst: ['.js', '.css', '.png', '.jpg', '.svg', '.woff2'],
  // Stale while revalidate (for pages)
  staleWhileRevalidate: ['/']
};

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching critical assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // Determine cache strategy based on URL
  const isApiRequest = CACHE_STRATEGIES.networkFirst.some(pattern => 
    url.href.includes(pattern)
  );
  const isStaticAsset = CACHE_STRATEGIES.cacheFirst.some(pattern => 
    url.pathname.endsWith(pattern)
  );

  if (isApiRequest) {
    // Network first for API calls
    event.respondWith(networkFirst(request));
  } else if (isStaticAsset) {
    // Cache first for static assets
    event.respondWith(cacheFirst(request));
  } else {
    // Stale while revalidate for pages
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    throw error;
  }
}

// Cache first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline fallback if available
    return caches.match(OFFLINE_URL);
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(CACHE_NAME);
        cache.then(c => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => {
      // Network failed, return offline page for navigation
      if (request.mode === 'navigate') {
        return caches.match(OFFLINE_URL);
      }
      return null;
    });

  return cachedResponse || fetchPromise;
}

// Background sync for offline requests (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-requests') {
    console.log('[SW] Background sync: syncing offline requests');
    event.waitUntil(syncOfflineRequests());
  }
});

async function syncOfflineRequests() {
  // Future: sync any requests made while offline
  console.log('[SW] Syncing offline requests...');
}

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SOS Alert', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          // Focus existing window if open
          for (const client of clientList) {
            if (client.url === url && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }
});

console.log('[SW] Service worker loaded');
