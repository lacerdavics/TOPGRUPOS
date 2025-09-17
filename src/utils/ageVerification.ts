// Utility functions for age verification system

export const AGE_VERIFICATION_KEY = 'age_verified';
export const AGE_VERIFICATION_DATE_KEY = 'age_verified_date';

// Check if user has already verified their age
export const isAgeVerified = (): boolean => {
  try {
    const verified = localStorage.getItem(AGE_VERIFICATION_KEY);
    const verifiedDate = localStorage.getItem(AGE_VERIFICATION_DATE_KEY);
    
    if (!verified || verified !== 'true' || !verifiedDate) {
      return false;
    }
    
    // Check if verification is still valid (30 days)
    const verificationDate = new Date(verifiedDate);
    const now = new Date();
    const daysDiff = (now.getTime() - verificationDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 30) {
      // Verification expired, clear it
      clearAgeVerification();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking age verification:', error);
    return false;
  }
};

// Set age verification
export const setAgeVerified = (): void => {
  try {
    localStorage.setItem(AGE_VERIFICATION_KEY, 'true');
    localStorage.setItem(AGE_VERIFICATION_DATE_KEY, new Date().toISOString());
    console.log('✅ Age verification set');
  } catch (error) {
    console.error('Error setting age verification:', error);
  }
};

// Clear age verification
export const clearAgeVerification = (): void => {
  try {
    localStorage.removeItem(AGE_VERIFICATION_KEY);
    localStorage.removeItem(AGE_VERIFICATION_DATE_KEY);
    console.log('🗑️ Age verification cleared');
  } catch (error) {
    console.error('Error clearing age verification:', error);
  }
};

// Check if a category requires age verification
export const requiresAgeVerification = (categoryId: string): boolean => {
  return categoryId === 'adulto';
};

// Filter out adult groups if age not verified
export const filterAdultGroups = <T extends { category?: string }>(
  groups: T[], 
  includeAdult: boolean = true
): T[] => {
  if (includeAdult) {
    return groups;
  }
  
  return groups.filter(group => group.category !== 'adulto');
};