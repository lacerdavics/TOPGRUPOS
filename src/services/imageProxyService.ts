// Legacy service - Use CloudflareService instead for better optimization
// Service to handle image proxying and caching to bypass Cloudflare protection

import { cloudflareService } from './cloudflareService';

interface CachedImage {
  originalUrl: string;
  proxyUrl: string;
  timestamp: number;
  success: boolean;
}

class ImageProxyService {
  private cache = new Map<string, CachedImage>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 1000;
  
  // List of proxy services to try
  private readonly proxyServices = [
    // Use CORS proxy services
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
    (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
    // Direct image optimization services
    (url: string) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=400&h=400&fit=cover&a=attention`,
    (url: string) => `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=400&h=400&fit=cover&a=attention`,
  ];

  private cleanCache() {
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  private isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Check if it's an image URL
      const path = urlObj.pathname.toLowerCase();
      return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(path) || 
             url.includes('ui-avatars.com') ||
             url.includes('cdn.') ||
             url.includes('photo');
    } catch {
      return false;
    }
  }

  private async testImageUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  }

  async getOptimizedImageUrl(originalUrl: string): Promise<string> {
    console.warn('⚠️ ImageProxyService is deprecated. Use CloudflareService instead for better optimization.');
    
    // Delegate to new CloudflareService
    try {
      return await cloudflareService.optimizeImage(originalUrl, {
        width: 400,
        height: 400,
        quality: 80,
        format: 'auto',
        fit: 'cover'
      });
    } catch (error) {
      console.error('❌ CloudflareService fallback failed:', error);
      return originalUrl;
    }
  }

  // Method for preloading images (can be called during data processing)
  async preloadImage(url: string): Promise<void> {
    if (!url) return;
    
    try {
      const optimizedUrl = await this.getOptimizedImageUrl(url);
      console.log('🚀 Preloaded image:', url, '->', optimizedUrl);
    } catch (error) {
      console.warn('⚠️ Error preloading image:', url, error);
    }
  }

  // Batch preload multiple images
  async preloadImages(urls: string[]): Promise<void> {
    const validUrls = urls.filter(url => url && this.isValidImageUrl(url));
    console.log(`🔄 Preloading ${validUrls.length} images...`);
    
    // Process in chunks to avoid overwhelming the browser
    const chunkSize = 5;
    for (let i = 0; i < validUrls.length; i += chunkSize) {
      const chunk = validUrls.slice(i, i + chunkSize);
      await Promise.all(chunk.map(url => this.preloadImage(url)));
      
      // Small delay between chunks
      if (i + chunkSize < validUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('✅ Image preloading completed');
  }

  // Clear cache manually
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Image cache cleared');
  }

  // Get cache stats
  getCacheStats(): { size: number; hitRate: number } {
    const successfulEntries = Array.from(this.cache.values()).filter(entry => entry.success);
    return {
      size: this.cache.size,
      hitRate: this.cache.size > 0 ? (successfulEntries.length / this.cache.size) * 100 : 0
    };
  }
}

export const imageProxyService = new ImageProxyService();