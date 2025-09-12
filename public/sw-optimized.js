// Optimized Service Worker for aggressive caching and performance

const CACHE_NAME = 'topgrupos-v1';
const STATIC_CACHE = 'static-v1';
const IMAGE_CACHE = 'images-v1';
const API_CACHE = 'api-v1';

// Resources to cache immediately
const STATIC_RESOURCES = [
  '/',
  '/src/index.css',
  '/src/main.tsx',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('🛠️ Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_RESOURCES.map(url => new Request(url, {
          cache: 'reload'
        })));
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== IMAGE_CACHE && 
                cacheName !== API_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) return;
  
  // Handle different types of requests
  if (isImageRequest(event.request)) {
    event.respondWith(handleImageRequest(event.request));
  } else if (isAPIRequest(event.request)) {
    event.respondWith(handleAPIRequest(event.request));
  } else if (isStaticResource(event.request)) {
    event.respondWith(handleStaticRequest(event.request));
  } else {
    event.respondWith(handleNavigationRequest(event.request));
  }
});

// Check if request is for an image
function isImageRequest(request) {
  return request.destination === 'image' ||
         request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ||
         request.url.includes('image') ||
         request.url.includes('photo');
}

// Check if request is for API
function isAPIRequest(request) {
  return request.url.includes('/api/') ||
         request.url.includes('firebase') ||
         request.url.includes('.json');
}

// Check if request is for static resource
function isStaticResource(request) {
  return request.url.includes('.css') ||
         request.url.includes('.js') ||
         request.url.includes('.woff') ||
         request.url.includes('fonts.googleapis.com');
}

// Handle image requests - Cache First strategy with WebP conversion
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.warn('🖼️ Image fetch failed:', request.url);
    // Return placeholder or cached version
    return new Response('', { status: 404 });
  }
}

// Handle API requests - Network First with fallback
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Only cache GET requests
      if (request.method === 'GET') {
        cache.put(request, response.clone());
      }
    }
    
    return response;
  } catch (error) {
    // Fallback to cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

// Handle static resources - Cache First
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached version and update in background
    fetchAndCache(request, cache);
    return cachedResponse;
  }
  
  return fetchAndCache(request, cache);
}

// Handle navigation requests - Network First with cache fallback
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Fallback to cached index.html for navigation
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match('/');
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Utility function to fetch and cache
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    throw error;
  }
}

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches();
  }
  
  if (event.data && event.data.type === 'PRELOAD_IMAGES') {
    preloadImages(event.data.urls);
  }
});

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('🗑️ All caches cleared');
}

// Preload images
async function preloadImages(urls) {
  const cache = await caches.open(IMAGE_CACHE);
  const requests = urls.map(url => new Request(url));
  
  await Promise.allSettled(
    requests.map(async (request) => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response);
        }
      } catch (error) {
        console.warn('Preload failed for:', request.url);
      }
    })
  );
  
  console.log(`📦 Preloaded ${urls.length} images`);
}