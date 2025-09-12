import { imageUploadService } from '@/services/imageUploadService';

export const uploadNewLogo = async (): Promise<string | null> => {
  try {
    console.log('🔄 Uploading new TopGrupos logo...');
    
    // URL da nova logo enviada pelo usuário
    const newLogoUrl = '/lovable-uploads/6c3df37e-5b58-4b13-ad98-7d661b57a961.png';
    
    // Fazer upload para Firebase Storage
    const result = await imageUploadService.downloadAndUploadImage(
      window.location.origin + newLogoUrl,
      'topgrupos-logo'
    );
    
    if (result.success && result.url) {
      console.log('✅ Logo uploaded successfully:', result.url);
      return result.url;
    } else {
      console.error('❌ Failed to upload logo:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error uploading logo:', error);
    return null;
  }
};