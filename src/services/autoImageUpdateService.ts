import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { webpConversionService } from './webpConversionService';

interface ImageUpdateResult {
  success: boolean;
  newImageUrl?: string;
  error?: string;
}

class AutoImageUpdateService {
  private processingQueue = new Set<string>();
  private readonly MAX_CONCURRENT_UPDATES = 3;
  private currentUpdates = 0;

  /**
   * Correct broken image by downloading from Telegram API, converting to WebP and updating Firestore
   */
  async correctBrokenImage(
    groupId: string,
    telegramImageUrl: string,
    brokenFirebaseUrl?: string
  ): Promise<ImageUpdateResult> {
    // Avoid duplicate processing
    if (this.processingQueue.has(groupId)) {
      console.log('⏳ Correção já está sendo processada para o grupo:', groupId);
      return { success: false, error: 'Already processing' };
    }

    // Limit concurrent updates to avoid overwhelming the system
    if (this.currentUpdates >= this.MAX_CONCURRENT_UPDATES) {
      console.log('⏸️ Limite de correções simultâneas atingido, aguardando...');
      return { success: false, error: 'Rate limited' };
    }

    // Only process valid external image URLs (not generated avatars)
    if (!telegramImageUrl || 
        telegramImageUrl.includes('ui-avatars.com') ||
        telegramImageUrl.startsWith('data:image/svg+xml')) {
      console.log('❌ URL da imagem do Telegram não é válida para correção:', telegramImageUrl);
      return { success: false, error: 'Invalid Telegram image URL' };
    }

    this.processingQueue.add(groupId);
    this.currentUpdates++;

    try {
      console.log('🚀 INICIANDO CORREÇÃO AUTOMÁTICA DE IMAGEM 404');
      console.log('🆔 GroupId:', groupId);
      console.log('❌ URL com 404 no Firebase Storage:', brokenFirebaseUrl);
      console.log('✅ URL válida da API do Telegram:', telegramImageUrl);
      console.log('🔄 Processo: Download → Conversão WebP → Upload → Atualizar Firestore');

      // Import webpConversionService
      const { webpConversionService } = await import('./webpConversionService');
      
      console.log('📥 Iniciando download e conversão da imagem do Telegram...');
      
      // Download, convert and upload the Telegram image
      const conversionResult = await webpConversionService.convertAndUploadToWebP(
        telegramImageUrl,
        groupId,
        brokenFirebaseUrl // Pass broken URL for deletion (if it exists)
      );

      if (!conversionResult.success || !conversionResult.webpUrl) {
        throw new Error(conversionResult.error || 'Failed to convert and upload image');
      }

      console.log('✅ Imagem convertida e salva no Firebase Storage:', conversionResult.webpUrl);
      console.log('🗑️ URL antiga com 404 foi processada para exclusão');

      // Update the group document in Firestore with new image URL
      console.log('💾 Atualizando profileImage no Firestore...');
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        profileImage: conversionResult.webpUrl,
        imageUpdatedAt: new Date(),
        imageCorrectedAt: new Date(),
        autoUpdated: true
      });

      console.log('✅ ProfileImage atualizado no Firestore com nova URL WebP');
      console.log('🎯 CORREÇÃO COMPLETA: Próximo carregamento usará a imagem do Firebase Storage');

      return {
        success: true,
        newImageUrl: conversionResult.webpUrl
      };

    } catch (error) {
      console.error('❌ ERRO NA CORREÇÃO AUTOMÁTICA DE IMAGEM:', error);
      console.error('❌ Detalhes do erro:', {
        groupId,
        telegramImageUrl,
        brokenFirebaseUrl,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.processingQueue.delete(groupId);
      this.currentUpdates--;
    }
  }

  /**
   * Automatically update group's profileImage when fallback is detected
   */
  async updateGroupImageFromFallback(
    groupId: string,
    fallbackImageUrl: string,
    currentProfileImage?: string
  ): Promise<ImageUpdateResult> {
    // Avoid duplicate processing
    if (this.processingQueue.has(groupId)) {
      console.log('⏳ Grupo já está sendo processado:', groupId);
      return { success: false, error: 'Already processing' };
    }

    // Limit concurrent updates to avoid overwhelming the system
    if (this.currentUpdates >= this.MAX_CONCURRENT_UPDATES) {
      console.log('⏸️ Limite de atualizações simultâneas atingido, aguardando...');
      return { success: false, error: 'Rate limited' };
    }

    // Only process valid external image URLs (not generated avatars)
    if (!fallbackImageUrl || 
        fallbackImageUrl.includes('ui-avatars.com') ||
        fallbackImageUrl.startsWith('data:image/svg+xml')) {
      console.log('❌ URL de fallback não é válida para download:', fallbackImageUrl);
      return { success: false, error: 'Invalid fallback URL' };
    }

    // Use the robust shouldUpdateImage function to determine if update is needed
    const shouldUpdate = await this.shouldUpdateImage(currentProfileImage, fallbackImageUrl);
    if (!shouldUpdate) {
      console.log('❌ Não deve atualizar imagem baseado na validação robusta');
      return { success: false, error: 'Image update not needed' };
    }

    this.processingQueue.add(groupId);
    this.currentUpdates++;

    try {
      console.log('🔄 Iniciando atualização automática de imagem para grupo:', groupId);
      console.log('📥 Baixando imagem do fallback:', fallbackImageUrl);
      console.log('🗑️ Imagem atual que será substituída:', currentProfileImage);

      // Convert and upload the fallback image to Firebase Storage
      const conversionResult = await webpConversionService.convertAndUploadToWebP(
        fallbackImageUrl,
        groupId,
        currentProfileImage // Pass old image for deletion
      );

      if (!conversionResult.success || !conversionResult.webpUrl) {
        throw new Error(conversionResult.error || 'Failed to convert image');
      }

      console.log('✅ Imagem convertida e salva:', conversionResult.webpUrl);

      // Update the group document in Firestore
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        profileImage: conversionResult.webpUrl,
        imageUpdatedAt: new Date(),
        autoUpdated: true
      });

      console.log('✅ ProfileImage atualizado no Firestore para grupo:', groupId);

      // Dispatch event to update UI
      window.dispatchEvent(new CustomEvent('groupImageUpdated', {
        detail: { 
          groupId, 
          newImageUrl: conversionResult.webpUrl,
          oldImageUrl: currentProfileImage
        }
      }));

      return {
        success: true,
        newImageUrl: conversionResult.webpUrl
      };

    } catch (error) {
      console.error('❌ Erro na atualização automática de imagem:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.processingQueue.delete(groupId);
      this.currentUpdates--;
    }
  }

  /**
   * Check if a group needs image update and process it in background
   */
  async checkAndUpdateGroupImage(
    groupId: string,
    currentProfileImage?: string,
    fallbackImageUrl?: string
  ): Promise<void> {
    // Only process if we have a valid fallback
    if (!fallbackImageUrl) {
      console.log('❌ Não deve atualizar imagem:', {
        groupId,
        hasValidFallback: !!fallbackImageUrl
      });
      return;
    }
    
    // Check if should update (async now)
    const shouldUpdate = await this.shouldUpdateImage(currentProfileImage, fallbackImageUrl);
    if (!shouldUpdate) {
      console.log('❌ Não deve atualizar imagem baseado na lógica');
      return;
    }

    console.log('🚀 Iniciando verificação e atualização automática para grupo:', groupId);

    // Process in background without blocking UI
    setTimeout(async () => {
      try {
        const result = await this.updateGroupImageFromFallback(
          groupId,
          fallbackImageUrl,
          currentProfileImage
        );

        if (result.success) {
          console.log('🎉 Imagem do grupo atualizada automaticamente:', groupId);
          console.log('🆕 Nova URL da imagem:', result.newImageUrl);
        } else {
          console.log('⚠️ Atualização automática não realizada:', result.error);
        }
      } catch (error) {
        console.warn('⚠️ Falha na atualização automática de imagem:', error);
      }
    }, 2000); // 2 second delay to not block initial render
  }

  /**
   * Determine if an image should be updated
   */
  private async shouldUpdateImage(currentProfileImage?: string, fallbackImageUrl?: string): Promise<boolean> {
    console.log('🔍 Verificando se deve atualizar imagem:', {
      currentProfileImage,
      fallbackImageUrl
    });

    // No fallback available
    if (!fallbackImageUrl) {
      console.log('❌ Sem fallback disponível');
      return false;
    }

    // Fallback is not a real image (generated avatar) - ALLOW telesco.pe images
    if (fallbackImageUrl.includes('ui-avatars.com') ||
        fallbackImageUrl.startsWith('data:image/svg+xml')) {
      console.log('❌ Fallback não é uma imagem real (avatar gerado)');
      return false;
    }

    // Current image is empty or generic
    if (!currentProfileImage ||
        currentProfileImage.includes('ui-avatars.com') ||
        currentProfileImage.startsWith('data:image/svg+xml')) {
      console.log('✅ Imagem atual é vazia ou genérica, deve atualizar');
      return true;
    }

    // ALLOW telesco.pe images for download and conversion (only if current is not Firebase Storage)
    if (fallbackImageUrl.includes('telesco.pe') && 
        !currentProfileImage.includes('firebasestorage.googleapis.com')) {
      console.log('✅ Imagem do telesco.pe detectada e atual não é do Firebase, deve fazer download e upload');
      return true;
    }

    // If current image is from Firebase Storage, test if it actually loads
    if (currentProfileImage.includes('firebasestorage.googleapis.com')) {
      console.log('🔍 Testando se imagem do Firebase Storage carrega...');
      
      // Test if current Firebase image actually loads
      const currentImageWorks = await this.testImageLoad(currentProfileImage);
      
      if (!currentImageWorks) {
        console.log('❌ Imagem do Firebase Storage não carrega, deve atualizar com nova imagem');
        return true;
      } else {
        console.log('✅ Imagem do Firebase Storage carrega corretamente, não precisa atualizar');
        return false;
      }
    }

    // Current image is external URL and fallback is better quality
    if (!currentProfileImage.includes('firebasestorage.googleapis.com') &&
        fallbackImageUrl &&
        !fallbackImageUrl.includes('ui-avatars.com') &&
        fallbackImageUrl !== currentProfileImage) {
      console.log('✅ Imagem atual não está no Firebase Storage, deve atualizar');
      return true;
    }

    console.log('❌ Caso não coberto pela lógica');
    return false;
  }

  /**
   * Batch update multiple groups (for admin use)
   */
  async batchUpdateGroupImages(
    groups: Array<{
      id: string;
      profileImage?: string;
      telegramUrl: string;
      name: string;
    }>
  ): Promise<void> {
    console.log(`🚀 Iniciando atualização em lote de ${groups.length} grupos`);

    for (const group of groups) {
      try {
        // Get image from Telegram API
        const { telegramBatchService } = await import('./telegramBatchService');
        const groupInfo = await telegramBatchService.getGroupInfo(group.telegramUrl);
        
        if (groupInfo.photo_url && !groupInfo.error) {
          await this.updateGroupImageFromFallback(
            group.id,
            groupInfo.photo_url,
            group.profileImage
          );
          
          // Small delay between updates
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.warn(`⚠️ Falha na atualização do grupo ${group.id}:`, error);
      }
    }

    console.log('✅ Atualização em lote concluída');
  }

  /**
   * Test if image loads successfully
   */
  private testImageLoad(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        console.log('✅ Teste de carregamento bem-sucedido:', url);
        resolve(true);
      };
      img.onerror = () => {
        console.log('❌ Teste de carregamento falhou:', url);
        resolve(false);
      };
      img.src = url;
      
      // Timeout after 5 seconds
      setTimeout(() => {
        console.log('⏰ Timeout no teste de carregamento:', url);
        resolve(false);
      }, 5000);
    });
  }

  /**
   * Get processing status including correction operations
   */
  getStatus(): { processing: number; queued: number; corrections: number } {
    return {
      processing: this.currentUpdates,
      queued: this.processingQueue.size,
      corrections: this.currentUpdates // Same as processing for now
    };
  }
}

export const autoImageUpdateService = new AutoImageUpdateService();