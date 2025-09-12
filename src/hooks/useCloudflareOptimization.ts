import { useState, useEffect, useMemo } from 'react';
import { cloudflareService } from '@/services/cloudflareService';

interface CloudflareOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  enablePreloading?: boolean;
  enableResponsive?: boolean;
}

interface OptimizedImageData {
  optimizedUrl: string;
  isLoading: boolean;
  error: string | null;
  originalUrl: string;
  srcSet?: string;
  sizes?: string;
}

export const useCloudflareOptimization = (
  imageUrl: string | undefined,
  options: CloudflareOptimizationOptions = {}
): OptimizedImageData => {
  const [optimizedUrl, setOptimizedUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [srcSet, setSrcSet] = useState<string>('');
  const [sizes, setSizes] = useState<string>('');

  const {
    width = 400,
    height = 400,
    quality = 80,
    format = 'auto',
    fit = 'cover',
    enablePreloading = false,
    enableResponsive = false
  } = options;

  // Memoize optimization options to prevent unnecessary re-optimization
  const optimizationOptions = useMemo(() => ({
    width,
    height,
    quality,
    format,
    fit
  }), [width, height, quality, format, fit]);

  useEffect(() => {
    if (!imageUrl) {
      setOptimizedUrl('');
      setSrcSet('');
      setSizes('');
      return;
    }

    const optimizeImage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('🟠 Starting Cloudflare optimization for:', imageUrl);

        // Get optimized URL
        const optimized = await cloudflareService.optimizeImage(imageUrl, optimizationOptions);
        setOptimizedUrl(optimized);

        // Get responsive image set if enabled
        if (enableResponsive) {
          const responsiveData = await cloudflareService.getResponsiveImageSet(imageUrl);
          setSrcSet(responsiveData.srcSet);
          setSizes(responsiveData.sizes);
        }

        // Preload if enabled
        if (enablePreloading) {
          cloudflareService.preloadOptimizedImages([imageUrl], optimizationOptions);
        }

        console.log('✅ Cloudflare optimization completed:', optimized);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown optimization error';
        setError(errorMessage);
        setOptimizedUrl(imageUrl); // Fallback to original
        console.error('❌ Cloudflare optimization failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    optimizeImage();
  }, [imageUrl, optimizationOptions, enablePreloading, enableResponsive]);

  return {
    optimizedUrl: optimizedUrl || imageUrl || '',
    isLoading,
    error,
    originalUrl: imageUrl || '',
    srcSet: enableResponsive ? srcSet : undefined,
    sizes: enableResponsive ? sizes : undefined
  };
};

// Hook for batch optimization
export const useCloudflareImageBatch = (
  imageUrls: string[],
  options: CloudflareOptimizationOptions = {}
) => {
  const [optimizedUrls, setOptimizedUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const optimizationOptions = useMemo(() => ({
    width: options.width || 400,
    height: options.height || 400,
    quality: options.quality || 80,
    format: options.format || 'auto' as const,
    fit: options.fit || 'cover' as const
  }), [options.width, options.height, options.quality, options.format, options.fit]);

  useEffect(() => {
    if (!imageUrls.length) {
      setOptimizedUrls([]);
      return;
    }

    const optimizeBatch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`🟠 Starting batch Cloudflare optimization for ${imageUrls.length} images`);
        
        const optimized = await cloudflareService.optimizeImages(imageUrls, optimizationOptions);
        setOptimizedUrls(optimized);

        // Preload if enabled
        if (options.enablePreloading) {
          cloudflareService.preloadOptimizedImages(imageUrls, optimizationOptions);
        }

        console.log('✅ Batch Cloudflare optimization completed');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown batch optimization error';
        setError(errorMessage);
        setOptimizedUrls(imageUrls); // Fallback to originals
        console.error('❌ Batch Cloudflare optimization failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    optimizeBatch();
  }, [imageUrls, optimizationOptions, options.enablePreloading]);

  return {
    optimizedUrls,
    isLoading,
    error
  };
};

// Hook for Cloudflare service status
export const useCloudflareStatus = () => {
  const [status, setStatus] = useState(cloudflareService.getStatus());

  useEffect(() => {
    // Update status when component mounts
    setStatus(cloudflareService.getStatus());
  }, []);

  const configure = (config: any) => {
    cloudflareService.configure(config);
    setStatus(cloudflareService.getStatus());
  };

  return {
    ...status,
    configure
  };
};