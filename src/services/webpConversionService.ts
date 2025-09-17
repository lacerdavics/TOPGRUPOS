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
      console.log('🚀 webpConversionService: ===== INICIANDO PROCESSO COMPLETO =====');
      console.log('📥 webpConversionService: URL da imagem para download:', imageUrl);
      console.log('🆔 webpConversionService: Group ID:', groupId);
      console.log('🗑️ webpConversionService: Imagem antiga para deletar:', oldImageUrl || 'Nenhuma');
      console.log('🔄 webpConversionService: Processo: Download → Conversão WebP → Upload → Exclusão antiga');

      // Step 0: Delete old image if provided
      if (oldImageUrl) {
        console.log('🗑️ webpConversionService: ETAPA 0: EXCLUINDO IMAGEM ANTIGA ANTES DO UPLOAD');
        const deleteSuccess = await this.deleteOldImage(oldImageUrl);
        if (deleteSuccess) {
          console.log('✅ webpConversionService: IMAGEM ANTIGA EXCLUÍDA COM SUCESSO');
        } else {
          console.log('⚠️ webpConversionService: NÃO FOI POSSÍVEL EXCLUIR IMAGEM ANTIGA, CONTINUANDO');
        }
      }

      // Step 1: Get optimized/proxied image URL to bypass CORS
      console.log('🔄 webpConversionService: ETAPA 1: OTIMIZANDO URL PARA BYPASS CORS');
      const optimizedImageUrl = await cloudflareService.optimizeImage(imageUrl, {
        width: 800,
        height: 800,
        format: 'auto',
        quality: 85
      });

      console.log('✅ webpConversionService: URL OTIMIZADA OBTIDA');
      console.log('🔗 webpConversionService: URL original:', imageUrl);
      console.log('🔗 webpConversionService: URL otimizada:', optimizedImageUrl);
      
      // Step 2: Download the image using the proxied URL
      console.log('📥 webpConversionService: ETAPA 2: INICIANDO DOWNLOAD DA IMAGEM');
      console.log('📥 webpConversionService: Fazendo fetch da URL otimizada...');
      const response = await fetch(optimizedImageUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(30000), // 30 second timeout
        mode: 'cors'
      });

      if (!response.ok) {
        console.error('❌ webpConversionService: FALHA NO DOWNLOAD DA IMAGEM');
        console.error('❌ webpConversionService: Status HTTP:', response.status);
        console.error('❌ webpConversionService: Status Text:', response.statusText);
        console.error('❌ webpConversionService: URL que falhou:', optimizedImageUrl);
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const blob = await response.blob();
      console.log('✅ webpConversionService: IMAGEM BAIXADA COM SUCESSO');
      console.log('📊 webpConversionService: Tamanho do arquivo baixado:', Math.round(blob.size / 1024), 'KB');
      console.log('📊 webpConversionService: Tipo MIME do arquivo:', blob.type);
      console.log('📊 webpConversionService: Arquivo é válido:', blob.type.startsWith('image/') ? 'SIM' : 'NÃO');
      
      // Validate image type and size
      if (!blob.type.startsWith('image/')) {
        console.error('❌ webpConversionService: ARQUIVO BAIXADO NÃO É UMA IMAGEM');
        console.error('❌ webpConversionService: Tipo MIME recebido:', blob.type);
        throw new Error('Downloaded file is not an image');
      }

      if (blob.size > this.MAX_FILE_SIZE) {
        console.error('❌ webpConversionService: ARQUIVO MUITO GRANDE');
        console.error('❌ webpConversionService: Tamanho:', Math.round(blob.size / 1024 / 1024), 'MB');
        console.error('❌ webpConversionService: Limite máximo:', Math.round(this.MAX_FILE_SIZE / 1024 / 1024), 'MB');
        throw new Error('Image file too large (max 5MB)');
      }


      // Step 3: Convert to WebP using Canvas
      console.log('🔄 webpConversionService: ETAPA 3: INICIANDO CONVERSÃO PARA WEBP');
      const webpBlob = await this.convertToWebP(blob);
      
      console.log('✅ webpConversionService: CONVERSÃO PARA WEBP CONCLUÍDA');
      console.log('📊 webpConversionService: Tamanho original:', Math.round(blob.size / 1024), 'KB');
      console.log('📊 webpConversionService: Tamanho WebP:', Math.round(webpBlob.size / 1024), 'KB');
      console.log('📊 webpConversionService: Redução de tamanho:', Math.round(((blob.size - webpBlob.size) / blob.size) * 100), '%');

      // Step 4: Upload to Firebase Storage
      console.log('🔄 webpConversionService: ETAPA 4: PREPARANDO UPLOAD PARA FIREBASE STORAGE');
      const filename = `${groupId}_${Date.now()}.webp`;
      const imagePath = `${this.WEBP_FOLDER}/${filename}`;

      console.log('📁 webpConversionService: Pasta de destino:', this.WEBP_FOLDER);
      console.log('📁 webpConversionService: Nome do arquivo:', filename);
      console.log('📁 webpConversionService: Caminho completo:', imagePath);
      
      const storageRef = ref(storage, imagePath);
      console.log('📁 webpConversionService: Referência do Firebase Storage criada');
      console.log('📁 webpConversionService: Full path:', storageRef.fullPath);
      console.log('📁 webpConversionService: Bucket:', storageRef.bucket);
      
      console.log('⬆️ webpConversionService: INICIANDO UPLOAD PARA FIREBASE STORAGE');
      console.log('⬆️ webpConversionService: Tamanho do arquivo a ser enviado:', Math.round(webpBlob.size / 1024), 'KB');
      const uploadResult = await uploadBytes(storageRef, webpBlob, {
        contentType: 'image/webp',
        cacheControl: 'public,max-age=31536000', // Cache for 1 year
      });

      console.log('✅ webpConversionService: UPLOAD PARA FIREBASE STORAGE CONCLUÍDO!');
      console.log('📁 webpConversionService: Arquivo salvo em:', uploadResult.ref.fullPath);
      console.log('📁 webpConversionService: Bucket de destino:', uploadResult.ref.bucket);
      console.log('📁 webpConversionService: Nome final do arquivo:', uploadResult.ref.name);

      // Get download URL
      console.log('🔗 webpConversionService: ETAPA 5: OBTENDO URL DE DOWNLOAD PÚBLICA');
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      console.log('✅ webpConversionService: URL DE DOWNLOAD OBTIDA COM SUCESSO!');
      console.log('🔗 webpConversionService: URL pública final:', downloadURL);
      console.log('🎯 webpConversionService: ===== PROCESSO COMPLETO FINALIZADO =====');

      return {
        success: true,
        webpUrl: downloadURL,
        originalUrl: imageUrl,
        fileSize: webpBlob.size,
        oldImageDeleted: oldImageUrl ? true : undefined
      };

    } catch (error) {
      console.error('❌ webpConversionService: ===== ERRO CRÍTICO NO PROCESSO =====');
      console.error('❌ webpConversionService: Tipo do erro:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('❌ webpConversionService: Mensagem:', error instanceof Error ? error.message : String(error));
      console.error('❌ webpConversionService: Código do erro:', (error as any)?.code);
      console.error('❌ webpConversionService: Stack trace:', error instanceof Error ? error.stack : 'N/A');
      console.error('❌ webpConversionService: Parâmetros da chamada:', {
        imageUrl,
        groupId,
        oldImageUrl,
        timestamp: new Date().toISOString()
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
      console.log('🎨 webpConversionService: INICIANDO CONVERSÃO CANVAS PARA WEBP');
      console.log('📊 webpConversionService: Blob de entrada - Tamanho:', Math.round(imageBlob.size / 1024), 'KB');
      console.log('📊 webpConversionService: Blob de entrada - Tipo MIME:', imageBlob.type);
      console.log('📊 webpConversionService: Qualidade WebP configurada:', this.WEBP_QUALITY);
      
      const img = new Image();
      
      img.onload = () => {
        try {
          console.log('🖼️ webpConversionService: IMAGEM CARREGADA NO CANVAS COM SUCESSO');
          console.log('📐 webpConversionService: Largura original:', img.naturalWidth, 'px');
          console.log('📐 webpConversionService: Altura original:', img.naturalHeight, 'px');
          
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.error('❌ webpConversionService: CANVAS CONTEXT NÃO DISPONÍVEL');
            reject(new Error('Canvas context not available'));
            return;
          }

          // Set canvas dimensions (maintain aspect ratio, max 800px)
          console.log('📐 webpConversionService: Calculando dimensões finais (máx 800px)...');
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
            console.log('📐 webpConversionService: Imagem será redimensionada');
          } else {
            console.log('📐 webpConversionService: Imagem mantém tamanho original');
          }

          console.log('📐 webpConversionService: Largura final:', width, 'px');
          console.log('📐 webpConversionService: Altura final:', height, 'px');
          canvas.width = width;
          canvas.height = height;

          // Draw image with high quality
          console.log('🎨 webpConversionService: Configurando qualidade de renderização...');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          console.log('🎨 webpConversionService: DESENHANDO IMAGEM NO CANVAS');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP blob
          console.log('🔄 webpConversionService: CONVERTENDO CANVAS PARA BLOB WEBP');
          console.log('🔄 webpConversionService: Qualidade WebP:', this.WEBP_QUALITY);
          canvas.toBlob(
            (webpBlob) => {
              if (webpBlob) {
                console.log('✅ webpConversionService: BLOB WEBP CRIADO COM SUCESSO');
                console.log('📊 webpConversionService: Tamanho final WebP:', Math.round(webpBlob.size / 1024), 'KB');
                console.log('📊 webpConversionService: Tipo MIME final:', webpBlob.type);
                resolve(webpBlob);
              } else {
                console.error('❌ webpConversionService: FALHA AO CRIAR BLOB WEBP');
                reject(new Error('Failed to convert to WebP'));
              }
            },
            'image/webp',
            this.WEBP_QUALITY
          );
        } catch (error) {
          console.error('❌ webpConversionService: ERRO DURANTE CONVERSÃO CANVAS');
          console.error('❌ webpConversionService: Detalhes do erro:', error);
          reject(error);
        }
      };

      img.onerror = () => {
        console.error('❌ webpConversionService: ERRO AO CARREGAR IMAGEM NO CANVAS');
        console.error('❌ webpConversionService: URL que falhou no Canvas:', URL.createObjectURL(imageBlob));
        reject(new Error('Failed to load image for conversion'));
      };

      // Load image from blob
      console.log('🔄 webpConversionService: CARREGANDO BLOB NA IMAGEM PARA CANVAS');
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