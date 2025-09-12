// Utility functions for group validation and sanitization
import { normalizeUnicodeText } from '@/lib/utils';

// Sanitize and validate group titles
export const sanitizeGroupTitle = (title: string): string => {
  console.log('🔍 Sanitizing title:', title);
  
  if (!title || typeof title !== 'string') {
    console.log('❌ Title is null, undefined, or not a string');
    return 'Grupo sem nome';
  }
  
  // Normalize unicode characters first, then sanitize
  const sanitized = normalizeUnicodeText(title)
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  console.log('✅ Sanitized title:', sanitized);
  
  // If title becomes empty after sanitization, provide fallback
  if (!sanitized || sanitized.length === 0) {
    console.log('❌ Title became empty after sanitization');
    return 'Grupo sem nome';
  }
  
  // Limit title length to prevent UI breaking
  const maxLength = 100; // Increased limit to be less restrictive
  if (sanitized.length > maxLength) {
    const truncated = sanitized.substring(0, maxLength).trim() + '...';
    console.log('✂️ Title truncated to:', truncated);
    return truncated;
  }
  
  return sanitized;
};

// Truncate title with better logic
export const truncateTitle = (title: string, maxLength: number = 30): string => {
  const sanitized = sanitizeGroupTitle(title);
  
  if (sanitized.length <= maxLength) {
    return sanitized;
  }
  
  // Try to break at word boundaries
  const truncated = sanitized.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > maxLength * 0.6) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
};

// Check if Telegram URL is potentially expired or invalid
export const checkTelegramUrlStatus = async (url: string): Promise<{
  isValid: boolean;
  isExpired: boolean;
  error?: string;
}> => {
  try {
    // Basic URL validation
    if (!url || typeof url !== 'string') {
      return { isValid: false, isExpired: false, error: 'URL inválida' };
    }
    
    // Check if URL format is correct
    const telegramRegex = /^https?:\/\/(t\.me|telegram\.me)\/.+/i;
    if (!telegramRegex.test(url)) {
      return { isValid: false, isExpired: false, error: 'Formato de URL inválido' };
    }
    
    // Extract username/channel from URL
    const match = url.match(/(?:t\.me|telegram\.me)\/([^\/\?]+)/i);
    if (!match) {
      return { isValid: false, isExpired: false, error: 'Não foi possível extrair informações da URL' };
    }
    
    const username = match[1];
    
    // Check for common indicators of expired/invalid links
    const suspiciousPatterns = [
      /^joinchat\/[A-Za-z0-9_-]{22}$/, // Old invite link format that might be expired
      /^\+[A-Za-z0-9_-]+$/, // New invite link format
    ];
    
    const isInviteLink = suspiciousPatterns.some(pattern => pattern.test(username));
    
    if (isInviteLink) {
      // For invite links, we can't check without actually calling Telegram API
      // But we can mark them as potentially expired if they're very old
      return {
        isValid: true,
        isExpired: false, // We can't determine this without API call
        error: 'Link de convite - verificação manual necessária'
      };
    }
    
    // For public channels/groups, basic validation passed
    return { isValid: true, isExpired: false };
    
  } catch (error) {
    console.error('Error checking Telegram URL:', error);
    return { 
      isValid: false, 
      isExpired: false, 
      error: 'Erro ao verificar URL' 
    };
  }
};

// Generate fallback avatar URL
export const generateFallbackAvatar = (name: string, size: number = 800): string => {
  try {
    const sanitizedName = sanitizeGroupTitle(name);
    
    // Extract initials safely
    const initials = sanitizedName
      .split(' ')
      .map(word => {
        // Get first character and ensure it's safe
        const firstChar = word.charAt(0);
        // Only use ASCII letters and numbers for initials
        return /[a-zA-Z0-9]/.test(firstChar) ? firstChar : '';
      })
      .filter(char => char !== '') // Remove empty chars
      .join('')
      .toUpperCase()
      .substring(0, 2);
    
    // Fallback to '?' if no valid initials found
    const safeInitials = initials || '?';
    
    // Use a variety of colors for better visual distinction
    const colors = [
      '3b82f6', '8b5cf6', 'f59e0b', 'ef4444', '10b981', 
      '6366f1', 'f97316', 'ec4899', '06b6d4', '84cc16'
    ];
    
    const colorIndex = sanitizedName.length % colors.length;
    const backgroundColor = colors[colorIndex];
    
    // Safe encode the initials
    let encodedInitials;
    try {
      encodedInitials = encodeURIComponent(safeInitials);
    } catch (encodeError) {
      console.warn('Failed to encode initials, using fallback:', encodeError);
      encodedInitials = encodeURIComponent('?');
    }
    
    return `https://ui-avatars.com/api/?name=${encodedInitials}&background=${backgroundColor}&color=ffffff&size=${size}&font-size=0.6&format=png&rounded=true&bold=true`;
  } catch (error) {
    console.warn('Error generating fallback avatar:', error);
    // Return a completely safe fallback
    return `https://ui-avatars.com/api/?name=${encodeURIComponent('?')}&background=3b82f6&color=ffffff&size=${size}&font-size=0.6&format=png&rounded=true&bold=true`;
  }
};

// Validate group data completeness
export const validateGroupData = (group: any): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (!group.name || sanitizeGroupTitle(group.name) === 'Grupo sem nome') {
    issues.push('Nome do grupo inválido ou ausente');
  }
  
  if (!group.description || group.description.trim().length < 100) {
    issues.push('Descrição muito curta ou ausente (mínimo 100 caracteres)');
  }
  
  if (group.description && group.description.trim().length > 1000) {
    issues.push('Descrição muito longa (máximo 1000 caracteres)');
  }
  
  if (!group.telegramUrl) {
    issues.push('URL do Telegram ausente');
  } else {
    const urlCheck = /^https?:\/\/(t\.me|telegram\.me)\/.+/i;
    if (!urlCheck.test(group.telegramUrl)) {
      issues.push('URL do Telegram inválida');
    }
  }
  
  if (!group.category) {
    issues.push('Categoria não definida');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};