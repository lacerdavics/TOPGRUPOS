import { useEffect, useCallback } from 'react';

interface PreloadOptions {
  priority?: 'high' | 'medium' | 'low';
  batch?: number;
}

// Global preload queue and cache
const preloadQueue = new Set<string>();
const preloadedImages = new Set<string>();
let isPreloading = false;

export const useImagePreloader = () => {
  const preloadImage = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (preloadedImages.has(src)) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        preloadedImages.add(src);
        resolve();
      };
      img.onerror = () => {
        reject(new Error(`Failed to preload image: ${src}`));
      };
      img.src = src;
    });
  }, []);

  const preloadImages = useCallback(async (
    urls: string[], 
    options: PreloadOptions = {}
  ) => {
    const { batch = 3 } = options;
    
    // Filter out already preloaded images
    const urlsToPreload = urls.filter(url => !preloadedImages.has(url));
    
    if (urlsToPreload.length === 0) return;
    
    // Process in batches to avoid overwhelming the browser
    for (let i = 0; i < urlsToPreload.length; i += batch) {
      const batchUrls = urlsToPreload.slice(i, i + batch);
      
      try {
        await Promise.allSettled(
          batchUrls.map(url => preloadImage(url))
        );
        
        // Small delay between batches to prevent blocking
        if (i + batch < urlsToPreload.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.warn('Batch preload failed:', error);
      }
    }
  }, [preloadImage]);

  const preloadImagesInBackground = useCallback((urls: string[]) => {
    if (isPreloading) return;
    
    isPreloading = true;
    
    // Use requestIdleCallback for background preloading
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        preloadImages(urls, { batch: 2 }).finally(() => {
          isPreloading = false;
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        preloadImages(urls, { batch: 2 }).finally(() => {
          isPreloading = false;
        });
      }, 1000);
    }
  }, [preloadImages]);

  return {
    preloadImage,
    preloadImages,
    preloadImagesInBackground,
    isPreloaded: (url: string) => preloadedImages.has(url)
  };
};

// Hook for automatic preloading based on scroll position
export const useScrollPreloader = (
  images: string[], 
  threshold = 0.8
) => {
  const { preloadImagesInBackground } = useImagePreloader();

  useEffect(() => {
    let hasPreloaded = false;

    const handleScroll = () => {
      if (hasPreloaded) return;

      const scrollPercentage = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      
      if (scrollPercentage >= threshold) {
        preloadImagesInBackground(images);
        hasPreloaded = true;
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [images, threshold, preloadImagesInBackground]);
};