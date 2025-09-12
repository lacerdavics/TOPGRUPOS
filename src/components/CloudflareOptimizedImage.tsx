import React, { useState } from 'react';
import { useCloudflareOptimization } from '@/hooks/useCloudflareOptimization';
import LazyImage from './LazyImage';

interface CloudflareOptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  className?: string;
  enableResponsive?: boolean;
  enablePreloading?: boolean;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
}

export const CloudflareOptimizedImage: React.FC<CloudflareOptimizedImageProps> = ({
  src,
  alt,
  width = 400,
  height = 400,
  quality = 80,
  format = 'auto',
  fit = 'cover',
  className = '',
  enableResponsive = false,
  enablePreloading = false,
  fallbackSrc,
  onLoad,
  onError,
  loading = 'lazy'
}) => {
  const [hasError, setHasError] = useState(false);
  
  const { 
    optimizedUrl, 
    isLoading, 
    error,
    srcSet,
    sizes 
  } = useCloudflareOptimization(src, {
    width,
    height,
    quality,
    format,
    fit,
    enablePreloading,
    enableResponsive
  });

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const handleLoad = () => {
    setHasError(false);
    onLoad?.();
  };

  // Determine which source to use
  const imageSrc = hasError 
    ? (fallbackSrc || '/placeholder.svg')
    : (optimizedUrl || src);

  // Show loading placeholder while optimizing
  if (isLoading && !optimizedUrl) {
    return (
      <div 
        className={`bg-muted animate-pulse rounded-md ${className}`}
        style={{ width, height }}
        aria-label="Loading optimized image..."
      />
    );
  }

  return (
    <div className={className}>
      <img
        src={imageSrc}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        srcSet={enableResponsive ? srcSet : undefined}
        sizes={enableResponsive ? sizes : undefined}
        style={{
          maxWidth: '100%',
          height: 'auto',
          ...(width && height ? { aspectRatio: `${width}/${height}` } : {})
        }}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

// Higher-order component for easy integration
export const withCloudflareOptimization = <P extends object>(
  Component: React.ComponentType<P & { src: string }>
) => {
  return React.forwardRef<any, P & { 
    src: string; 
    cloudflareOptions?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
      fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
    }
  }>((props, ref) => {
    const { src, cloudflareOptions, ...rest } = props;
    
    const { optimizedUrl } = useCloudflareOptimization(src, {
      width: 400,
      height: 400,
      quality: 80,
      format: 'auto',
      fit: 'cover',
      ...cloudflareOptions
    });

    return (
      <Component
        {...(rest as P)}
        ref={ref}
        src={optimizedUrl || src}
      />
    );
  });
};