// Cloudflare service for image optimization and CDN
interface CloudflareConfig {
  accountId?: string;
  zoneId?: string;
  apiToken?: string;
  imageDeliveryUrl?: string;
  enableOptimization: boolean;
}

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  gravity?: 'auto' | 'center' | 'left' | 'right' | 'top' | 'bottom';
  blur?: number;
  sharpen?: number;
}

class CloudflareService {
  private config: CloudflareConfig = {
    enableOptimization: true,
    // Default to public Cloudflare image optimization
    imageDeliveryUrl: 'https://imagedelivery.net'
  };

  // Popular Cloudflare-powered image proxies and CDNs
  private readonly imageProxies = [
    // Cloudflare Workers based proxies
    (url: string, options?: ImageOptimizationOptions) => 
      `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${options?.width || 400}&h=${options?.height || 400}&fit=${options?.fit || 'cover'}&a=attention&q=${options?.quality || 80}`,
    
    // Cloudflare Polish equivalent
    (url: string, options?: ImageOptimizationOptions) => 
      `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${options?.width || 400}&h=${options?.height || 400}&fit=${options?.fit || 'cover'}&q=${options?.quality || 80}`,
    
    // Direct Cloudflare optimization (if configured)
    (url: string, options?: ImageOptimizationOptions) => {
      if (this.config.imageDeliveryUrl && this.config.imageDeliveryUrl !== 'https://imagedelivery.net') {
        const params = new URLSearchParams();
        if (options?.width) params.set('w', options.width.toString());
        if (options?.height) params.set('h', options.height.toString());
        if (options?.quality) params.set('q', options.quality.toString());
        if (options?.format && options.format !== 'auto') params.set('f', options.format);
        if (options?.fit) params.set('fit', options.fit);
        
        return `${this.config.imageDeliveryUrl}/${encodeURIComponent(url)}?${params.toString()}`;
      }
      return url;
    },

    // Cloudflare CDN with basic optimization
    (url: string, options?: ImageOptimizationOptions) => 
      `https://cdn.jsdelivr.net/gh/topgrupos/image-proxy@main/proxy.php?url=${encodeURIComponent(url)}&w=${options?.width || 400}&h=${options?.height || 400}`,
  ];

  configure(config: Partial<CloudflareConfig>) {
    this.config = { ...this.config, ...config };
    console.log('🟠 Cloudflare service configured:', this.config);
  }

  private async testImageUrl(url: string, timeout = 5000): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
      
      setTimeout(() => resolve(false), timeout);
    });
  }

  private isValidImageUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      return /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(path) || 
             url.includes('ui-avatars.com') ||
             url.includes('cdn.') ||
             url.includes('photo') ||
             url.includes('image');
    } catch {
      return false;
    }
  }

  async optimizeImage(
    originalUrl: string, 
    options: ImageOptimizationOptions = {}
  ): Promise<string> {
    if (!this.config.enableOptimization || !this.isValidImageUrl(originalUrl)) {
      return originalUrl;
    }

    console.log('🟠 Optimizing image via Cloudflare:', originalUrl);

    // Set default optimization options
    const defaultOptions: ImageOptimizationOptions = {
      width: 400,
      height: 400,
      quality: 80,
      format: 'auto',
      fit: 'cover',
      ...options
    };

    // Test original URL first
    const originalWorks = await this.testImageUrl(originalUrl);
    if (originalWorks && !options.width && !options.height) {
      console.log('✅ Original image works, no optimization needed');
      return originalUrl;
    }

    // Try Cloudflare optimization proxies
    for (let i = 0; i < this.imageProxies.length; i++) {
      try {
        const proxy = this.imageProxies[i];
        const optimizedUrl = proxy(originalUrl, defaultOptions);
        
        console.log(`🔄 Testing Cloudflare proxy ${i + 1}:`, optimizedUrl);
        
        const works = await this.testImageUrl(optimizedUrl);
        if (works) {
          console.log('✅ Cloudflare optimization successful:', optimizedUrl);
          return optimizedUrl;
        }
      } catch (error) {
        console.warn(`⚠️ Cloudflare proxy ${i + 1} failed:`, error);
      }
    }

    console.log('❌ All Cloudflare optimizations failed, returning original');
    return originalUrl;
  }

  // Batch optimize multiple images
  async optimizeImages(
    urls: string[], 
    options: ImageOptimizationOptions = {}
  ): Promise<string[]> {
    console.log(`🟠 Batch optimizing ${urls.length} images via Cloudflare...`);
    
    const results = await Promise.allSettled(
      urls.map(url => this.optimizeImage(url, options))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.warn(`⚠️ Failed to optimize image ${index}:`, result.reason);
        return urls[index]; // Fallback to original
      }
    });
  }

  // Preload optimized images
  async preloadOptimizedImages(
    urls: string[], 
    options: ImageOptimizationOptions = {}
  ): Promise<void> {
    const validUrls = urls.filter(url => this.isValidImageUrl(url));
    if (validUrls.length === 0) return;

    console.log(`🚀 Preloading ${validUrls.length} optimized images...`);

    // Process in small chunks to avoid overwhelming
    const chunkSize = 3;
    for (let i = 0; i < validUrls.length; i += chunkSize) {
      const chunk = validUrls.slice(i, i + chunkSize);
      
      await Promise.allSettled(
        chunk.map(async (url) => {
          const optimizedUrl = await this.optimizeImage(url, options);
          
          // Create link element for preloading
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = optimizedUrl;
          document.head.appendChild(link);
          
          // Remove after 30 seconds to avoid memory leaks
          setTimeout(() => {
            if (link.parentNode) {
              link.parentNode.removeChild(link);
            }
          }, 30000);
        })
      );

      // Small delay between chunks
      if (i + chunkSize < validUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('✅ Cloudflare image preloading completed');
  }

  // Get different sizes for responsive images
  async getResponsiveImageSet(
    originalUrl: string,
    sizes: number[] = [320, 640, 800, 1200]
  ): Promise<{ srcSet: string; sizes: string }> {
    if (!this.isValidImageUrl(originalUrl)) {
      return { srcSet: originalUrl, sizes: '100vw' };
    }

    const optimizedUrls = await Promise.allSettled(
      sizes.map(size => 
        this.optimizeImage(originalUrl, { 
          width: size, 
          quality: 80,
          format: 'auto' 
        })
      )
    );

    const srcSetEntries = optimizedUrls
      .map((result, index) => {
        if (result.status === 'fulfilled') {
          return `${result.value} ${sizes[index]}w`;
        }
        return null;
      })
      .filter(Boolean);

    const srcSet = srcSetEntries.length > 0 
      ? srcSetEntries.join(', ')
      : originalUrl;

    const sizesAttribute = sizes
      .map((size, index) => {
        if (index === sizes.length - 1) return `${size}px`;
        return `(max-width: ${size}px) ${size}px`;
      })
      .join(', ');

    return {
      srcSet,
      sizes: sizesAttribute
    };
  }

  // Method to purge Cloudflare cache (if API token is configured)
  async purgeCache(urls: string[]): Promise<boolean> {
    if (!this.config.apiToken || !this.config.zoneId) {
      console.warn('⚠️ Cloudflare API token or zone ID not configured for cache purging');
      return false;
    }

    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/purge_cache`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: urls
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Cloudflare cache purged successfully');
        return true;
      } else {
        console.error('❌ Cloudflare cache purge failed:', result.errors);
        return false;
      }
    } catch (error) {
      console.error('❌ Error purging Cloudflare cache:', error);
      return false;
    }
  }

  // Get service status
  getStatus(): { enabled: boolean; configured: boolean; proxies: number } {
    return {
      enabled: this.config.enableOptimization,
      configured: !!(this.config.apiToken && this.config.zoneId),
      proxies: this.imageProxies.length
    };
  }
}

export const cloudflareService = new CloudflareService();