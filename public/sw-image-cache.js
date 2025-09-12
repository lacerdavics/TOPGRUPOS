// Service Worker for aggressive image caching
const CACHE_NAME = 'topgrupos-images-v2';
const IMAGE_CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_CACHE_SIZE = 200; // Maximum number of cached images

self.addEventListener('install', (event) => {
  console.log('📦 SW: Installing image cache service worker');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ SW: Image cache service worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('topgrupos-images-') && cacheName !== CACHE_NAME) {
            console.log('🗑️ SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Only handle image requests
  if (!isImageRequest(request)) {
    return;
  }

  event.respondWith(
    handleImageRequest(request)
  );
});

function isImageRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();
  
  // Check file extension
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(pathname)) {
    return true;
  }
  
  // Check image hosting services
  const imageHosts = [
    'ui-avatars.com',
    'cdn.',
    'images.',
    'img.',
    'photo',
    'avatar',
    'profile',
    'firebase',
    'imgbb.com',
    'wsrv.nl',
    'weserv.nl'
  ];
  
  return imageHosts.some(host => url.hostname.includes(host) || url.href.includes(host));
}

async function handleImageRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Return cached response if available and not expired
    if (cachedResponse) {
      const cachedDate = new Date(cachedResponse.headers.get('sw-cached-date') || 0);
      const isExpired = Date.now() - cachedDate.getTime() > IMAGE_CACHE_MAX_AGE;
      
      if (!isExpired) {
        console.log('🎯 SW: Serving cached image:', request.url);
        return cachedResponse;
      } else {
        console.log('⏰ SW: Cached image expired, fetching new:', request.url);
        await cache.delete(request);
      }
    }
    
    // Fetch new image
    console.log('🔄 SW: Fetching image:', request.url);
    const response = await fetch(request, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (response.ok && response.status === 200) {
      // Clone response for caching
      const responseToCache = response.clone();
      
      // Add custom headers to track cache date
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      
      const cachedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      // Cache the response
      await cache.put(request, cachedResponse);
      console.log('✅ SW: Image cached:', request.url);
      
      // Cleanup old cache entries
      await cleanupCache(cache);
      
      return response;
    }
    
    return response;
    
  } catch (error) {
    console.warn('⚠️ SW: Failed to handle image request:', error);
    
    // Try to return cached version even if expired
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('🚨 SW: Returning expired cache as fallback:', request.url);
      return cachedResponse;
    }
    
    // Return a placeholder image or let the request fail
    throw error;
  }
}

async function cleanupCache(cache) {
  try {
    const requests = await cache.keys();
    
    if (requests.length > MAX_CACHE_SIZE) {
      console.log(`🧹 SW: Cleaning up cache, ${requests.length} items found`);
      
      // Get cache entries with dates
      const entries = await Promise.all(
        requests.map(async (request) => {
          const response = await cache.match(request);
          const cachedDate = new Date(response?.headers.get('sw-cached-date') || 0);
          return { request, cachedDate: cachedDate.getTime() };
        })
      );
      
      // Sort by date (oldest first)
      entries.sort((a, b) => a.cachedDate - b.cachedDate);
      
      // Delete oldest entries
      const toDelete = entries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.2));
      await Promise.all(
        toDelete.map(({ request }) => cache.delete(request))
      );
      
      console.log(`🗑️ SW: Deleted ${toDelete.length} old cache entries`);
    }
  } catch (error) {
    console.warn('⚠️ SW: Cache cleanup failed:', error);
  }
}

// Listen for messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_IMAGE_CACHE') {
    clearImageCache();
  }
});

async function clearImageCache() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    await Promise.all(requests.map(request => cache.delete(request)));
    console.log('🗑️ SW: Image cache cleared');
  } catch (error) {
    console.warn('⚠️ SW: Failed to clear image cache:', error);
  }
}