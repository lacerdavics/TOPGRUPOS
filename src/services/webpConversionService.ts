// Service for converting images to WebP format and uploading to Firebase Storage
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { cloudflareService } from './cloudflareService';

interface WebPConversionResult {
  success: boolean;
  webpUrl?: string;
  originalUrl?: string;
  error?: string;
  fileSize?: number;
}

class WebPConversionService {
  private readonly WEBP_FOLDER = 'webp-images';
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly WEBP_QUALITY = 0.85; // 85% quality for good balance

  /**
   * Extracts the storage path from a Firebase Storage URL
   */
  private extractStoragePath(firebaseUrl: string): string | null {
    try {
      console.log('🔍 webpConversionService: Extraindo caminho do storage da URL:', firebaseUrl);
      
      // Firebase Storage URLs have format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?{params}
      const url = new URL(firebaseUrl);
      
      if (!url.hostname.includes('firebasestorage.googleapis.com')) {
        console.log('❌ webpConversionService: URL não é do Firebase Storage:', firebaseUrl);
        return null;
      }
      
      // Extract the path from the URL
      const pathMatch = url.pathname.match(/\/o\/(.+)$/);
      if (pathMatch) {
        // Decode the path (Firebase encodes special characters)
        const decodedPath = decodeURIComponent(pathMatch[1]);
        console.log('✅ webpConversionService: Caminho extraído do Firebase Storage:', decodedPath);
        return decodedPath;
      }
      
      console.log('❌ webpConversionService: Não foi possível extrair caminho da URL:', firebaseUrl);
      return null;
    } catch (error) {
      console.error('❌ webpConversionService: Erro ao extrair caminho do storage:', error);
      return null;
    }
  }

  /**
   * Deletes an old image from Firebase Storage
   */
  async deleteOldImage(oldImageUrl: string): Promise<boolean> {
    try {
      console.log('🗑️ webpConversionService: TENTANDO EXCLUIR IMAGEM ANTIGA');
      console.log('🗑️ webpConversionService: URL para exclusão:', oldImageUrl);
      
      if (!oldImageUrl || !oldImageUrl.includes('firebasestorage.googleapis.com')) {
        console.log('⚠️ webpConversionService: URL não é do Firebase Storage, ignorando exclusão');
        console.log('⚠️ webpConversionService: Tipo de URL detectado:', oldImageUrl?.includes('telesco.pe') ? 'telesco.pe' : oldImageUrl?.includes('ui-avatars.com') ? 'ui-avatars' : 'outro');
        return false;
      }

      const storagePath = this.extractStoragePath(oldImageUrl);
      if (!storagePath) {
        console.error('❌ webpConversionService: FALHA AO EXTRAIR CAMINHO DO STORAGE');
        console.error('❌ webpConversionService: URL problemática:', oldImageUrl);
        return false;
      }

      console.log('🗑️ webpConversionService: EXCLUINDO IMAGEM ANTIGA DO FIREBASE STORAGE');
      console.log('🗑️ webpConversionService: Caminho no storage:', storagePath);
      
      const oldImageRef = ref(storage, storagePath);
      await deleteObject(oldImageRef);
      
      console.log('✅ webpConversionService: IMAGEM ANTIGA EXCLUÍDA COM SUCESSO');
      return true;
    } catch (error) {
      // Se o arquivo não existir, não é um erro crítico
      if ((error as any)?.code === 'storage/object-not-found') {
        console.log('ℹ️ webpConversionService: IMAGEM ANTIGA NÃO ENCONTRADA (já foi excluída ou nunca existiu)');
        return true;
      }
      
      console.error('❌ webpConversionService: ERRO AO EXCLUIR IMAGEM ANTIGA');
      console.error('❌ webpConversionService: Código do erro:', (error as any)?.code);
      console.error('❌ webpConversionService: Mensagem do erro:', (error as any)?.message);
      return false;
    }
  }

  /**
   * Downloads an image, converts to WebP, and uploads to Firebase Storage
   */
  async convertAndUploadToWebP(imageUrl: string, groupId: string, oldImageUrl?: string): Promise<WebPConversionResult> {
    try {
      console.log('🚀 === WEBP CONVERSION SERVICE - INÍCIO ===');
      console.log('📥 URL para download:', imageUrl);
      console.log('🆔 Group ID:', groupId);
      console.log('🗑️ Imagem antiga para deletar:', oldImageUrl || 'Nenhuma');

      // Step 0: Delete old image if provided
      if (oldImageUrl) {
        console.log('🗑️ ETAPA 0: Excluindo imagem antiga...');
        const deleteSuccess = await this.deleteOldImage(oldImageUrl);
        if (deleteSuccess) {
          console.log('✅ Imagem antiga excluída com sucesso');
        } else {
          console.log('⚠️ Não foi possível excluir imagem antiga, continuando...');
        }
      }

      // Step 1: Get optimized/proxied image URL to bypass CORS
      console.log('🔄 ETAPA 1: Otimizando URL para bypass CORS...');
      const optimizedImageUrl = await cloudflareService.optimizeImage(imageUrl, {
        width: 800,
        height: 800,
        format: 'auto',
        quality: 85
      });

      console.log('✅ URL otimizada obtida:', optimizedImageUrl);
      
      // Step 2: Download the image using the proxied URL
      console.log('📥 ETAPA 2: Iniciando download da imagem...');
      const response = await fetch(optimizedImageUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(30000), // 30 second timeout
        mode: 'cors'
      });

      if (!response.ok) {
        console.error('❌ FALHA NO DOWNLOAD - Status:', response.status, response.statusText);
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const blob = await response.blob();
      console.log('✅ DOWNLOAD CONCLUÍDO - Tamanho:', Math.round(blob.size / 1024), 'KB, Tipo:', blob.type);
      
      // Validate image type and size
      if (!blob.type.startsWith('image/')) {
        console.error('❌ ARQUIVO NÃO É IMAGEM - Tipo MIME:', blob.type);
        throw new Error('Downloaded file is not an image');
      }

      if (blob.size > this.MAX_FILE_SIZE) {
        console.error('❌ ARQUIVO MUITO GRANDE:', Math.round(blob.size / 1024 / 1024), 'MB');
        throw new Error('Image file too large (max 5MB)');
      }


      // Step 3: Convert to WebP using Canvas
      console.log('🔄 ETAPA 3: Convertendo para WebP...');
      const webpBlob = await this.convertToWebP(blob);
      
      const reduction = Math.round(((blob.size - webpBlob.size) / blob.size) * 100);
      console.log('✅ CONVERSÃO WEBP CONCLUÍDA - Redução:', reduction, '% (', Math.round(webpBlob.size / 1024), 'KB )');

      // Step 4: Upload to Firebase Storage
      console.log('🔄 ETAPA 4: Fazendo upload para Firebase Storage...');
      const filename = `${groupId}_${Date.now()}.webp`;
      const imagePath = `${this.WEBP_FOLDER}/${filename}`;

      console.log('📁 Caminho do arquivo:', imagePath);
      
      const storageRef = ref(storage, imagePath);
      
      const uploadResult = await uploadBytes(storageRef, webpBlob, {
        contentType: 'image/webp',
        cacheControl: 'public,max-age=31536000', // Cache for 1 year
      });

      console.log('✅ UPLOAD CONCLUÍDO para Firebase Storage');

      // Get download URL
      console.log('🔗 ETAPA 5: Obtendo URL pública...');
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      console.log('✅ === WEBP CONVERSION FINALIZADA COM SUCESSO ===');
      console.log('🔗 URL pública final:', downloadURL);

      return {
        success: true,
        webpUrl: downloadURL,
        originalUrl: imageUrl,
        fileSize: webpBlob.size,
        oldImageDeleted: oldImageUrl ? true : undefined
      };

    } catch (error) {
      console.error('❌ === ERRO CRÍTICO NA CONVERSÃO WEBP ===');
      console.error('❌ Mensagem:', error instanceof Error ? error.message : String(error));
      console.error('❌ Parâmetros:', {
        imageUrl,
        groupId,
        oldImageUrl,
      });
      
      return {
        success: false,
        originalUrl: imageUrl,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        oldImageDeleted: false
      };
    }
  }

  /**
   * Convert image blob to WebP format using Canvas
   */
  private async convertToWebP(imageBlob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      console.log('🎨 Iniciando conversão Canvas para WebP...');
      console.log('📊 Entrada:', Math.round(imageBlob.size / 1024), 'KB,', imageBlob.type);
      
      const img = new Image();
      
      img.onload = () => {
        try {
          console.log('🖼️ Imagem carregada no Canvas:', img.naturalWidth, 'x', img.naturalHeight, 'px');
          
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.error('❌ Canvas context não disponível');
            reject(new Error('Canvas context not available'));
            return;
          }

          // Set canvas dimensions (maintain aspect ratio, max 800px)
          console.log('📐 Calculando dimensões finais (máx 800px)...');
          const maxDimension = 800;
          let { width, height } = img;
          
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
            console.log('📐 Redimensionando para:', width, 'x', height);
          } else {
            console.log('📐 Mantendo tamanho original');
          }

          canvas.width = width;
          canvas.height = height;

          // Draw image with high quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP blob
          console.log('🔄 Convertendo Canvas para blob WebP...');
          canvas.toBlob(
            (webpBlob) => {
              if (webpBlob) {
                console.log('✅ Blob WebP criado:', Math.round(webpBlob.size / 1024), 'KB');
                resolve(webpBlob);
              } else {
                console.error('❌ Falha ao criar blob WebP');
                reject(new Error('Failed to convert to WebP'));
              }
            },
            'image/webp',
            this.WEBP_QUALITY
          );
        } catch (error) {
          console.error('❌ Erro durante conversão Canvas:', error);
          reject(error);
        }
      };

      img.onerror = () => {
        console.error('❌ Erro ao carregar imagem no Canvas');
        reject(new Error('Failed to load image for conversion'));
      };

      // Load image from blob
      console.log('🔄 Carregando blob na imagem para Canvas...');
      img.src = URL.createObjectURL(imageBlob);
    });
  }

  /**
   * Check if browser supports WebP
   */
  isWebPSupported(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Get appropriate image format based on browser support
   */
  getOptimalFormat(): 'webp' | 'jpeg' {
    return this.isWebPSupported() ? 'webp' : 'jpeg';
  }

  /**
   * Cleanup orphaned images - utility function for maintenance
   */
  async cleanupOrphanedImages(validImageUrls: string[]): Promise<number> {
    try {
      console.log('🧹 Iniciando limpeza de imagens órfãs...');
      
      // This would require listing all files in storage and comparing with valid URLs
      // For now, just log the intent - full implementation would need Cloud Functions
      console.log('ℹ️ Limpeza de imagens órfãs deve ser implementada via Cloud Functions para melhor performance');
      
      return 0;
    } catch (error) {
      console.error('❌ Erro na limpeza de imagens órfãs:', error);
      return 0;
    }
  }
}

export const webpConversionService = new WebPConversionService();