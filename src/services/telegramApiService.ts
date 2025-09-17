/**
 * Flask backend integration for Telegram data
 * Uses Flask /analyze endpoint instead of external API
 */

interface TelegramAnalyzeResponse {
  success: boolean;
  url: string;
  from_cache: boolean;
  content_hash: string;
  image_hash?: string;
  open_graph: {
    title?: string;
    description?: string;
    image?: string;
    has_custom_image: boolean;
  };
  is_valid_for_registration: boolean;
  error?: string;
  cache_info?: {
    cached_at: string;
    expires_at?: string;
  };
}

interface ImageValidationResponse {
  success: boolean;
  image_url: string;
  is_valid: boolean;
  is_generic: boolean;
  from_cache: boolean;
  validation_details: {
    format: string;
    size_bytes: number;
    dimensions: [number, number];
    is_telegram_generic: boolean;
    is_ui_avatar: boolean;
  };
  error?: string;
}

interface HealthResponse {
  status: string;
  redis_status: string;
  cache_stats: {
    total_keys: number;
    memory_usage: string;
  };
  api_version: string;
  timestamp: string;
  upstash_status?: string;
}

class TelegramApiService {
  private readonly FLASK_BASE_URL = 'https://api-puxar-dados-do-telegram.onrender.com';
  private readonly REQUEST_TIMEOUT = 60000; // 60 seconds
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds

  // Local cache to avoid duplicate requests
  private pendingRequests = new Map<string, Promise<any>>();
  private lastHealthCheck = 0;
  private isServiceHealthy = true;

  /**
   * Check Flask backend health
   */
  private async checkHealth(): Promise<boolean> {
    const now = Date.now();
    
    // Check health every 2 minutes
    if (now - this.lastHealthCheck < 2 * 60 * 1000 && this.isServiceHealthy) {
      return true;
    }

    try {
      console.log('🏥 Checking Flask backend health...');
      
      const response = await fetch(`${this.FLASK_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout for health check
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const healthData: HealthResponse = await response.json();
      
      this.isServiceHealthy = healthData.status === 'healthy';
      this.lastHealthCheck = now;

      if (this.isServiceHealthy) {
        console.log(`✅ Flask backend is healthy`);
      } else {
        console.warn('⚠️ Flask backend health issues:', healthData);
      }

      return this.isServiceHealthy;
    } catch (error) {
      console.error('❌ Flask health check failed:', error);
      this.isServiceHealthy = false;
      return false;
    }
  }

  /**
   * Make request to Flask backend with retry logic
   */
  private async makeFlaskRequest<T>(
    endpoint: string, 
    options: RequestInit,
    skipHealthCheck = false
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(`🔄 Flask request attempt ${attempt}/${this.RETRY_ATTEMPTS} for ${endpoint}`);

        const response = await fetch(`${this.FLASK_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
          },
          signal: AbortSignal.timeout(this.REQUEST_TIMEOUT)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Flask request successful for ${endpoint}`);
        return data;

      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Flask attempt ${attempt} failed for ${endpoint}:`, error);

        // Don't retry on certain errors
        if (error instanceof Error) {
          if (error.name === 'AbortError' || 
              error.message.includes('400') || 
              error.message.includes('404')) {
            break;
          }
        }

        // Wait before retry (except on last attempt)
        if (attempt < this.RETRY_ATTEMPTS) {
          console.log(`⏳ Waiting ${this.RETRY_DELAY}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }

    throw new Error('Erro ao carregar dados do Telegram. Tente novamente.');
  }

  /**
   * Analyze Telegram URL using Flask /analyze endpoint
   */
  async analyzeTelegramUrl(telegramUrl: string): Promise<TelegramAnalyzeResponse> {
    if (!telegramUrl || !telegramUrl.includes('t.me')) {
      throw new Error('URL do Telegram inválida');
    }

    // Ensure complete URL format
    const completeUrl = telegramUrl.startsWith('http') ? telegramUrl : `https://${telegramUrl}`;
    
    console.log(`🔍 Analyzing Telegram URL via Flask: ${completeUrl}`);

    // Check for pending request to avoid duplicates
    const requestKey = `analyze_${completeUrl}`;
    if (this.pendingRequests.has(requestKey)) {
      console.log('⏳ Waiting for pending analyze request...');
      return this.pendingRequests.get(requestKey)!;
    }

    const requestPromise = this.makeFlaskRequest<TelegramAnalyzeResponse>('/analyze', {
      method: 'POST',
      body: JSON.stringify({ url: completeUrl })
    });

    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      
      if (result.from_cache) {
        console.log(`📋 Dados obtidos do cache Flask para: ${completeUrl}`);
        console.log(`🔑 Content hash: ${result.content_hash}`);
        if (result.image_hash) {
          console.log(`🖼️ Image hash: ${result.image_hash}`);
        }
      } else {
        console.log(`🆕 Dados frescos analisados pelo Flask: ${completeUrl}`);
        console.log(`🔑 Novo content hash: ${result.content_hash}`);
        if (result.image_hash) {
          console.log(`🖼️ Novo image hash: ${result.image_hash}`);
        }
      }

      return result;
    } catch (error) {
      console.error('❌ Erro na chamada Flask:', error);
      throw error;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Validate image URL using Flask backend
   */
  async validateImageUrl(imageUrl: string): Promise<ImageValidationResponse> {
    if (!imageUrl || !imageUrl.startsWith('http')) {
      throw new Error('URL de imagem inválida');
    }

    console.log(`🖼️ Validating image URL via Flask: ${imageUrl}`);

    // Check for pending request to avoid duplicates
    const requestKey = `validate_${imageUrl}`;
    if (this.pendingRequests.has(requestKey)) {
      console.log('⏳ Waiting for pending validation request...');
      return this.pendingRequests.get(requestKey)!;
    }

    const requestPromise = this.makeFlaskRequest<ImageValidationResponse>('/validate-image', {
      method: 'POST',
      body: JSON.stringify({ image_url: imageUrl })
    });

    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      
      if (result.from_cache) {
        console.log(`📋 Validação de imagem do cache Flask: ${imageUrl}`);
      } else {
        console.log(`🆕 Validação fresca de imagem pelo Flask: ${imageUrl}`);
      }

      console.log(`✅ Resultados da validação de imagem:`);
      console.log(`   Válida: ${result.is_valid}`);
      console.log(`   Genérica: ${result.is_generic}`);
      console.log(`   Formato: ${result.validation_details.format}`);
      console.log(`   Tamanho: ${(result.validation_details.size_bytes / 1024).toFixed(2)} KB`);

      if (result.is_generic) {
        console.warn('⚠️ Imagem genérica detectada - não deve ser armazenada');
      }

      return result;
    } catch (error) {
      console.error('❌ Erro na validação de imagem Flask:', error);
      throw error;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  /**
   * Get Flask backend health status
   */
  async getHealthStatus(): Promise<HealthResponse> {
    console.log('🏥 Getting Flask backend health status...');
    
    return this.makeFlaskRequest<HealthResponse>('/health', {
      method: 'GET'
    }, true); // Skip health check for health endpoint itself
  }

  /**
   * Keep Flask backend alive (prevent cold starts)
   */
  async keepAlive(): Promise<any> {
    console.log('💓 Sending keepalive ping to Flask...');
    
    return this.makeFlaskRequest('/health', {
      method: 'GET'
    });
  }

  /**
   * Comprehensive group analysis using Flask backend
   */
  async analyzeGroupComprehensive(telegramUrl: string): Promise<{
    groupData: TelegramAnalyzeResponse;
    imageValidation?: ImageValidationResponse;
    shouldStore: boolean;
    cacheStatus: 'hit' | 'miss' | 'updated';
  }> {
    console.log(`🔍 Starting comprehensive analysis via Flask for: ${telegramUrl}`);

    try {
      // Step 1: Analyze the Telegram URL using Flask
      const groupData = await this.analyzeTelegramUrl(telegramUrl);
      
      if (!groupData.success) {
        throw new Error(groupData.error || 'Falha ao analisar URL do Telegram');
      }

      let imageValidation: ImageValidationResponse | undefined;
      let shouldStore = false;
      let cacheStatus: 'hit' | 'miss' | 'updated' = groupData.from_cache ? 'hit' : 'miss';

      // Step 2: Validate image if present and group is valid for registration
      if (groupData.is_valid_for_registration && 
          groupData.open_graph.image && 
          groupData.open_graph.has_custom_image) {
        
        console.log('🖼️ Grupo tem imagem personalizada, validando via Flask...');
        
        try {
          imageValidation = await this.validateImageUrl(groupData.open_graph.image);
          
          // Only store if image is valid and not generic
          shouldStore = imageValidation.is_valid && !imageValidation.is_generic;
          
          if (!shouldStore) {
            console.warn('⚠️ Imagem é genérica ou inválida, não será armazenada');
          }
        } catch (imageError) {
          console.warn('⚠️ Validação de imagem falhou:', imageError);
          shouldStore = false;
        }
      } else {
        console.log('ℹ️ Grupo não válido para registro ou sem imagem personalizada');
        shouldStore = false;
      }

      // Step 3: Determine if we should update cache
      if (!groupData.from_cache) {
        cacheStatus = 'updated';
        console.log('💾 Novos dados serão cacheados pelo Flask');
      } else {
        console.log('📋 Usando cache existente do Flask');
      }

      return {
        groupData,
        imageValidation,
        shouldStore,
        cacheStatus
      };

    } catch (error) {
      console.error('❌ Análise abrangente falhou:', error);
      throw error;
    }
  }

  /**
   * Check for content changes using Flask backend
   */
  async checkForContentChanges(
    telegramUrl: string, 
    lastKnownContentHash?: string,
    lastKnownImageHash?: string
  ): Promise<{
    hasContentChanged: boolean;
    hasImageChanged: boolean;
    newData?: TelegramAnalyzeResponse;
  }> {
    console.log(`🔍 Checking for content changes via Flask: ${telegramUrl}`);
    
    if (!lastKnownContentHash) {
      console.log('ℹ️ Sem hash de conteúdo anterior, tratando como novo');
      const newData = await this.analyzeTelegramUrl(telegramUrl);
      return {
        hasContentChanged: true,
        hasImageChanged: true,
        newData
      };
    }

    try {
      const currentData = await this.analyzeTelegramUrl(telegramUrl);
      
      const hasContentChanged = currentData.content_hash !== lastKnownContentHash;
      const hasImageChanged = currentData.image_hash !== lastKnownImageHash;

      console.log(`📊 Resultados da detecção de mudanças:`);
      console.log(`   Conteúdo mudou: ${hasContentChanged}`);
      console.log(`   Imagem mudou: ${hasImageChanged}`);
      console.log(`   Do cache: ${currentData.from_cache}`);

      return {
        hasContentChanged,
        hasImageChanged,
        newData: hasContentChanged || hasImageChanged ? currentData : undefined
      };

    } catch (error) {
      console.error('❌ Erro ao verificar mudanças:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics from Flask backend
   */
  async getCacheStatistics(): Promise<{
    redis_connected: boolean;
    total_keys: number;
    memory_usage: string;
    api_healthy: boolean;
  }> {
    try {
      const health = await this.getHealthStatus();
      
      return {
        redis_connected: health.redis_status === 'connected',
        total_keys: health.cache_stats.total_keys,
        memory_usage: health.cache_stats.memory_usage,
        api_healthy: health.status === 'healthy'
      };
    } catch (error) {
      console.error('❌ Falha ao obter estatísticas do cache:', error);
      return {
        redis_connected: false,
        total_keys: 0,
        memory_usage: '0 MB',
        api_healthy: false
      };
    }
  }

  /**
   * Utility: Extract group name from Telegram URL
   */
  extractGroupNameFromUrl(telegramUrl: string): string | null {
    try {
      const url = new URL(telegramUrl);
      const path = url.pathname;
      
      if (path.includes('/joinchat/')) {
        return path.split('/joinchat/')[1];
      } else if (path.startsWith('/+')) {
        return path.substring(2); // Remove /+
      } else if (path.startsWith('/')) {
        return path.substring(1); // Remove /
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Utility: Check if URL is valid Telegram format
   */
  isValidTelegramUrl(url: string): boolean {
    if (!url) return false;
    
    try {
      const urlObj = new URL(url);
      return (urlObj.hostname === 't.me' || urlObj.hostname === 'telegram.me') &&
             urlObj.pathname.length > 1;
    } catch {
      return false;
    }
  }

  /**
   * Clear pending requests (useful for cleanup)
   */
  clearPendingRequests(): void {
    this.pendingRequests.clear();
    console.log('🧹 Cleared all pending Flask requests');
  }

  /**
   * Get service status for monitoring
   */
  getServiceStatus(): {
    isHealthy: boolean;
    lastHealthCheck: Date;
    pendingRequests: number;
  } {
    return {
      isHealthy: this.isServiceHealthy,
      lastHealthCheck: new Date(this.lastHealthCheck),
      pendingRequests: this.pendingRequests.size
    };
  }
}

export const telegramApiService = new TelegramApiService();