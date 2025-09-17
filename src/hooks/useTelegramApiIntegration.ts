/**
 * React hook for using Telegram API integration
 */

import { useState, useCallback } from 'react';
import { telegramApiIntegration } from '@/services/telegramApiIntegration';
import { toast } from 'sonner';

interface UseTelegramApiResult {
  // Single group processing
  registerGroup: (telegramUrl: string, category: string, userId?: string, userEmail?: string) => Promise<boolean>;
  refreshGroup: (telegramUrl: string) => Promise<boolean>;
  validateImage: (imageUrl: string) => Promise<boolean>;
  
  // Batch processing
  batchRegisterGroups: (
    groups: Array<{ url: string; category: string }>,
    userId?: string,
    userEmail?: string,
    onProgress?: (current: number, total: number) => void
  ) => Promise<{ successful: number; failed: number }>;
  
  // Status and monitoring
  getServiceStatus: () => Promise<any>;
  
  // Loading states
  isProcessing: boolean;
  isBatchProcessing: boolean;
  batchProgress: { current: number; total: number };
}

export const useTelegramApiIntegration = (): UseTelegramApiResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  const registerGroup = useCallback(async (
    telegramUrl: string,
    category: string,
    userId?: string,
    userEmail?: string
  ): Promise<boolean> => {
    setIsProcessing(true);
    
    try {
      console.log(`🔄 Registering group via API integration: ${telegramUrl}`);
      
      const result = await telegramApiIntegration.registerGroup(
        telegramUrl,
        category,
        userId,
        userEmail
      );

      // Show appropriate toast message
      const statusMessage = telegramApiIntegration.getStatusMessage(result);
      
      if (result.success) {
        toast.success(statusMessage.title, {
          description: statusMessage.description
        });
      } else {
        toast.error(statusMessage.title, {
          description: statusMessage.description
        });
      }

      return result.success;

    } catch (error) {
      console.error('❌ Group registration error:', error);
      toast.error('Erro no cadastro', {
        description: 'Erro ao carregar dados do Telegram. Tente novamente.'
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const refreshGroup = useCallback(async (telegramUrl: string): Promise<boolean> => {
    setIsProcessing(true);
    
    try {
      console.log(`🔄 Refreshing group data: ${telegramUrl}`);
      
      const result = await telegramApiIntegration.refreshGroupData(telegramUrl);
      
      if (result.wasRefreshed) {
        toast.success('Dados atualizados!', {
          description: result.message
        });
      } else {
        toast.info('Nenhuma atualização necessária', {
          description: result.message
        });
      }

      return result.wasRefreshed;

    } catch (error) {
      console.error('❌ Group refresh error:', error);
      toast.error('Erro ao atualizar', {
        description: 'Erro ao carregar dados do Telegram. Tente novamente.'
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const validateImage = useCallback(async (imageUrl: string): Promise<boolean> => {
    try {
      console.log(`🖼️ Validating image: ${imageUrl}`);
      
      const result = await telegramApiIntegration.validateImageUrl(imageUrl);
      
      if (result.shouldUse) {
        toast.success('Imagem válida!', {
          description: result.details
        });
      } else if (result.isGeneric) {
        toast.warning('Imagem genérica detectada', {
          description: 'Esta imagem não será armazenada por ser genérica'
        });
      } else {
        toast.error('Imagem inválida', {
          description: result.details
        });
      }

      return result.shouldUse;

    } catch (error) {
      console.error('❌ Image validation error:', error);
      toast.error('Erro na validação', {
        description: 'Erro ao carregar dados do Telegram. Tente novamente.'
      });
      return false;
    }
  }, []);

  const batchRegisterGroups = useCallback(async (
    groups: Array<{ url: string; category: string }>,
    userId?: string,
    userEmail?: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<{ successful: number; failed: number }> => {
    setIsBatchProcessing(true);
    setBatchProgress({ current: 0, total: groups.length });
    
    try {
      console.log(`🚀 Starting batch registration of ${groups.length} groups`);
      
      const result = await telegramApiIntegration.batchRegisterGroups(
        groups,
        userId,
        userEmail,
        (current, total, groupResult) => {
          setBatchProgress({ current, total });
          onProgress?.(current, total);
          
          // Show individual result toasts for important events
          if (!groupResult.success && !groupResult.message.includes('generic')) {
            console.warn(`⚠️ Group ${current}/${total} failed:`, groupResult.message);
          }
        }
      );

      // Show final summary
      toast.success('Importação em lote concluída!', {
        description: `${result.summary.successful} grupos importados com sucesso, ${result.summary.failed} falharam`
      });

      return {
        successful: result.summary.successful,
        failed: result.summary.failed
      };

    } catch (error) {
      console.error('❌ Batch registration error:', error);
      toast.error('Erro na importação em lote', {
        description: 'Erro ao carregar dados do Telegram. Tente novamente.'
      });
      return { successful: 0, failed: groups.length };
    } finally {
      setIsBatchProcessing(false);
      setBatchProgress({ current: 0, total: 0 });
    }
  }, []);

  const getServiceStatus = useCallback(async () => {
    try {
      return await telegramApiIntegration.getServiceStatus();
    } catch (error) {
      console.error('❌ Error getting service status:', error);
      throw error;
    }
  }, []);

  return {
    registerGroup,
    refreshGroup,
    validateImage,
    batchRegisterGroups,
    getServiceStatus,
    isProcessing,
    isBatchProcessing,
    batchProgress
  };
};