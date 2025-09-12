// Service Worker manager for image caching
class ServiceWorkerManager {
  private isRegistered = false;
  
  async registerImageCacheWorker() {
    if ('serviceWorker' in navigator && !this.isRegistered) {
      try {
        const registration = await navigator.serviceWorker.register('/sw-image-cache.js', {
          scope: '/'
        });
        
        this.isRegistered = true;
        console.log('✅ Service Worker registered for image caching');
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New Service Worker installed, refreshing cache...');
                this.clearImageCache();
              }
            });
          }
        });
        
        return registration;
      } catch (error) {
        console.warn('⚠️ Service Worker registration failed:', error);
      }
    }
  }
  
  async clearImageCache() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_IMAGE_CACHE'
      });
      console.log('🗑️ Requested Service Worker to clear image cache');
    }
  }
  
  async getCacheStatus() {
    if ('caches' in window) {
      try {
        const cache = await caches.open('topgrupos-images-v2');
        const requests = await cache.keys();
        return {
          isSupported: true,
          cachedImages: requests.length,
          estimatedSize: requests.length * 50 // Rough estimate in KB
        };
      } catch (error) {
        return {
          isSupported: false,
          cachedImages: 0,
          estimatedSize: 0
        };
      }
    }
    
    return {
      isSupported: false,
      cachedImages: 0,
      estimatedSize: 0
    };
  }
}

export const serviceWorkerManager = new ServiceWorkerManager();