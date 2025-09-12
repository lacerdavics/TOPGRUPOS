// Image cache utilities for debugging and maintenance
import { enhancedImageCacheService } from '@/services/enhancedImageCacheService';

export const clearAllImageCache = () => {
  console.log('🗑️ Clearing all image caches...');
  
  // Clear enhanced image cache service
  enhancedImageCacheService.clearCache();
  
  // Clear service worker cache
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_IMAGE_CACHE' });
  }
  
  // Clear browser cache for images (attempt)
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        if (cacheName.includes('image') || cacheName.includes('topgrupos')) {
          caches.delete(cacheName);
          console.log('🗑️ Deleted cache:', cacheName);
        }
      });
    });
  }
  
  console.log('✅ Image cache clearing completed - Refresh the page to see changes');
};

export const getImageCacheStats = () => {
  return enhancedImageCacheService.getCacheStats();
};

// Add to window for manual debugging
if (typeof window !== 'undefined') {
  (window as any).clearImageCache = clearAllImageCache;
  (window as any).getImageCacheStats = getImageCacheStats;
  console.log('🛠️ Image cache utils available: window.clearImageCache(), window.getImageCacheStats()');
}