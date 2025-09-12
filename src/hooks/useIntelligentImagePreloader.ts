import { useEffect, useCallback, useRef } from 'react';
import { enhancedImageCacheService } from '@/services/enhancedImageCacheService';

interface UseIntelligentImagePreloaderOptions {
  images: string[];
  enabled?: boolean;
  quality?: 'high' | 'medium' | 'low';
  delay?: number; // Delay before starting preload (ms)
  batchSize?: number;
}

export const useIntelligentImagePreloader = ({
  images,
  enabled = true,
  quality = 'medium',
  delay = 1000,
  batchSize = 3
}: UseIntelligentImagePreloaderOptions) => {
  const preloadedRef = useRef<Set<string>>(new Set());
  const timeoutRef = useRef<NodeJS.Timeout>();

  const preloadImages = useCallback(async () => {
    if (!enabled || images.length === 0) return;

    // Filter out already preloaded images
    const imagesToPreload = images.filter(img => 
      img && !preloadedRef.current.has(img)
    );

    if (imagesToPreload.length === 0) return;

    console.log(`🚀 Starting intelligent preload of ${imagesToPreload.length} images`);

    try {
      await enhancedImageCacheService.preloadImages(imagesToPreload, quality);
      
      // Mark images as preloaded
      imagesToPreload.forEach(img => preloadedRef.current.add(img));
      
      console.log(`✅ Intelligent preload completed for ${imagesToPreload.length} images`);
    } catch (error) {
      console.warn('⚠️ Intelligent preload failed:', error);
    }
  }, [images, enabled, quality]);

  // Start preloading with delay and respect user's network conditions
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Check network conditions
    const connection = (navigator as any).connection;
    let adaptedDelay = delay;
    let adaptedQuality = quality;

    if (connection) {
      // Adapt based on connection type
      if (connection.effectiveType === '2g' || connection.saveData) {
        adaptedDelay = delay * 3; // Longer delay for slow connections
        adaptedQuality = 'low';
      } else if (connection.effectiveType === '3g') {
        adaptedDelay = delay * 1.5;
        adaptedQuality = 'medium';
      }
    }

    // Start preloading after delay
    timeoutRef.current = setTimeout(() => {
      // Only preload if page is visible and user is not actively scrolling
      if (document.visibilityState === 'visible') {
        preloadImages();
      }
    }, adaptedDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [images, enabled, delay, quality, preloadImages]);

  // Pause preloading when page is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    preloadedCount: preloadedRef.current.size,
    totalImages: images.length,
    preloadProgress: images.length > 0 ? (preloadedRef.current.size / images.length) * 100 : 0
  };
};

// Hook specifically for homepage image preloading
export const useHomepageImagePreloader = (
  popularGroups: Array<{ imageUrl?: string; profileImage?: string }>,
  categoryImages: string[] = []
) => {
  // Extract all image URLs
  const allImages = [
    ...popularGroups.map(group => group.imageUrl || group.profileImage).filter(Boolean) as string[],
    ...categoryImages
  ];

  return useIntelligentImagePreloader({
    images: allImages,
    enabled: true,
    quality: 'high', // High quality for homepage
    delay: 2000, // Start after 2 seconds
    batchSize: 4
  });
};