import React, { useState, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { telegramOpenGraphService } from '@/services/telegramOpenGraphService';
import { imageProxyService } from '@/services/imageProxyService';

interface IntelligentGroupImageProps {
  telegramUrl: string;
  fallbackImageUrl?: string;
  groupName: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

const IntelligentGroupImage: React.FC<IntelligentGroupImageProps> = ({ 
  telegramUrl,
  fallbackImageUrl,
  groupName,
  alt,
  className = "",
  priority = false
}) => {
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '100px',
    skip: priority,
  });

  const placeholderLetter = useMemo(() => {
    return groupName ? groupName.charAt(0).toUpperCase() : '?';
  }, [groupName]);

  const shouldLoad = priority || inView;

  // Function to try loading an image URL and validate it works
  const validateImageUrl = async (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      setTimeout(() => resolve(false), 8000); // 8 second timeout
    });
  };

  // Main image loading logic
  useEffect(() => {
    if (!shouldLoad) return;

    const loadImage = async () => {
      setIsLoading(true);
      setImageError(false);

      try {
        // Step 1: Try to get OpenGraph image from Telegram
        console.log('🔍 Attempting to fetch Telegram OpenGraph image...');
        const telegramImage = await telegramOpenGraphService.getTelegramGroupImage(telegramUrl);
        
        if (telegramImage) {
          console.log('📸 Found Telegram OpenGraph image:', telegramImage);
          
          // Optimize the Telegram image through proxy if needed
          const optimizedTelegramImage = await imageProxyService.getOptimizedImageUrl(telegramImage);
          
          // Validate the optimized image works
          const telegramImageValid = await validateImageUrl(optimizedTelegramImage);
          
          if (telegramImageValid) {
            console.log('✅ Using Telegram OpenGraph image');
            setCurrentImageUrl(optimizedTelegramImage);
            setIsLoading(false);
            return;
          }
        }

        // Step 2: Try fallback image from Google Storage if provided
        if (fallbackImageUrl) {
          console.log('🔄 Trying fallback image from storage...');
          const optimizedFallbackImage = await imageProxyService.getOptimizedImageUrl(fallbackImageUrl);
          
          const fallbackImageValid = await validateImageUrl(optimizedFallbackImage);
          
          if (fallbackImageValid) {
            console.log('✅ Using fallback storage image');
            setCurrentImageUrl(optimizedFallbackImage);
            setIsLoading(false);
            return;
          }
        }

        // Step 3: Generate UI avatar as final fallback
        console.log('🎨 Generating UI avatar fallback...');
        const uiAvatarUrl = telegramOpenGraphService.generateFallbackImageUrl(groupName);
        setCurrentImageUrl(uiAvatarUrl);

      } catch (error) {
        console.error('❌ Error in intelligent image loading:', error);
        
        // Final fallback - generate UI avatar
        const uiAvatarUrl = telegramOpenGraphService.generateFallbackImageUrl(groupName);
        setCurrentImageUrl(uiAvatarUrl);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [shouldLoad, telegramUrl, fallbackImageUrl, groupName]);

  const handleImageError = () => {
    console.warn('🚨 Image failed to load, showing placeholder');
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  return (
    <div ref={priority ? undefined : ref} className={`relative overflow-hidden ${className}`}>
      {!shouldLoad || isLoading ? (
        // Loading placeholder
        <div className="w-full h-full bg-gradient-to-br from-muted/30 to-muted/50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl font-bold text-muted-foreground/40">
              {placeholderLetter}
            </span>
            {isLoading && (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-60"></div>
            )}
          </div>
        </div>
      ) : imageError || !currentImageUrl ? (
        // Error placeholder
        <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted/80 flex items-center justify-center">
          <span className="text-4xl font-bold text-muted-foreground/60">
            {placeholderLetter}
          </span>
        </div>
      ) : (
        // Actual image
        <img
          src={currentImageUrl}
          alt={alt}
          className="w-full h-full object-cover antialiased group-image transition-opacity duration-300"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={handleImageError}
          onLoad={handleImageLoad}
          style={{
            aspectRatio: '1/1',
            objectFit: 'cover'
          }}
        />
      )}
    </div>
  );
};

export default IntelligentGroupImage;