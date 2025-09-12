import { useState, useEffect, useCallback } from 'react';
import { enhancedImageCacheService } from '@/services/enhancedImageCacheService';
import { generateFallbackAvatar } from '@/utils/groupValidation';

interface UseOptimizedImageOptions {
  quality?: 'high' | 'medium' | 'low';
  fallbackName?: string;
  enableFallbacks?: boolean;
}

interface OptimizedImageState {
  currentSrc: string;
  isLoading: boolean;
  hasError: boolean;
  isOptimized: boolean;
}

export const useOptimizedImage = (
  originalUrl: string, 
  options: UseOptimizedImageOptions = {}
) => {
  const { quality = 'high', fallbackName, enableFallbacks = true } = options;
  
  const [state, setState] = useState<OptimizedImageState>({
    currentSrc: originalUrl,
    isLoading: false,
    hasError: false,
    isOptimized: false
  });

  // Generate fallback URLs
  const fallbackUrls = useCallback(() => {
    if (!enableFallbacks || !fallbackName) return [];
    
    return [
      generateFallbackAvatar(fallbackName),
      `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName.slice(0, 2))}&background=0ea5e9&color=ffffff&size=800&font-size=0.6&format=png&rounded=true&bold=true`,
      `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName.charAt(0))}&background=f97316&color=ffffff&size=800&font-size=0.7&format=png&rounded=true&bold=true`
    ];
  }, [fallbackName, enableFallbacks]);

  // Test if image loads successfully
  const testImageLoad = useCallback((url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      setTimeout(() => resolve(false), 5000);
    });
  }, []);

  // Load optimized image
  const loadOptimizedImage = useCallback(async (url: string) => {
    if (!url) {
      console.log('❌ Empty URL provided');
      return;
    }

    console.log('🔄 Loading image:', url);
    setState(prev => ({ ...prev, isLoading: true, hasError: false }));

    try {
      // Get optimized URL from cache service
      const optimizedUrl = await enhancedImageCacheService.getOptimizedImageUrl(url, quality);
      console.log('🎯 Got optimized URL:', optimizedUrl);
      
      // Test if the optimized URL loads
      const loadSuccess = await testImageLoad(optimizedUrl);
      console.log('📊 Load test result:', loadSuccess ? 'SUCCESS' : 'FAILED');
      
      if (loadSuccess) {
        console.log('✅ Image loaded successfully');
        setState({
          currentSrc: optimizedUrl,
          isLoading: false,
          hasError: false,
          isOptimized: optimizedUrl !== url
        });
        return;
      }

      // If optimized URL fails, try fallbacks
      if (enableFallbacks && fallbackName) {
        console.log('🔄 Trying fallbacks for:', fallbackName);
        const fallbacks = fallbackUrls();
        
        for (const fallbackUrl of fallbacks) {
          console.log('🧪 Testing fallback:', fallbackUrl);
          const fallbackSuccess = await testImageLoad(fallbackUrl);
          if (fallbackSuccess) {
            console.log('✅ Fallback worked:', fallbackUrl);
            setState({
              currentSrc: fallbackUrl,
              isLoading: false,
              hasError: false,
              isOptimized: false
            });
            return;
          }
        }
        console.log('❌ All fallbacks failed');
      }

      // All failed
      console.log('❌ All image loading attempts failed');
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true
      }));

    } catch (error) {
      console.error('❌ Image loading error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true
      }));
    }
  }, [quality, enableFallbacks, fallbackName, fallbackUrls, testImageLoad]);

  // Load image when URL changes
  useEffect(() => {
    if (originalUrl && originalUrl !== state.currentSrc) {
      loadOptimizedImage(originalUrl);
    }
  }, [originalUrl, loadOptimizedImage, state.currentSrc]);

  // Preload image (for background loading)
  const preloadImage = useCallback(async (url: string, preloadQuality: 'high' | 'medium' | 'low' = quality) => {
    if (!url) return;
    
    try {
      await enhancedImageCacheService.getOptimizedImageUrl(url, preloadQuality);
    } catch (error) {
      console.warn('Image preload failed:', error);
    }
  }, [quality]);

  return {
    src: state.currentSrc,
    isLoading: state.isLoading,
    hasError: state.hasError,
    isOptimized: state.isOptimized,
    preloadImage,
    retry: () => loadOptimizedImage(originalUrl)
  };
};