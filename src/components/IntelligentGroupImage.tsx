import React, { useState, useCallback, useEffect } from 'react';
import { autoImageUpdateService } from '@/services/autoImageUpdateService';
import { generateFallbackAvatar } from '@/utils/groupValidation';

interface IntelligentGroupImageProps {
  telegramUrl?: string;
  fallbackImageUrl?: string;
  groupName: string;
  alt?: string;
  className?: string;
  priority?: boolean;
  groupId?: string; // Add groupId for auto-update functionality
}

export const IntelligentGroupImage: React.FC<IntelligentGroupImageProps> = ({
  telegramUrl,
  fallbackImageUrl,
  groupName,
  alt = 'Group image',
  className = '',
  priority = false,
  groupId
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);
  const [hasTriggeredUpdate, setHasTriggeredUpdate] = useState(false);
  const [autoUpdateInProgress, setAutoUpdateInProgress] = useState(false);

  // Test if image loads successfully
  const testImageLoad = useCallback((url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        console.log('✅ Imagem carregada com sucesso:', url);
        resolve(true);
      };
      img.onerror = () => {
        console.log('❌ Falha ao carregar imagem:', url);
        resolve(false);
      };
      img.src = url;
      
      // Timeout after 8 seconds
      setTimeout(() => {
        console.log('⏰ Timeout ao carregar imagem:', url);
        resolve(false);
      }, 8000);
    });
  }, []);

  // Fetch image from Telegram API
  const fetchTelegramImage = useCallback(async (telegramUrl: string): Promise<string | null> => {
    try {
      console.log('🔄 Buscando imagem via API do Telegram:', telegramUrl);
      
      const response = await fetch('https://api-puxar-dados-do-telegram.onrender.com/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: telegramUrl }),
        signal: AbortSignal.timeout(30000)
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

  // Load and validate image with priority system
  const loadImage = useCallback(async () => {
    console.log('🔄 Iniciando carregamento de imagem para:', groupName);
    console.log('📸 profileImage (fallbackImageUrl):', fallbackImageUrl);
    console.log('🔗 telegramUrl:', telegramUrl);
    console.log('🆔 groupId:', groupId);
    
    setIsLoading(true);
    setHasError(false);

    // Priority 1: SEMPRE usar profileImage do Firestore primeiro se disponível
    if (fallbackImageUrl && fallbackImageUrl.trim()) {
      console.log('🎯 Testando profileImage do Firestore:', fallbackImageUrl);
      
      // Testar se a imagem do Firestore carrega (prioridade máxima)
      const loadSuccess = await testImageLoad(fallbackImageUrl);
      if (loadSuccess) {
        console.log('✅ Usando profileImage do Firestore (carregamento bem-sucedido)');
        setCurrentSrc(fallbackImageUrl);
        setIsLoading(false);
        setHasError(false);
        return;
      } else {
        console.log('❌ profileImage do Firestore falhou ao carregar, tentando API como fallback');
      }
    }

    // Priority 2: Se profileImage falhou, tentar API do Telegram
    if (telegramUrl && telegramUrl.includes('t.me/')) {
      console.log('🔄 Tentando buscar imagem da API do Telegram como fallback');
      const telegramImage = await fetchTelegramImage(telegramUrl);
      
      if (telegramImage) {
        const loadSuccess = await testImageLoad(telegramImage);
        if (loadSuccess) {
          console.log('✅ Usando imagem da API do Telegram');
          setCurrentSrc(telegramImage);
          setIsLoading(false);
          setHasError(false);
          
          // AUTO-UPDATE: Implementar correção automática de imagens 404
          if (groupId && telegramImage && !hasTriggeredUpdate && !autoUpdateInProgress &&
              !telegramImage.includes('ui-avatars.com') &&
              !telegramImage.startsWith('data:image/svg+xml') &&
              telegramImage !== fallbackImageUrl) { // Só atualizar se API retornou imagem diferente
            
            console.log('🚀 AUTO-CORRECTION TRIGGERED: Imagem do Firestore falhou (404), iniciando correção automática...');
            console.log('🆔 GroupId:', groupId);
            console.log('❌ Imagem com 404 no Firestore:', fallbackImageUrl);
            console.log('✅ Imagem válida da API do Telegram:', telegramImage);
            console.log('🔄 Iniciando processo: Download → Conversão WebP → Upload → Atualizar Firestore');
            
            setAutoUpdateInProgress(true);
            setHasTriggeredUpdate(true);
            
            // Executar correção automática em background
            autoImageUpdateService.correctBrokenImage(
              groupId,
              telegramImage,
              fallbackImageUrl // URL antiga com 404 para ser substituída
            ).then((result) => {
              if (result.success) {
                console.log('🎉 AUTO-CORRECTION SUCCESS: Imagem corrigida e salva no Firebase Storage!');
                console.log('🆕 Nova URL WebP salva no Firestore:', result.newImageUrl);
                console.log('🗑️ URL antiga com 404 foi substituída');
                
                // Atualizar a imagem exibida para a nova URL do Firebase Storage
                if (result.newImageUrl) {
                  setCurrentSrc(result.newImageUrl);
                  
                  // Emitir evento para outros componentes saberem da atualização
                  window.dispatchEvent(new CustomEvent('groupImageCorrected', {
                    detail: { 
                      groupId, 
                      newImageUrl: result.newImageUrl,
                      oldImageUrl: fallbackImageUrl
                    }
                  }));
                }
              } else {
                console.log('⚠️ AUTO-CORRECTION FAILED:', result.error);
              }
            }).catch((error) => {
              console.error('❌ AUTO-CORRECTION ERROR:', error);
            }).finally(() => {
              setAutoUpdateInProgress(false);
            });
          } else if (telegramImage === fallbackImageUrl) {
            console.log('✅ API retornou a mesma imagem que já temos, não precisa atualizar');
          } else if (!groupId) {
            console.log('⚠️ GroupId não fornecido, não é possível fazer correção automática');
          } else if (hasTriggeredUpdate) {
            console.log('⚠️ Correção automática já foi tentada para este grupo');
          } else if (autoUpdateInProgress) {
            console.log('⚠️ Correção automática já está em progresso');
          }
          return;
        } else {
          console.log('❌ Imagem da API do Telegram falhou ao carregar');
        }
      }
    }

    // Priority 3: Se tudo falhou, usar placeholder vazio
    console.log('❌ Nenhuma imagem válida encontrada, usando placeholder vazio');
    setCurrentSrc('');
    setIsLoading(false);
    setHasError(true);
  }, [fallbackImageUrl, telegramUrl, groupName, groupId, testImageLoad, fetchTelegramImage, hasTriggeredUpdate]);

  // Load and validate image with priority system (OLD VERSION - REPLACED ABOVE)
  const loadImageOld = useCallback(async () => {
    console.log('🔄 Iniciando carregamento de imagem para:', groupName);
    console.log('📸 profileImage (fallbackImageUrl):', fallbackImageUrl);
    console.log('🔗 telegramUrl:', telegramUrl);
    console.log('🆔 groupId:', groupId);
    
    setIsLoading(true);
    setHasError(false);

    // Priority 1: Use profileImage from Firestore if available and valid (including telesco.pe)
    if (fallbackImageUrl && fallbackImageUrl.trim()) {
      console.log('🎯 Testando profileImage do Firestore:', fallbackImageUrl);
      
      // Check if it's a valid Firebase Storage URL, telesco.pe, or other valid image URL
      if (fallbackImageUrl.includes('firebasestorage.googleapis.com') ||
          fallbackImageUrl.includes('imgbb.com') ||
          fallbackImageUrl.includes('cdn.') ||
          fallbackImageUrl.includes('telesco.pe') ||
          fallbackImageUrl.includes('cdn1.telesco.pe') ||
          fallbackImageUrl.includes('cdn2.telesco.pe') ||
          fallbackImageUrl.includes('cdn3.telesco.pe') ||
          fallbackImageUrl.includes('cdn4.telesco.pe') ||
          (fallbackImageUrl.startsWith('http') && 
           !fallbackImageUrl.includes('ui-avatars.com'))) {
        
        console.log('✅ URL válida detectada, testando carregamento:', fallbackImageUrl);
        const loadSuccess = await testImageLoad(fallbackImageUrl);
        if (loadSuccess) {
          console.log('✅ Usando profileImage do Firestore (carregamento bem-sucedido)');
          setCurrentSrc(fallbackImageUrl);
          setIsLoading(false);
          setHasError(false);
          return;
        } else {
          console.log('❌ profileImage do Firestore falhou ao carregar, tentando API como fallback');
        }
      } else {
        console.log('❌ profileImage não é uma URL válida:', fallbackImageUrl);
      }
    }

    // Priority 2: Try to get image from Telegram API if we have the URL
    if (telegramUrl && telegramUrl.includes('t.me/')) {
      console.log('🔄 Tentando buscar imagem da API do Telegram');
      const telegramImage = await fetchTelegramImage(telegramUrl);
      
      if (telegramImage) {
        const loadSuccess = await testImageLoad(telegramImage);
        if (loadSuccess) {
          console.log('✅ Usando imagem da API do Telegram');
          setCurrentSrc(telegramImage);
          setIsLoading(false);
          setHasError(false);
          
          // AUTO-UPDATE: Only trigger if we got a DIFFERENT image from API that's better than current
          if (groupId && telegramImage && !hasTriggeredUpdate &&
              !telegramImage.includes('ui-avatars.com') &&
              !telegramImage.startsWith('data:image/svg+xml') &&
              telegramImage !== fallbackImageUrl) { // Only update if API returned different image
            
            console.log('🚀 TRIGGER AUTO-UPDATE: API retornou imagem diferente, iniciando atualização automática...');
            console.log('🆔 GroupId:', groupId);
            console.log('📸 Current profileImage:', fallbackImageUrl);
            console.log('🆕 New image from API:', telegramImage);
            console.log('🔍 Images are different:', telegramImage !== fallbackImageUrl);
            
            setIsUpdatingImage(true);
            setHasTriggeredUpdate(true);
            
            // Update in background with proper error handling
            autoImageUpdateService.updateGroupImageFromFallback(
              groupId,
              telegramImage,
              fallbackImageUrl
            ).then((result) => {
              if (result.success) {
                console.log('🎉 AUTO-UPDATE SUCCESS: Imagem atualizada com sucesso!');
                console.log('🆕 Nova URL salva no Firestore:', result.newImageUrl);
                
                // Update current src to the new Firebase URL
                if (result.newImageUrl) {
                  setCurrentSrc(result.newImageUrl);
                }
              } else {
                console.log('⚠️ AUTO-UPDATE FAILED:', result.error);
              }
            }).catch((error) => {
              console.error('❌ AUTO-UPDATE ERROR:', error);
            }).finally(() => {
              setIsUpdatingImage(false);
            });
          } else if (telegramImage === fallbackImageUrl) {
            console.log('✅ API retornou a mesma imagem que já temos, não precisa atualizar');
          }
          return;
        } else {
          console.log('❌ Imagem da API do Telegram falhou ao carregar');
        }
      }
    }

    // Priority 3: No image found - show empty placeholder
    console.log('❌ Nenhuma imagem válida encontrada, gerando avatar fallback');
    
    // Generate a proper avatar fallback using the group name
    const avatarFallback = generateFallbackAvatar(groupName, 800);
    console.log('🎨 Avatar fallback gerado:', avatarFallback);
    
    setCurrentSrc(avatarFallback);
    setIsLoading(false);
    setHasError(false); // Not an error - we have a valid fallback
  }, [fallbackImageUrl, telegramUrl, groupName, groupId, testImageLoad, fetchTelegramImage, hasTriggeredUpdate]);

  // Initialize image loading
  useEffect(() => {
    loadImage();
  }, [loadImage]);

  // Listen for image update events
  useEffect(() => {
    const handleImageCorrection = (event: CustomEvent) => {
      if (event.detail.groupId === groupId && event.detail.newImageUrl) {
        console.log('🔄 Imagem corrigida via evento, atualizando display:', event.detail.newImageUrl);
        setCurrentSrc(event.detail.newImageUrl);
        setIsLoading(false);
        setHasError(false);
        setAutoUpdateInProgress(false);
      }
    };

    window.addEventListener('groupImageCorrected', handleImageCorrection as EventListener);
    return () => {
      window.removeEventListener('groupImageCorrected', handleImageCorrection as EventListener);
    };
  }, [groupId]);
  const handleLoad = useCallback(() => {
    console.log('✅ Evento onLoad disparado para:', currentSrc);
    setIsLoading(false);
    setHasError(false);
  }, [currentSrc]);

  const handleError = useCallback(() => {
    console.log('❌ Evento onError disparado para:', currentSrc);
    setHasError(true);
    setIsLoading(false);
    
    // If current image fails, try to reload from API
    if (telegramUrl && currentSrc !== '') {
      console.log('🔄 Tentando recarregar da API após erro');
      loadImage();
    }
  }, [currentSrc, telegramUrl, loadImage]);

  // Show loading state
  if (isLoading || autoUpdateInProgress) {
    return (
      <div 
        className={`bg-muted animate-pulse flex items-center justify-center ${className}`}
      >
        <div className="text-muted-foreground text-sm">
          {autoUpdateInProgress ? 'Corrigindo imagem...' : 'Carregando...'}
        </div>
      </div>
    );
  }

  // Show empty placeholder if no image found
  if (hasError || !currentSrc) {
    return (
      <div 
        className={`bg-gradient-to-br from-muted/50 to-muted/80 flex items-center justify-center ${className}`}
      >
        <div className="text-muted-foreground/60 text-2xl font-bold">📷</div>
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt || `Imagem do grupo ${groupName}`}
      className={className}
      onLoad={handleLoad}
      onError={handleError}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
    />
  );
};

export default IntelligentGroupImage;