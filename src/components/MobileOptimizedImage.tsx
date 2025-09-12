import React, { useState, useCallback, useMemo } from 'react';
import { useLazyLoad, useMobileOptimization } from '@/hooks/useMobileOptimization';

interface MobileOptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const MobileOptimizedImage: React.FC<MobileOptimizedImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
  fallbackSrc,
  onLoad,
  onError
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { imageQuality, connectionSpeed, isMobile } = useMobileOptimization();
  const [setRef, isVisible] = useLazyLoad(priority ? '0px' : '200px');

  // Otimizar URL da imagem baseado na qualidade
  const optimizedSrc = useMemo(() => {
    if (!src) return fallbackSrc || '';
    
    // Se é uma URL do Telegram, não modificar
    if (src.includes('telegram.org') || src.includes('t.me')) {
      return src;
    }
    
    // Para outras URLs, tentar otimizar
    let optimized = src;
    
    // Adicionar parâmetros de otimização se suportado
    if (imageQuality === 'low') {
      optimized += (src.includes('?') ? '&' : '?') + 'w=300&q=60';
    } else if (imageQuality === 'medium' && isMobile) {
      optimized += (src.includes('?') ? '&' : '?') + 'w=600&q=75';
    }
    
    return optimized;
  }, [src, imageQuality, isMobile, fallbackSrc]);

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageError(true);
    onError?.();
  }, [onError]);

  // Não renderizar se não está visível e não é prioridade
  if (!priority && !isVisible) {
    return (
      <div 
        ref={setRef}
        className={`bg-muted animate-pulse ${className}`}
        style={{ aspectRatio: '1/1' }}
      />
    );
  }

  // Mostrar fallback se houver erro
  if (imageError && fallbackSrc) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={handleLoad}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    );
  }

  return (
    <img
      ref={setRef}
      src={optimizedSrc}
      alt={alt}
      className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      onLoad={handleLoad}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      // Adicionar dimensões para evitar layout shift
      style={{ aspectRatio: '1/1' }}
    />
  );
};

export default MobileOptimizedImage;