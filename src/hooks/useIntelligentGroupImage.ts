import { useState, useEffect, useCallback } from 'react';

interface UseIntelligentGroupImageProps {
  src?: string;
  fallbackSrc?: string;
  alt?: string;
}

interface UseIntelligentGroupImageReturn {
  imageSrc: string;
  isLoading: boolean;
  hasError: boolean;
  retry: () => void;
}

export const useIntelligentGroupImage = ({
  src,
  fallbackSrc = '/placeholder-group.png',
  alt = 'Group image'
}: UseIntelligentGroupImageProps): UseIntelligentGroupImageReturn => {
  const [imageSrc, setImageSrc] = useState<string>(fallbackSrc);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const loadImage = useCallback(() => {
    if (!src) {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      setHasError(false);
    };

    img.onerror = () => {
      setImageSrc(fallbackSrc);
      setIsLoading(false);
      setHasError(true);
    };

    img.src = src;
  }, [src, fallbackSrc]);

  const retry = useCallback(() => {
    loadImage();
  }, [loadImage]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  return {
    imageSrc,
    isLoading,
    hasError,
    retry
  };
};