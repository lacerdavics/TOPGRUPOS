// Enhanced image caching service with persistent storage and optimization
import { imageProxyService } from './imageProxyService';
import { firebaseImageCacheService } from './firebaseImageCacheService';

interface CachedImageData {
  originalUrl: string;
  optimizedUrl: string;
  timestamp: number;
  quality: 'high' | 'medium' | 'low';
  fileSize?: number;
}

class EnhancedImageCacheService {
  private memoryCache = new Map<string, CachedImageData>();
  private readonly STORAGE_KEY = 'image_cache_v2';
  private readonly MAX_MEMORY_SIZE = 200; // Maximum images in memory
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly HIGH_QUALITY_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor() {
    this.loadFromStorage();
    this.setupCleanup();
  }

  // Load cache from localStorage on initialization
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as Record<string, CachedImageData>;
        Object.entries(data).forEach(([key, value]) => {
          if (this.isValidCacheEntry(value)) {
            this.memoryCache.set(key, value);
          }
        });
        console.log(`📚 Loaded ${this.memoryCache.size} images from cache`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load image cache from storage:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // Save cache to localStorage
  private saveToStorage(): void {
    try {
      const data: Record<string, CachedImageData> = {};
      this.memoryCache.forEach((value, key) => {
        data[key] = value;
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ Failed to save image cache to storage:', error);
      // If storage is full, clear some old entries
      this.cleanOldEntries();
    }
  }

  // Check if cache entry is still valid
  private isValidCacheEntry(entry: CachedImageData): boolean {
    const maxAge = entry.quality === 'high' ? this.HIGH_QUALITY_CACHE_DURATION : this.CACHE_DURATION;
    return Date.now() - entry.timestamp < maxAge;
  }

  // Clean old entries to free up space
  private cleanOldEntries(): void {
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Remove oldest 30% of entries
    const toRemove = Math.floor(entries.length * 0.3);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
    
    this.saveToStorage();
    console.log(`🧹 Cleaned ${toRemove} old cache entries`);
  }

  // Setup periodic cleanup
  private setupCleanup(): void {
    // Clean expired entries every 5 minutes
    setInterval(() => {
      let cleanedCount = 0;
      this.memoryCache.forEach((entry, key) => {
        if (!this.isValidCacheEntry(entry)) {
          this.memoryCache.delete(key);
          cleanedCount++;
        }
      });
      
      if (cleanedCount > 0) {
        this.saveToStorage();
        console.log(`🧹 Auto-cleaned ${cleanedCount} expired cache entries`);
      }
    }, 5 * 60 * 1000);
  }

  // Get optimized image URL from cache or create it
  async getOptimizedImageUrl(originalUrl: string, quality: 'high' | 'medium' | 'low' = 'medium'): Promise<string> {
    if (!originalUrl || !this.isValidImageUrl(originalUrl)) {
      console.log('❌ Invalid image URL:', originalUrl);
      return originalUrl;
    }

    console.log('🖼️ Processing image:', originalUrl, 'Quality:', quality);

    const cacheKey = `${originalUrl}_${quality}`;
    
    // Check memory cache first
    const cached = this.memoryCache.get(cacheKey);
    if (cached && this.isValidCacheEntry(cached)) {
      console.log('✅ Using cached image:', cached.optimizedUrl);
      return cached.optimizedUrl;
    }

    try {
      // For Firebase Storage URLs (WebP), use directly
      if (originalUrl.includes('firebasestorage.googleapis.com') && originalUrl.includes('.webp')) {
        console.log('✅ Using Firebase Storage WebP image directly:', originalUrl);
        return originalUrl;
      }
      
      // For other URLs, use original URL to avoid proxy issues
      let optimizedUrl = originalUrl;
      
      console.log('✅ Using direct URL (Firebase Storage or API URL):', optimizedUrl);

      // Cache the result
      const cacheData: CachedImageData = {
        originalUrl,
        optimizedUrl,
        timestamp: Date.now(),
        quality
      };

      this.memoryCache.set(cacheKey, cacheData);
      
      // Manage memory size
      if (this.memoryCache.size > this.MAX_MEMORY_SIZE) {
        this.cleanOldEntries();
      } else {
        this.saveToStorage();
      }

      return optimizedUrl;

    } catch (error) {
      console.error('⚠️ Image processing failed, using original:', error);
      return originalUrl;
    }
  }

  // Preload images in background
  async preloadImages(urls: string[], quality: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    if (urls.length === 0) return;

    console.log(`🚀 Preloading ${urls.length} images with ${quality} quality`);
    
    // Process in small batches to avoid overwhelming the browser
    const batchSize = quality === 'high' ? 2 : 4;
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      
      try {
        await Promise.allSettled(
          batch.map(url => this.getOptimizedImageUrl(url, quality))
        );
        
        // Small delay between batches
        if (i + batchSize < urls.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        console.warn('⚠️ Batch preload failed:', error);
      }
    }
    
    console.log('✅ Image preloading completed');
  }

  // Check if URL is a valid image
  private isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      
      // Always return true for common image services and CDNs to avoid blocking valid images
      if (url.includes('ui-avatars.com') ||
          url.includes('cdn.') ||
          url.includes('photo') ||
          url.includes('image') ||
          url.includes('t.me/') ||
          url.includes('telegram.org') ||
          /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(path)) {
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }

  // Test if image loads successfully
  private testImageLoad(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      setTimeout(() => resolve(false), 8000); // 8 second timeout
    });
  }

  // Verify cached images are still accessible
  async verifyCachedImages(): Promise<void> {
    console.log('🔍 Verifying cached images...');
    
    const entries = Array.from(this.memoryCache.entries());
    let verifiedCount = 0;
    let removedCount = 0;
    
    for (const [key, data] of entries) {
      const isAccessible = await this.testImageLoad(data.optimizedUrl);
      if (!isAccessible) {
        this.memoryCache.delete(key);
        removedCount++;
      } else {
        verifiedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.saveToStorage();
      console.log(`✅ Verified ${verifiedCount} images, removed ${removedCount} broken links`);
    }
  }

  // Get cache statistics
  getCacheStats(): { size: number; memoryUsage: string; oldestEntry: string } {
    const entries = Array.from(this.memoryCache.values());
    const memoryUsageKB = JSON.stringify(Object.fromEntries(this.memoryCache)).length / 1024;
    const oldestTimestamp = Math.min(...entries.map(e => e.timestamp));
    
    return {
      size: this.memoryCache.size,
      memoryUsage: `${memoryUsageKB.toFixed(2)} KB`,
      oldestEntry: new Date(oldestTimestamp).toLocaleDateString()
    };
  }

  // Clear all cache
  clearCache(): void {
    this.memoryCache.clear();
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ All image cache cleared');
  }
}

export const enhancedImageCacheService = new EnhancedImageCacheService();