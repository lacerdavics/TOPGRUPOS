import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

class ImageUploadService {
  private readonly GROUPS_FOLDER = 'group-images';

  /**
   * Downloads an image from a URL and uploads it to Firebase Storage
   */
  async downloadAndUploadImage(imageUrl: string, groupId: string): Promise<ImageUploadResult> {
    try {
      console.log('🔄 Downloading image from:', imageUrl);

      // Download the image
      const response = await fetch(imageUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.status}`);
      }

      const blob = await response.blob();
      
      // Validate image type
      if (!blob.type.startsWith('image/')) {
        throw new Error('Downloaded file is not an image');
      }

      console.log('✅ Image downloaded, size:', Math.round(blob.size / 1024), 'KB');

      // Generate filename with proper extension
      const extension = this.getImageExtension(blob.type);
      const filename = `${groupId}_${Date.now()}.${extension}`;
      const imagePath = `${this.GROUPS_FOLDER}/${filename}`;

      // Upload to Firebase Storage
      console.log('🔄 Uploading image to Firebase Storage:', imagePath);
      const storageRef = ref(storage, imagePath);
      
      const uploadResult = await uploadBytes(storageRef, blob, {
        contentType: blob.type,
        cacheControl: 'public,max-age=31536000', // Cache for 1 year
      });

      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      console.log('✅ Image uploaded successfully:', downloadURL);

      return {
        success: true,
        url: downloadURL
      };

    } catch (error) {
      console.error('❌ Failed to download and upload image:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get appropriate file extension based on MIME type
   */
  private getImageExtension(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/gif':
        return 'gif';
      case 'image/webp':
        return 'webp';
      case 'image/svg+xml':
        return 'svg';
      default:
        return 'jpg'; // Default fallback
    }
  }

  /**
   * Validate if URL points to a valid image
   */
  async validateImageUrl(imageUrl: string): Promise<boolean> {
    try {
      const response = await fetch(imageUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        return false;
      }

      const contentType = response.headers.get('Content-Type');
      return contentType ? contentType.startsWith('image/') : false;

    } catch (error) {
      console.warn('Failed to validate image URL:', error);
      return false;
    }
  }
}

export const imageUploadService = new ImageUploadService();