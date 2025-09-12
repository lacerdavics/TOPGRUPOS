import { useState, useEffect, useRef } from 'react';
import { enhanceImageQuality, loadImageFromUrl, createPlaceholder } from '@/services/aiImageEnhancementService';

interface UseAIImageEnhancementOptions {
  enabled?: boolean;
  maxDimension?: number;
  quality?: number;
  placeholder?: boolean;
}

export const useAIImageEnhancement = (
  originalSrc: string | undefined,
  options: UseAIImageEnhancementOptions = {}
) => {
  const {
    enabled = true,
    maxDimension = 600,
    quality = 0.95,
    placeholder = true
  } = options;

  const [enhancedSrc, setEnhancedSrc] = useState<string | undefined>(undefined);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!originalSrc || !enabled) {
      setEnhancedSrc(originalSrc);
      return;
    }

    const enhanceImage = async () => {
      // Abort previous enhancement
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      
      try {
        setIsEnhancing(true);
        setError(null);
        setProgress(0);

        // Immediately show placeholder if enabled
        if (placeholder) {
          const placeholderSrc = createPlaceholder(originalSrc, maxDimension, maxDimension);
          setEnhancedSrc(placeholderSrc);
        }

        setProgress(25);

        // Load original image
        const img = await loadImageFromUrl(originalSrc);
        
        if (abortControllerRef.current?.signal.aborted) return;
        
        setProgress(50);

        // Enhance the image
        const enhanced = await enhanceImageQuality(img, {
          maxDimension,
          quality,
          useWebGPU: true
        });

        if (abortControllerRef.current?.signal.aborted) return;

        setProgress(100);
        setEnhancedSrc(enhanced);

        console.log(`✨ Image enhanced: ${originalSrc.substring(0, 50)}...`);

      } catch (err: any) {
        if (err.name === 'AbortError') return;
        
        console.warn('⚠️ Image enhancement failed:', err);
        setError(err.message || 'Enhancement failed');
        
        // Fallback to original
        setEnhancedSrc(originalSrc);
      } finally {
        setIsEnhancing(false);
      }
    };

    enhanceImage();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [originalSrc, enabled, maxDimension, quality, placeholder]);

  return {
    enhancedSrc: enhancedSrc || originalSrc,
    isEnhancing,
    error,
    progress,
    hasEnhancement: enhancedSrc !== originalSrc
  };
};

// Hook specifically for group card images
export const useGroupImageEnhancement = (imageUrl?: string) => {
  return useAIImageEnhancement(imageUrl, {
    enabled: true,
    maxDimension: 500,
    quality: 0.92,
    placeholder: true
  });
};

// Hook for hero/featured images
export const useHeroImageEnhancement = (imageUrl?: string) => {
  return useAIImageEnhancement(imageUrl, {
    enabled: true,
    maxDimension: 800,
    quality: 0.95,
    placeholder: true
  });
};