/**
 * High-level integration service that combines all Telegram API functionality
 * Updated to use Flask backend with proper error handling and retry logic
 */

import { telegramApiService } from './telegramApiService';
import { cacheAwareGroupService } from './cacheAwareGroupService';

interface IntegrationConfig {
  respectCache: boolean;
  validateImages: boolean;
  autoUploadImages: boolean;
  enableBatchProcessing: boolean;
  maxBatchSize: number;
}

interface GroupRegistrationResult {
  success: boolean;
  groupId?: string;
  message: string;
  cacheUsed: boolean;
  imageProcessed: boolean;
  validationPassed: boolean;
}

class TelegramApiIntegration {
  private config: IntegrationConfig = {
    respectCache: true,
    validateImages: true,
    autoUploadImages: true,
    enableBatchProcessing: true,
    maxBatchSize: 50
  };

  /**
   * Configure integration behavior
   */
  configure(newConfig: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Telegram API integration configured:', this.config);
  }

  /**
   * Register a single group with full validation and cache respect
   */
  async registerGroup(
    telegramUrl: string,
    category: string,
    userId?: string,
    userEmail?: string
  ): Promise<GroupRegistrationResult> {
    console.log(`📝 Registering group: ${telegramUrl} -> ${category}`);

    try {
      // Validate URL format first
      if (!telegramApiService.isValidTelegramUrl(telegramUrl)) {
        return {
          success: false,
          message: 'URL do Telegram inválida',
          cacheUsed: false,
          imageProcessed: false,
          validationPassed: false
        };
      }

      // Process the group with cache awareness
      const result = await cacheAwareGroupService.processGroup(
        telegramUrl,
        category,
        userId,
        userEmail
      );

      if (!result.success) {
        return {
          success: false,
          message: result.error || 'Falha no processamento do grupo',
          cacheUsed: result.cacheStatus === 'hit',
          imageProcessed: false,
          validationPassed: false
        };
      }

      // Handle different cache statuses
      let message = '';
      switch (result.cacheStatus) {
        case 'hit':
          message = 'Grupo processado usando dados do cache';
          break;
        case 'updated':
          message = 'Grupo processado com novos dados (cache atualizado)';
          break;
        case 'skipped':
          message = 'Grupo já processado anteriormente, nenhuma mudança detectada';
          break;
        default:
          message = 'Grupo processado com sucesso';
      }

      return {
        success: true,
        groupId: result.groupId,
        message,
        cacheUsed: result.cacheStatus === 'hit' || result.cacheStatus === 'skipped',
        imageProcessed: !!result.data?.imageUrl,
        validationPassed: result.shouldStore
      };

    } catch (error) {
      console.error('❌ Group registration failed:', error);
      
      return {
        success: false,
        message: 'Erro ao carregar dados do Telegram. Tente novamente.',
        cacheUsed: false,
        imageProcessed: false,
        validationPassed: false
      };
    }
  }

  /**
   * Batch register groups with intelligent processing
   */
  async batchRegisterGroups(
    groupsData: Array<{ url: string; category: string }>,
    userId?: string,
    userEmail?: string,
    onProgress?: (current: number, total: number, result: GroupRegistrationResult) => void
  ): Promise<{
    results: GroupRegistrationResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      cacheHits: number;
      imagesProcessed: number;
    };
  }> {
    console.log(`🚀 Starting batch registration of ${groupsData.length} groups`);

    if (groupsData.length > this.config.maxBatchSize) {
      throw new Error(`Batch size exceeds maximum allowed (${this.config.maxBatchSize})`);
    }

    const results: GroupRegistrationResult[] = [];
    const summary = {
      total: groupsData.length,
      successful: 0,
      failed: 0,
      cacheHits: 0,
      imagesProcessed: 0
    };

    for (let i = 0; i < groupsData.length; i++) {
      const { url, category } = groupsData[i];
      
      try {
        console.log(`📝 Processing ${i + 1}/${groupsData.length}: ${url}`);
        
        const result = await this.registerGroup(url, category, userId, userEmail);
        results.push(result);

        // Update summary
        if (result.success) {
          summary.successful++;
        } else {
          summary.failed++;
        }

        if (result.cacheUsed) {
          summary.cacheHits++;
        }

        if (result.imageProcessed) {
          summary.imagesProcessed++;
        }

        // Call progress callback
        onProgress?.(i + 1, groupsData.length, result);

        // Respectful delay between requests
        if (i < groupsData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

      } catch (error) {
        console.error(`❌ Batch processing error for ${url}:`, error);
        
        const errorResult: GroupRegistrationResult = {
          success: false,
          message: 'Erro ao carregar dados do Telegram. Tente novamente.',
          cacheUsed: false,
          imageProcessed: false,
          validationPassed: false
        };

        results.push(errorResult);
        summary.failed++;
      }
    }

    console.log(`✅ Batch registration completed:`, summary);
    return { results, summary };
  }

  /**
   * Refresh group data if content has changed
   */
  async refreshGroupData(telegramUrl: string): Promise<{
    wasRefreshed: boolean;
    message: string;
    changes?: string[];
  }> {
    console.log(`🔄 Checking for group data changes: ${telegramUrl}`);

    try {
      const refreshResult = await cacheAwareGroupService.refreshGroupIfChanged(telegramUrl);
      
      if (!refreshResult.wasUpdated) {
        return {
          wasRefreshed: false,
          message: 'Nenhuma mudança detectada nos dados do grupo'
        };
      }

      const changes: string[] = [];
      if (refreshResult.changes?.contentChanged) {
        changes.push('Conteúdo atualizado');
      }
      if (refreshResult.changes?.imageChanged) {
        changes.push('Imagem atualizada');
      }

      return {
        wasRefreshed: true,
        message: `Dados do grupo atualizados: ${changes.join(', ')}`,
        changes
      };

    } catch (error) {
      console.error('❌ Error refreshing group data:', error);
      return {
        wasRefreshed: false,
        message: 'Erro ao carregar dados do Telegram. Tente novamente.'
      };
    }
  }

  /**
   * Validate image URL using the API
   */
  async validateImageUrl(imageUrl: string): Promise<{
    isValid: boolean;
    isGeneric: boolean;
    shouldUse: boolean;
    details: string;
  }> {
    try {
      const validation = await telegramApiService.validateImageUrl(imageUrl);
      
      return {
        isValid: validation.is_valid,
        isGeneric: validation.is_generic,
        shouldUse: validation.is_valid && !validation.is_generic,
        details: `Format: ${validation.validation_details.format}, ` +
                `Size: ${(validation.validation_details.size_bytes / 1024).toFixed(2)}KB, ` +
                `Dimensions: ${validation.validation_details.dimensions.join('x')}`
      };
    } catch (error) {
      console.error('❌ Image validation failed:', error);
      return {
        isValid: false,
        isGeneric: true,
        shouldUse: false,
        details: 'Erro ao carregar dados do Telegram. Tente novamente.'
      };
    }
  }

  /**
   * Get comprehensive service status
   */
  async getServiceStatus(): Promise<{
    api: {
      healthy: boolean;
      upstash: boolean;
      lastCheck: Date;
    };
    cache: {
      totalKeys: number;
      memoryUsage: string;
    };
    processing: {
      totalProcessed: number;
      cacheHitRate: number;
      lastProcessed?: Date;
    };
  }> {
    try {
      const [healthData, cacheStats, processingStats] = await Promise.all([
        telegramApiService.getHealthStatus(),
        telegramApiService.getCacheStatistics(),
        Promise.resolve(cacheAwareGroupService.getProcessingStats())
      ]);

      return {
        api: {
          healthy: healthData.status === 'healthy',
          upstash: healthData.redis_status === 'connected' || healthData.upstash_status === 'connected',
          lastCheck: new Date(healthData.timestamp)
        },
        cache: {
          totalKeys: cacheStats.total_keys,
          memoryUsage: cacheStats.memory_usage
        },
        processing: processingStats
      };
    } catch (error) {
      console.error('❌ Error getting service status:', error);
      throw new Error('Erro ao carregar dados do Telegram. Tente novamente.');
    }
  }

  /**
   * Utility method for UI components to show user-friendly messages
   */
  getStatusMessage(result: GroupRegistrationResult): { title: string; description: string; variant: 'default' | 'destructive' } {
    if (result.success) {
      let description = result.message;
      
      if (result.cacheUsed) {
        description += ' (dados do cache)';
      }
      
      if (result.imageProcessed) {
        description += ' • Imagem processada';
      }

      return {
        title: '✅ Grupo cadastrado com sucesso!',
        description,
        variant: 'default'
      };
    } else {
      return {
        title: '❌ Erro no cadastro',
        description: result.message,
        variant: 'destructive'
      };
    }
  }

  /**
   * Keep API alive to prevent cold starts
   */
  async maintainApiConnection(): Promise<void> {
    try {
      await telegramApiService.keepAlive();
      console.log('💓 API keepalive successful');
    } catch (error) {
      console.warn('⚠️ API keepalive failed:', error);
    }
  }

  /**
   * Clear all caches (use with caution)
   */
  clearAllCaches(): void {
    cacheAwareGroupService.clearProcessingCache();
    telegramApiService.clearPendingRequests();
    console.log('🧹 All caches cleared');
  }
}

export const telegramApiIntegration = new TelegramApiIntegration();

// Auto-configure for production use
telegramApiIntegration.configure({
  respectCache: true,
  validateImages: true,
  autoUploadImages: true,
  enableBatchProcessing: true,
  maxBatchSize: 30
});

// Keep API alive every 10 minutes to prevent cold starts
if (typeof window !== 'undefined') {
  setInterval(() => {
    telegramApiIntegration.maintainApiConnection();
  }, 10 * 60 * 1000);
}