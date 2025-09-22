/**
 * ⚠️ AVISO: Para imagens de grupos use IntelligentGroupImage.tsx
 * Este componente está reservado para outros tipos de imagens (banners, avatars de usuário, etc.)
 * 
 * Para grupos do Telegram, sempre use:
 * import IntelligentGroupImage from '@/components/IntelligentGroupImage';
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useLazyLoad, useMobileOptimization } from '@/hooks/useMobileOptimization';

interface MobileOptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  fallbackSrc?: string;
  telegramUrl?: string;
  groupName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const MobileOptimizedImage: React.FC<MobileOptimizedImageProps> = ({
  src,
  alt,
  className = '',
  priority = false,
  fallbackSrc,
  telegramUrl,
  groupName,
  onLoad,
  onError
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [finalSrc, setFinalSrc] = useState(src);
  const { imageQuality, connectionSpeed, isMobile } = useMobileOptimization();
  const [setRef, isVisible] = useLazyLoad(priority ? '0px' : '200px');

  // Fetch image from Telegram API if needed
  const fetchTelegramImage = useCallback(async (telegramUrl: string): Promise<string | null> => {
    try {
      console.log('🔄 Buscando imagem via API do Telegram:', telegramUrl);
      
      const response = await fetch('https://api-puxar-dados-do-telegram.onrender.com/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: telegramUrl }),
        signal: AbortSignal.timeout(15000)
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.open_graph?.image) {
        console.log('✅ Imagem obtida da API do Telegram:', data.open_graph.image);
        return data.open_graph.image;
      } else {
        console.log('❌ API não retornou imagem válida');
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar imagem da API:', error);
      return null;
    }
  }, []);

  // Load image with fallback logic
  useEffect(() => {
    const loadImageWithFallback = async () => {
      // If we have a valid src, use it
      if (src && src.trim() && !src.includes('ui-avatars.com')) {
        console.log('✅ Usando src fornecido:', src);
        setFinalSrc(src);
        return;
      }

      // If no valid src but we have telegramUrl, try API
      if (telegramUrl && telegramUrl.includes('t.me/')) {
        console.log('🔄 Tentando buscar imagem da API do Telegram');
        const telegramImage = await fetchTelegramImage(telegramUrl);
        
        if (telegramImage) {
          console.log('✅ Usando imagem da API do Telegram');
          setFinalSrc(telegramImage);
          return;
        }
      }

      // If we have fallbackSrc, use it
      if (fallbackSrc && fallbackSrc.trim()) {
        console.log('✅ Usando fallbackSrc:', fallbackSrc);
        setFinalSrc(fallbackSrc);
        return;
      }

      // No valid image found - set empty to show placeholder
      console.log('❌ Nenhuma imagem válida encontrada');
      setFinalSrc('');
    };

    loadImageWithFallback();
  }, [src, telegramUrl, fallbackSrc, fetchTelegramImage]);

  // Otimizar URL da imagem baseado na qualidade
  const optimizedSrc = useMemo(() => {
    if (!finalSrc) return '';
    
    // Se é uma URL do Telegram, não modificar
    if (finalSrc.includes('telegram.org') || finalSrc.includes('t.me')) {
      return finalSrc;
    }
    
    // Para outras URLs, tentar otimizar
    let optimized = finalSrc;
    
    // Adicionar parâmetros de otimização se suportado
    if (imageQuality === 'low') {
      optimized += (finalSrc.includes('?') ? '&' : '?') + 'w=300&q=60';
    } else if (imageQuality === 'medium' && isMobile) {
      optimized += (finalSrc.includes('?') ? '&' : '?') + 'w=600&q=75';
    }
    
    return optimized;
  }, [finalSrc, imageQuality, isMobile]);

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

  // Show empty placeholder if no image or error
  if (imageError || !optimizedSrc) {
    return (
      <div 
        ref={setRef}
        className={`bg-gradient-to-br from-muted/50 to-muted/80 flex items-center justify-center ${className}`}
      >
        <div className="text-muted-foreground/60 text-2xl font-bold">📷</div>
      </div>
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