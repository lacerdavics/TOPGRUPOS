import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface CachedImageData {
  originalUrl: string;
  firebaseUrl: string;
  cachedAt: number;
  fileSize?: number;
}

class FirebaseImageCacheService {
  private readonly CACHE_COLLECTION = 'image_cache';
  private readonly STORAGE_PATH = 'cached_images';
  private readonly CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 dias
  
  // Gera um ID único para a imagem baseado na URL
  private generateImageId(url: string): string {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '').slice(0, 50);
  }

  // Verifica se a imagem está no cache do Firestore
  async getCachedImageUrl(originalUrl: string): Promise<string | null> {
    try {
      const imageId = this.generateImageId(originalUrl);
      const docRef = doc(db, this.CACHE_COLLECTION, imageId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as CachedImageData;
        
        // Verifica se o cache ainda é válido
        if (Date.now() - data.cachedAt < this.CACHE_DURATION) {
          console.log('✅ Imagem encontrada no cache Firebase:', data.firebaseUrl);
          return data.firebaseUrl;
        } else {
          console.log('⏰ Cache expirado, será renovado');
        }
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ Erro ao verificar cache:', error);
      return null;
    }
  }

  // Baixa a imagem e salva no Firebase Storage + Firestore
  async cacheImage(originalUrl: string): Promise<string> {
    try {
      console.log('📥 Baixando imagem para cache:', originalUrl);
      
      // Faz o download da imagem
      const response = await fetch(originalUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      const imageId = this.generateImageId(originalUrl);
      
      // Upload para Firebase Storage
      const storageRef = ref(storage, `${this.STORAGE_PATH}/${imageId}`);
      const snapshot = await uploadBytes(storageRef, blob);
      const firebaseUrl = await getDownloadURL(snapshot.ref);
      
      // Salva no Firestore
      const cacheData: CachedImageData = {
        originalUrl,
        firebaseUrl,
        cachedAt: Date.now(),
        fileSize: blob.size
      };
      
      const docRef = doc(db, this.CACHE_COLLECTION, imageId);
      await setDoc(docRef, cacheData);
      
      console.log('✅ Imagem salva no cache Firebase:', firebaseUrl);
      return firebaseUrl;
      
    } catch (error) {
      console.warn('⚠️ Erro ao cachear imagem:', error);
      throw error;
    }
  }

  // Método principal - tenta cache primeiro, se não existir, cria
  async getOptimizedImageUrl(originalUrl: string): Promise<string> {
    if (!originalUrl || !this.isValidImageUrl(originalUrl)) {
      return originalUrl;
    }

    try {
      // Verifica cache primeiro
      const cachedUrl = await this.getCachedImageUrl(originalUrl);
      if (cachedUrl) {
        return cachedUrl;
      }

      // Se não está em cache, baixa e salva
      return await this.cacheImage(originalUrl);
      
    } catch (error) {
      console.warn('⚠️ Fallback para URL original:', error);
      return originalUrl;
    }
  }

  private isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      return /\.(jpg|jpeg|png|gif|webp)$/i.test(path) || 
             url.includes('imgbb.com') ||
             url.includes('ui-avatars.com');
    } catch {
      return false;
    }
  }

  // Limpa cache expirado (pode ser chamado periodicamente)
  async clearExpiredCache(): Promise<void> {
    try {
      // Esta operação seria mais eficiente com Cloud Functions
      // Por ora, apenas log para implementação futura
      console.log('🧹 Limpeza de cache expirado - implementar com Cloud Functions');
    } catch (error) {
      console.warn('⚠️ Erro na limpeza de cache:', error);
    }
  }
}

export const firebaseImageCacheService = new FirebaseImageCacheService();