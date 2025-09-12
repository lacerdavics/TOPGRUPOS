import { useState, useEffect } from 'react';
import { telegramOpenGraphService } from '@/services/telegramOpenGraphService';
import { imageProxyService } from '@/services/imageProxyService';

interface UseIntelligentGroupImageProps {
  telegramUrl: string;
  fallbackImageUrl?: string;
  groupName: string;
  enabled?: boolean;
}

interface UseIntelligentGroupImageReturn {
  imageUrl: string | null;
  isLoading: boolean;
  error: boolean;
  source: 'telegram' | 'storage' | 'generated' | null;
}

export const useIntelligentGroupImage = ({
  telegramUrl,
  fallbackImageUrl,
  groupName,
  enabled = true
}: UseIntelligentGroupImageProps): UseIntelligentGroupImageReturn => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [source, setSource] = useState<'telegram' | 'storage' | 'generated' | null>(null);

  useEffect(() => {
    if (!enabled || !telegramUrl) return;

    const loadImage = async () => {
      setIsLoading(true);
      setError(false);
      setSource(null);

      try {
        // Validate image URL helper
        const validateImageUrl = (url: string): Promise<boolean> => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
            setTimeout(() => resolve(false), 8000);
          });
        };

        // Step 1: Try Telegram OpenGraph image
        console.log('🔍 Fetching Telegram OpenGraph image for:', telegramUrl);
        const telegramImage = await telegramOpenGraphService.getTelegramGroupImage(telegramUrl);
        
        if (telegramImage) {
          console.log('📸 Found Telegram image:', telegramImage);
          const optimizedTelegramImage = await imageProxyService.getOptimizedImageUrl(telegramImage);
          
          if (await validateImageUrl(optimizedTelegramImage)) {
            console.log('✅ Using Telegram OpenGraph image');
            setImageUrl(optimizedTelegramImage);
            setSource('telegram');
            setIsLoading(false);
            return;
          }
        }

        // Step 2: Try storage fallback image
        if (fallbackImageUrl) {
          console.log('🔄 Trying storage fallback image:', fallbackImageUrl);
          const optimizedFallbackImage = await imageProxyService.getOptimizedImageUrl(fallbackImageUrl);
          
          if (await validateImageUrl(optimizedFallbackImage)) {
            console.log('✅ Using storage fallback image');
            setImageUrl(optimizedFallbackImage);
            setSource('storage');
            setIsLoading(false);
            return;
          }
        }

        // Step 3: Generate UI avatar
        console.log('🎨 Generating UI avatar for:', groupName);
        const generatedImage = telegramOpenGraphService.generateFallbackImageUrl(groupName);
        setImageUrl(generatedImage);
        setSource('generated');

      } catch (err) {
        console.error('❌ Error loading intelligent group image:', err);
        setError(true);
        
        // Final fallback
        const generatedImage = telegramOpenGraphService.generateFallbackImageUrl(groupName);
        setImageUrl(generatedImage);
        setSource('generated');
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [telegramUrl, fallbackImageUrl, groupName, enabled]);

  return {
    imageUrl,
    isLoading,
    error,
    source
  };
};