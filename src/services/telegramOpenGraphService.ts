// Service to fetch Telegram OpenGraph data and optimize image loading
// Updated to use the new batch API service as primary source

import { telegramBatchService } from './telegramBatchService';

interface TelegramOpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

interface CachedOpenGraphData {
  data: TelegramOpenGraphData;
  timestamp: number;
  success: boolean;
}

class TelegramOpenGraphService {
  private cache = new Map<string, CachedOpenGraphData>();
  private readonly CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours for OpenGraph data
  private readonly MAX_CACHE_SIZE = 500;

  // Fallback CORS proxy services (used only if batch API fails)
  private readonly proxyServices = [
    (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
    (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
  ];

  private cleanCache() {
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  private extractTelegramGroupName(telegramUrl: string): string | null {
    try {
      // Extract group name from t.me/groupname or t.me/joinchat/xxx
      const url = new URL(telegramUrl);
      const path = url.pathname;
      
      if (path.includes('/joinchat/')) {
        return path.split('/joinchat/')[1];
      } else if (path.startsWith('/')) {
        return path.substring(1);
      }
      
      return null;
    } catch {
      return null;
    }
  }

  private parseOpenGraphData(html: string): TelegramOpenGraphData {
    const data: TelegramOpenGraphData = {};
    
    try {
      // Extract og:title
      const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"[^>]*>/i);
      if (titleMatch) {
        data.title = titleMatch[1];
      }

      // Extract og:description
      const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"[^>]*>/i);
      if (descMatch) {
        data.description = descMatch[1];
      }

      // Extract og:image
      const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"[^>]*>/i);
      if (imageMatch) {
        data.image = imageMatch[1];
      }

      // Extract og:url
      const urlMatch = html.match(/<meta\s+property="og:url"\s+content="([^"]*)"[^>]*>/i);
      if (urlMatch) {
        data.url = urlMatch[1];
      }

      return data;
    } catch (error) {
      console.warn('Error parsing OpenGraph data:', error);
      return {};
    }
  }

  private async fetchWithProxy(telegramUrl: string): Promise<string | null> {
    for (const proxyService of this.proxyServices) {
      try {
        const proxyUrl = proxyService(telegramUrl);
        console.log(`🔍 Fetching OpenGraph via proxy: ${proxyUrl}`);
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (response.ok) {
          const result = await response.text();
          // Handle different proxy response formats
          if (result.includes('contents')) {
            const parsed = JSON.parse(result);
            return parsed.contents || parsed.data;
          }
          return result;
        }
      } catch (error) {
        console.warn(`Proxy failed:`, error);
        continue;
      }
    }
    return null;
  }

  async getTelegramOpenGraphData(telegramUrl: string): Promise<TelegramOpenGraphData> {
    if (!telegramUrl || !telegramUrl.includes('t.me')) {
      return {};
    }

    // Check cache first
    const cached = this.cache.get(telegramUrl);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      console.log('📋 Using cached OpenGraph data for:', telegramUrl);
      return cached.data;
    }

    try {
      console.log('🔄 Fetching OpenGraph data for:', telegramUrl);
      
      // Try new batch API first
      try {
        const groupInfo = await telegramBatchService.getGroupInfo(telegramUrl);
        
        if (!groupInfo.error) {
          const openGraphData: TelegramOpenGraphData = {
            title: groupInfo.title,
            description: groupInfo.about,
            image: groupInfo.photo_url,
            url: telegramUrl
          };

          // Cache the result
          this.cache.set(telegramUrl, {
            data: openGraphData,
            timestamp: Date.now(),
            success: !!openGraphData.image
          });

          this.cleanCache();
          console.log('✅ OpenGraph data fetched via batch API:', openGraphData);
          return openGraphData;
        } else {
          console.warn('⚠️ Batch API returned error, falling back to proxy:', groupInfo.error);
        }
      } catch (error) {
        console.warn('⚠️ Batch API failed, falling back to proxy:', error);
      }

      // Fallback to proxy services
      const html = await this.fetchWithProxy(telegramUrl);
      if (!html) {
        throw new Error('Failed to fetch page content');
      }

      const openGraphData = this.parseOpenGraphData(html);
      
      // Cache the result
      this.cache.set(telegramUrl, {
        data: openGraphData,
        timestamp: Date.now(),
        success: !!openGraphData.image
      });

      this.cleanCache();

      console.log('✅ OpenGraph data fetched via proxy:', openGraphData);
      return openGraphData;

    } catch (error) {
      console.warn('❌ Failed to fetch OpenGraph data for:', telegramUrl, error);
      
      // Cache empty result to avoid repeated failures
      this.cache.set(telegramUrl, {
        data: {},
        timestamp: Date.now(),
        success: false
      });

      return {};
    }
  }

  async getTelegramGroupImage(telegramUrl: string): Promise<string | null> {
    const openGraphData = await this.getTelegramOpenGraphData(telegramUrl);
    return openGraphData.image || null;
  }

  // Generate fallback image URL for groups without images
  generateFallbackImageUrl(groupName: string): string {
    return telegramBatchService.generateFallbackImageUrl(groupName);
  }

  // Clear cache manually
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ Telegram OpenGraph cache cleared');
  }

  // Get cache stats
  getCacheStats(): { size: number; successRate: number } {
    const successfulEntries = Array.from(this.cache.values()).filter(entry => entry.success);
    return {
      size: this.cache.size,
      successRate: this.cache.size > 0 ? (successfulEntries.length / this.cache.size) * 100 : 0
    };
  }
}

export const telegramOpenGraphService = new TelegramOpenGraphService();