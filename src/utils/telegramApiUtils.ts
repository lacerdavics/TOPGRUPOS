/**
 * Utility functions for working with the Telegram API integration
 */

import { telegramApiService } from '@/services/telegramApiService';

/**
 * Validate if a Telegram URL is properly formatted
 */
export const validateTelegramUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL é obrigatória' };
  }

  const trimmedUrl = url.trim();
  
  if (!trimmedUrl) {
    return { isValid: false, error: 'URL não pode estar vazia' };
  }

  // Check if it's a valid Telegram URL using the service
  if (!telegramApiService.isValidTelegramUrl(trimmedUrl)) {
    return { 
      isValid: false, 
      error: 'URL inválida. Use formatos como: https://t.me/grupo ou https://t.me/+codigo'
    };
  }

  return { isValid: true };
};

/**
 * Extract group identifier from Telegram URL
 */
export const extractGroupIdentifier = (telegramUrl: string): string | null => {
  return telegramApiService.extractGroupNameFromUrl(telegramUrl);
};

/**
 * Format Telegram URL to ensure it's complete
 */
export const formatTelegramUrl = (url: string): string => {
  if (!url) return '';
  
  const trimmed = url.trim();
  
  // If already complete, return as is
  if (trimmed.startsWith('http')) {
    return trimmed;
  }
  
  // If starts with t.me, add https://
  if (trimmed.startsWith('t.me/')) {
    return `https://${trimmed}`;
  }
  
  // If just the group name, construct full URL
  if (!trimmed.includes('/')) {
    return `https://t.me/${trimmed}`;
  }
  
  return trimmed;
};

/**
 * Parse batch upload file content
 */
export const parseBatchFile = (fileContent: string): Array<{ url: string; category: string; line: number }> => {
  const lines = fileContent.split('\n');
  const parsed = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) continue;
    
    // Expected format: https://t.me/grupo | categoria: nome-categoria
    const parts = line.split('|').map(p => p.trim());
    
    if (parts.length !== 2) {
      console.warn(`Linha ${i + 1} inválida: ${line}`);
      continue;
    }
    
    const [url, categoryPart] = parts;
    const category = categoryPart.replace(/^categoria:\s*/, '').trim();
    
    // Validate URL
    const urlValidation = validateTelegramUrl(url);
    if (!urlValidation.isValid) {
      console.warn(`URL inválida na linha ${i + 1}: ${url} - ${urlValidation.error}`);
      continue;
    }
    
    // Validate category
    if (!category) {
      console.warn(`Categoria inválida na linha ${i + 1}: ${categoryPart}`);
      continue;
    }
    
    parsed.push({
      url: formatTelegramUrl(url),
      category,
      line: i + 1
    });
  }
  
  return parsed;
};

/**
 * Generate example batch file content
 */
export const generateBatchFileExample = (): string => {
  return `# Exemplo de arquivo para importação em lote
# Formato: URL_DO_TELEGRAM | categoria: NOME_DA_CATEGORIA
# Uma linha por grupo

https://t.me/exemplogrupo1 | categoria: amizade
https://t.me/exemplogrupo2 | categoria: tecnologia
https://t.me/+AbCdEfGhIjKlMnOp | categoria: educacao
https://t.me/joinchat/AbCdEfGhIjKlMnOp | categoria: entretenimento

# Categorias disponíveis:
# amizade, namoro, filmes-series, cidades, cursos, compra-venda,
# ofertas-cupons, ganhar-dinheiro, criptomoedas, culinaria-receitas,
# concursos, desenhos-animes, divulgacao, empreendedorismo,
# educacao, esportes, futebol, sorteios-premiacoes, adulto
`;
};

/**
 * Validate batch file format
 */
export const validateBatchFile = (file: File): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validEntries: number;
}> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const errors: string[] = [];
      const warnings: string[] = [];
      let validEntries = 0;
      
      try {
        const parsed = parseBatchFile(content);
        validEntries = parsed.length;
        
        if (validEntries === 0) {
          errors.push('Nenhuma entrada válida encontrada no arquivo');
        }
        
        if (validEntries > 50) {
          warnings.push(`Arquivo contém ${validEntries} entradas. Máximo recomendado: 50`);
        }
        
        // Check for duplicate URLs
        const urls = parsed.map(p => p.url);
        const uniqueUrls = new Set(urls);
        if (urls.length !== uniqueUrls.size) {
          warnings.push('URLs duplicadas encontradas no arquivo');
        }
        
      } catch (error) {
        errors.push('Erro ao processar arquivo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      }
      
      resolve({
        isValid: errors.length === 0,
        errors,
        warnings,
        validEntries
      });
    };
    
    reader.onerror = () => {
      resolve({
        isValid: false,
        errors: ['Erro ao ler arquivo'],
        warnings: [],
        validEntries: 0
      });
    };
    
    reader.readAsText(file);
  });
};

/**
 * Download example batch file
 */
export const downloadBatchFileExample = (): void => {
  const content = generateBatchFileExample();
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'exemplo-importacao-grupos.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};