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
  groupId?: string; // Required for auto-update functionality
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
  const [autoUpdateInProgress, setAutoUpdateInProgress] = useState(false);
  const [hasTriggeredUpdate, setHasTriggeredUpdate] = useState(false);

  console.log('🔄 IntelligentGroupImage - Iniciando carregamento para:', groupName);
  console.log('📸 profileImage (fallbackImageUrl):', fallbackImageUrl);
  console.log('🔗 telegramUrl:', telegramUrl);
  console.log('🆔 groupId:', groupId);

  // Test if image loads successfully
  const testImageLoad = useCallback((url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      console.log('🧪 Testando carregamento da imagem:', url);
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

  // Main image loading logic with priority system
  const loadImage = useCallback(async () => {
    console.log('🚀 === INÍCIO DO FLUXO DE CARREGAMENTO DE IMAGEM ===');
    console.log('👤 Grupo:', groupName);
    console.log('🆔 GroupId:', groupId);
    console.log('📸 ProfileImage (Firestore):', fallbackImageUrl);
    console.log('🔗 TelegramUrl:', telegramUrl);
    
    setIsLoading(true);
    setHasError(false);

    // ETAPA 1: Tentar profileImage (Firestore / Firebase Storage)
    if (fallbackImageUrl && fallbackImageUrl.trim()) {
      console.log('🎯 ETAPA 1: Testando profileImage do Firestore:', fallbackImageUrl);
      
      const loadSuccess = await testImageLoad(fallbackImageUrl);
      if (loadSuccess) {
        console.log('✅ SUCESSO ETAPA 1: Usando profileImage do Firestore');
        setCurrentSrc(fallbackImageUrl);
        setIsLoading(false);
        setHasError(false);
        return;
      } else {
        console.log('❌ FALHA ETAPA 1: profileImage do Firestore não carregou (404/erro)');
      }
    } else {
      console.log('⚠️ ETAPA 1 PULADA: Sem profileImage no Firestore');
    }

    // ETAPA 2: Fallback para telegramUrl (via fetchTelegramImage)
    if (telegramUrl && telegramUrl.includes('t.me/')) {
      console.log('🔄 ETAPA 2: Tentando buscar imagem da API do Telegram');
      const telegramImage = await fetchTelegramImage(telegramUrl);
      
      if (telegramImage) {
        console.log('📥 ETAPA 2: Imagem obtida da API:', telegramImage);
        
        const loadSuccess = await testImageLoad(telegramImage);
        if (loadSuccess) {
          console.log('✅ SUCESSO ETAPA 2: Usando imagem da API do Telegram');
          setCurrentSrc(telegramImage);
          setIsLoading(false);
          setHasError(false);
          
          // ETAPA 3: Auto-update se necessário
          if (groupId && 
              telegramImage && 
              !hasTriggeredUpdate && 
              !autoUpdateInProgress &&
              !telegramImage.includes('ui-avatars.com') &&
              !telegramImage.startsWith('data:image/svg+xml') &&
              telegramImage !== fallbackImageUrl) {
            
            console.log('🚀 ETAPA 3: AUTO-UPDATE TRIGGERED');
            console.log('🔍 Validação para auto-update:');
            console.log('   - GroupId presente:', !!groupId);
            console.log('   - Imagem da API válida:', !!telegramImage);
            console.log('   - Não é avatar genérico:', !telegramImage.includes('ui-avatars.com'));
            console.log('   - Não é SVG:', !telegramImage.startsWith('data:image/svg+xml'));
            console.log('   - Diferente da atual:', telegramImage !== fallbackImageUrl);
            console.log('   - Update não foi tentado:', !hasTriggeredUpdate);
            console.log('   - Update não está em progresso:', !autoUpdateInProgress);
            
            console.log('🔄 Iniciando correção automática...');
            console.log('❌ Imagem com problema no Firestore:', fallbackImageUrl);
            console.log('✅ Nova imagem válida da API:', telegramImage);
            
            setAutoUpdateInProgress(true);
            setHasTriggeredUpdate(true);
            
            // Executar correção automática em background
            autoImageUpdateService.correctBrokenImage(
              groupId,
              telegramImage,
              fallbackImageUrl // URL antiga com problema para ser substituída
            ).then((result) => {
              if (result.success) {
                console.log('🎉 AUTO-UPDATE SUCCESS: Imagem corrigida e salva no Firebase Storage!');
                console.log('🆕 Nova URL WebP salva no Firestore:', result.newImageUrl);
                console.log('🗑️ URL antiga foi substituída');
                
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
                console.log('⚠️ AUTO-UPDATE FAILED:', result.error);
              }
            }).catch((error) => {
              console.error('❌ AUTO-UPDATE ERROR:', error);
            }).finally(() => {
              setAutoUpdateInProgress(false);
            });
          } else {
            console.log('⚠️ ETAPA 3 PULADA: Condições para auto-update não atendidas');
            if (!groupId) console.log('   - Motivo: GroupId não fornecido');
            if (!telegramImage) console.log('   - Motivo: Sem imagem da API');
            if (telegramImage?.includes('ui-avatars.com')) console.log('   - Motivo: É avatar genérico');
            if (telegramImage?.startsWith('data:image/svg+xml')) console.log('   - Motivo: É SVG genérico');
            if (telegramImage === fallbackImageUrl) console.log('   - Motivo: Mesma imagem que já temos');
            if (hasTriggeredUpdate) console.log('   - Motivo: Update já foi tentado');
            if (autoUpdateInProgress) console.log('   - Motivo: Update já está em progresso');
          }
          return;
        } else {
          console.log('❌ FALHA ETAPA 2: Imagem da API do Telegram não carregou');
        }
      } else {
        console.log('❌ ETAPA 2: API não retornou imagem válida');
      }
    } else {
      console.log('⚠️ ETAPA 2 PULADA: Sem telegramUrl válido');
    }

    // ETAPA 4: Fallback final - placeholder gerado
    console.log('🎨 ETAPA 4: Gerando placeholder final');
    const avatarFallback = generateFallbackAvatar(groupName, 800);
    console.log('🎨 Avatar fallback gerado:', avatarFallback);
    
    setCurrentSrc(avatarFallback);
    setIsLoading(false);
    setHasError(false); // Não é erro - temos um fallback válido
    
    console.log('🏁 === FIM DO FLUXO DE CARREGAMENTO ===');
  }, [fallbackImageUrl, telegramUrl, groupName, groupId, testImageLoad, fetchTelegramImage, hasTriggeredUpdate, autoUpdateInProgress]);

  // Initialize image loading
  useEffect(() => {
    loadImage();
  }, [loadImage]);

  // Listen for image update events from auto-correction
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
    if (telegramUrl && currentSrc !== '' && !hasTriggeredUpdate) {
      console.log('🔄 Tentando recarregar da API após erro');
      loadImage();
    }
  }, [currentSrc, telegramUrl, loadImage, hasTriggeredUpdate]);

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