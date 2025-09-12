// Service to fetch Telegram group/channel information using batch API

interface TelegramGroupInfo {
  title?: string;
  photo_url?: string;
  about?: string;
  error?: string;
  is_valid_for_registration?: boolean;
  has_custom_image?: boolean;
}

interface BatchApiResponse {
  [telegramUrl: string]: TelegramGroupInfo;
}

interface CachedGroupInfo {
  data: TelegramGroupInfo;
  timestamp: number;
  success: boolean;
}

class TelegramBatchService {
  private cache = new Map<string, CachedGroupInfo>();
  private readonly CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours
  private readonly MAX_CACHE_SIZE = 1000;
  private readonly API_ENDPOINT = 'https://api-puxar-dados-do-telegram.onrender.com/analyze';

  // Pendding requests to avoid duplicate API calls for same URLs
  private pendingRequests = new Map<string, Promise<TelegramGroupInfo>>();

  private cleanCache() {
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.2));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  private normalizeUrl(telegramUrl: string): string {
    // Normalize Telegram URLs to ensure consistent caching
    if (!telegramUrl || !telegramUrl.includes('t.me')) {
      return telegramUrl;
    }

    try {
      const url = new URL(telegramUrl);
      // Remove tracking parameters and normalize
      return `https://t.me${url.pathname}`;
    } catch {
      return telegramUrl;
    }
  }

  private async callBatchApi(telegramUrls: string[]): Promise<BatchApiResponse> {
    console.log('📡 Calling API for', telegramUrls.length, 'URLs');
    
    try {
      const results: BatchApiResponse = {};
      
      // Faz chamadas individuais para cada URL usando o endpoint /analyze
      for (const url of telegramUrls) {
        try {
          console.log('🔍 Analyzing URL:', url);
          
          const response = await fetch(this.API_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ url: url }),
            signal: AbortSignal.timeout(60000)
          });

          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
          }

          const apiResult = await response.json();
          console.log('✅ API response received:', apiResult);
          
          if (apiResult.success) {
            // Converte a resposta da API para o formato esperado
            const groupInfo: TelegramGroupInfo = {
              title: apiResult.open_graph?.title,
              photo_url: apiResult.open_graph?.image,
              about: apiResult.open_graph?.description,
              is_valid_for_registration: apiResult.is_valid_for_registration,
              has_custom_image: apiResult.open_graph?.has_custom_image
            };
            
            // Se não tem imagem personalizada, não incluir a imagem
            if (!apiResult.is_valid_for_registration) {
              groupInfo.photo_url = undefined;
            }
            
            results[url] = groupInfo;
          } else {
            results[url] = { error: apiResult.error || 'Failed to get group info' };
          }
          
        } catch (error) {
          console.error(`❌ Error for ${url}:`, error);
          results[url] = { 
            error: `Failed to fetch group info: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Batch API call failed:', error);
      throw error;
    }
  }

  async getGroupInfo(telegramUrl: string): Promise<TelegramGroupInfo> {
    const normalizedUrl = this.normalizeUrl(telegramUrl);
    
    if (!normalizedUrl || !normalizedUrl.includes('t.me')) {
      return { error: 'Invalid Telegram URL' };
    }

    // Check cache first
    const cached = this.cache.get(normalizedUrl);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      console.log('📋 Using cached data for:', normalizedUrl);
      return cached.data;
    }

    // Check if request is already pending
    const pendingRequest = this.pendingRequests.get(normalizedUrl);
    if (pendingRequest) {
      console.log('⏳ Waiting for pending request:', normalizedUrl);
      return pendingRequest;
    }

    // Create new request
    const requestPromise = this.fetchSingleGroup(normalizedUrl);
    this.pendingRequests.set(normalizedUrl, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(normalizedUrl);
    }
  }

  private async fetchSingleGroup(normalizedUrl: string): Promise<TelegramGroupInfo> {
    try {
      const response = await this.callBatchApi([normalizedUrl]);
      const groupInfo = response[normalizedUrl] || { error: 'No data returned from API' };

      // Cache the result
      this.cache.set(normalizedUrl, {
        data: groupInfo,
        timestamp: Date.now(),
        success: !groupInfo.error
      });

      this.cleanCache();
      return groupInfo;
    } catch (error) {
      const errorInfo: TelegramGroupInfo = { 
        error: `Failed to fetch group info: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };

      // Cache error result to avoid repeated failures
      this.cache.set(normalizedUrl, {
        data: errorInfo,
        timestamp: Date.now(),
        success: false
      });

      return errorInfo;
    }
  }

  async getMultipleGroupsInfo(telegramUrls: string[]): Promise<BatchApiResponse> {
    if (!telegramUrls || telegramUrls.length === 0) {
      return {};
    }

    const normalizedUrls = telegramUrls.map(url => this.normalizeUrl(url));
    const result: BatchApiResponse = {};
    const urlsToFetch: string[] = [];

    // Check cache for each URL
    for (const url of normalizedUrls) {
      if (!url || !url.includes('t.me')) {
        result[url] = { error: 'Invalid Telegram URL' };
        continue;
      }

      const cached = this.cache.get(url);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        console.log('📋 Using cached data for:', url);
        result[url] = cached.data;
      } else {
        urlsToFetch.push(url);
      }
    }

    // Fetch uncached URLs in batch
    if (urlsToFetch.length > 0) {
      try {
        console.log('🔄 Fetching', urlsToFetch.length, 'URLs from API');
        const batchResponse = await this.callBatchApi(urlsToFetch);

        // Process and cache results
        for (const url of urlsToFetch) {
          const groupInfo = batchResponse[url] || { error: 'No data returned from API' };
          
          // Cache the result
          this.cache.set(url, {
            data: groupInfo,
            timestamp: Date.now(),
            success: !groupInfo.error
          });

          result[url] = groupInfo;
        }

        this.cleanCache();
      } catch (error) {
        console.error('❌ Batch API failed:', error);
        
        // Add error results for uncached URLs
        for (const url of urlsToFetch) {
          const errorInfo: TelegramGroupInfo = { 
            error: `Failed to fetch group info: ${error instanceof Error ? error.message : 'Unknown error'}` 
          };
          
          // Cache error result
          this.cache.set(url, {
            data: errorInfo,
            timestamp: Date.now(),
            success: false
          });

          result[url] = errorInfo;
        }
      }
    }

    return result;
  }

  // Generate fallback image URL for groups without images
  generateFallbackImageUrl(groupName: string): string {
    try {
      // Sanitize the group name to avoid URI encoding issues
      const sanitizedName = groupName
        .replace(/[^\w\s]/g, '') // Remove special characters
        .trim();
      
      if (!sanitizedName) {
        return `https://ui-avatars.com/api/?name=TG&size=400&background=1D4ED8&color=ffffff&font-size=0.4&bold=true`;
      }
      
      const initials = sanitizedName
        .split(' ')
        .filter(word => word.length > 0)
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 2);
      
      // Fallback to 'TG' if no valid initials found
      const safeInitials = initials || 'TG';
      
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(safeInitials)}&size=400&background=1D4ED8&color=ffffff&font-size=0.4&bold=true`;
    } catch (error) {
      console.warn('Failed to generate fallback image URL:', error);
      return `https://ui-avatars.com/api/?name=TG&size=400&background=1D4ED8&color=ffffff&font-size=0.4&bold=true`;
    }
  }

  // Extract title, handling fallbacks
  getTitle(groupInfo: TelegramGroupInfo, telegramUrl: string): string {
    if (groupInfo.title && groupInfo.title.trim()) {
      return groupInfo.title.trim();
    }

    // Extract name from URL as fallback
    try {
      const url = new URL(telegramUrl);
      const path = url.pathname;
      
      if (path.includes('/joinchat/')) {
        return 'Grupo Privado';
      } else if (path.startsWith('/+')) {
        return 'Grupo Privado';
      } else if (path.startsWith('/')) {
        const name = path.substring(1);
        return name || 'Grupo do Telegram';
      }
    } catch {
      // Ignore URL parsing errors
    }

    return 'Grupo do Telegram';
  }

  // Get image URL with fallback
  getImageUrl(groupInfo: TelegramGroupInfo, groupName: string): string {
    if (groupInfo.photo_url && groupInfo.photo_url.trim()) {
      return groupInfo.photo_url.trim();
    }

    return this.generateFallbackImageUrl(groupName);
  }

  // Get description with fallback
  getDescription(groupInfo: TelegramGroupInfo): string {
    if (groupInfo.about && groupInfo.about.trim()) {
      return groupInfo.about.trim();
    }

    return 'Descrição não disponível';
  }

  // Force refresh - ignores cache and fetches fresh data
  async forceRefreshGroupInfo(telegramUrl: string): Promise<TelegramGroupInfo> {
    console.log('🔄 Force refreshing data for:', telegramUrl);
    const normalizedUrl = this.normalizeUrl(telegramUrl);
    
    if (!normalizedUrl || !normalizedUrl.includes('t.me')) {
      return { error: 'Invalid Telegram URL' };
    }

    // Clear cached data for this URL
    this.cache.delete(normalizedUrl);
    
    // Clear any pending requests for this URL
    this.pendingRequests.delete(normalizedUrl);
    
    // Fetch fresh data
    return this.getGroupInfo(normalizedUrl);
  }

  // Clear cache manually
  clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    console.log('🗑️ Telegram batch service cache cleared');
  }

  // Get cache stats
  getCacheStats(): { size: number; successRate: number; pendingRequests: number } {
    const successfulEntries = Array.from(this.cache.values()).filter(entry => entry.success);
    return {
      size: this.cache.size,
      successRate: this.cache.size > 0 ? (successfulEntries.length / this.cache.size) * 100 : 0,
      pendingRequests: this.pendingRequests.size
    };
  }
}

export const telegramBatchService = new TelegramBatchService();