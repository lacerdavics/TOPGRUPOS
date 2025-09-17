/**
 * Cache-aware group service that integrates with Telegram API
 * Respects all caching rules and prevents conflicts
 */

import { telegramApiService } from './telegramApiService';
import { addGroup, addGroupApproved } from './groupService';
import { imageUploadService } from './imageUploadService';
import { decodeHtmlEntities } from '@/lib/utils';

interface CacheAwareGroupData {
  telegramUrl: string;
  category: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  contentHash?: string;
  imageHash?: string;
  lastAnalyzed?: Date;
  fromCache?: boolean;
}

interface GroupProcessingResult {
  success: boolean;
  groupId?: string;
  data?: CacheAwareGroupData;
  error?: string;
  cacheStatus: 'hit' | 'miss' | 'updated' | 'skipped';
  shouldStore: boolean;
}

class CacheAwareGroupService {
  // Local storage for tracking processed groups
  private readonly PROCESSED_GROUPS_KEY = 'processed_groups_v2';
  private processedGroups = new Map<string, CacheAwareGroupData>();

  constructor() {
    this.loadProcessedGroups();
  }

  /**
   * Load previously processed groups from localStorage
   */
  private loadProcessedGroups(): void {
    try {
      const stored = localStorage.getItem(this.PROCESSED_GROUPS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([url, groupData]: [string, any]) => {
          this.processedGroups.set(url, {
            ...groupData,
            lastAnalyzed: groupData.lastAnalyzed ? new Date(groupData.lastAnalyzed) : undefined
          });
        });
        console.log(`📚 Loaded ${this.processedGroups.size} processed groups from storage`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load processed groups:', error);
      localStorage.removeItem(this.PROCESSED_GROUPS_KEY);
    }
  }

  /**
   * Save processed groups to localStorage
   */
  private saveProcessedGroups(): void {
    try {
      const data: Record<string, any> = {};
      this.processedGroups.forEach((value, key) => {
        data[key] = value;
      });
      localStorage.setItem(this.PROCESSED_GROUPS_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ Failed to save processed groups:', error);
    }
  }

  /**
   * Check if group needs reprocessing based on cache rules
   */
  private needsReprocessing(
    url: string, 
    currentContentHash: string,
    currentImageHash?: string
  ): boolean {
    const processed = this.processedGroups.get(url);
    
    if (!processed) {
      console.log('🆕 Group never processed before');
      return true;
    }

    // Check if content hash changed
    if (processed.contentHash !== currentContentHash) {
      console.log('🔄 Content hash changed, reprocessing needed');
      return true;
    }

    // Check if image hash changed
    if (currentImageHash && processed.imageHash !== currentImageHash) {
      console.log('🖼️ Image hash changed, reprocessing needed');
      return true;
    }

    console.log('✅ No changes detected, using cached data');
    return false;
  }

  /**
   * Process a single group with full cache awareness
   */
  async processGroup(
    telegramUrl: string, 
    category: string,
    userId?: string,
    userEmail?: string,
    forceReprocess = false
  ): Promise<GroupProcessingResult> {
    console.log(`🔄 Processing group: ${telegramUrl} (Category: ${category})`);

    try {
      // Step 1: Analyze the group
      const analysis = await telegramApiService.analyzeGroupComprehensive(telegramUrl);
      const { groupData, imageValidation, shouldStore, cacheStatus } = analysis;

      // Step 2: Check if reprocessing is needed (unless forced)
      if (!forceReprocess && cacheStatus === 'hit') {
        const needsUpdate = this.needsReprocessing(
          telegramUrl,
          groupData.content_hash,
          groupData.image_hash
        );

        if (!needsUpdate) {
          console.log('⏭️ Skipping processing - no changes detected');
          return {
            success: true,
            cacheStatus: 'skipped',
            shouldStore: false
          };
        }
      }

      // Step 3: Validate if group should be stored
      if (!shouldStore) {
        console.log('❌ Group not suitable for storage (generic image or invalid)');
        return {
          success: false,
          error: 'Group uses generic image or is invalid for registration',
          cacheStatus,
          shouldStore: false
        };
      }

      // Step 4: Extract and validate group data
      const title = groupData.open_graph.title;
      const description = groupData.open_graph.description;
      const imageUrl = groupData.open_graph.image;

      if (!title || title === "Telegram" || title.includes("Telegram: Contact")) {
        throw new Error('Invalid or missing group title');
      }

      // Step 5: Process image if valid
      let finalImageUrl = imageUrl;
      if (imageUrl && imageValidation?.is_valid && !imageValidation.is_generic) {
        console.log('🔄 Processing valid image for Firebase Storage...');
        
        try {
          const tempGroupId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const uploadResult = await imageUploadService.downloadAndUploadImage(imageUrl, tempGroupId);
          
          if (uploadResult.success && uploadResult.url) {
            finalImageUrl = uploadResult.url;
            console.log('✅ Image uploaded to Firebase Storage:', finalImageUrl);
          } else {
            console.warn('⚠️ Image upload failed, using original URL:', uploadResult.error);
          }
        } catch (uploadError) {
          console.warn('⚠️ Image upload error:', uploadError);
        }
      }

      // Step 6: Prepare group data for storage
      const processedGroupData: CacheAwareGroupData = {
        telegramUrl,
        category,
        name: decodeHtmlEntities(title),
        description: description !== 'Descrição não disponível' ? 
          decodeHtmlEntities(description) : 
          `Grupo da categoria ${category}. Uma comunidade ativa no Telegram.`,
        imageUrl: finalImageUrl,
        contentHash: groupData.content_hash,
        imageHash: groupData.image_hash,
        lastAnalyzed: new Date(),
        fromCache: groupData.from_cache
      };

      // Step 7: Save to Firestore
      const firestoreData = {
        name: processedGroupData.name!,
        description: processedGroupData.description!,
        category: processedGroupData.category,
        telegramUrl: processedGroupData.telegramUrl,
        profileImage: processedGroupData.imageUrl,
        membersCount: 0,
        userId: userId || 'api-import',
        userEmail: userEmail || null,
        hasCustomPhoto: groupData.open_graph.has_custom_image
      };

      const groupId = await addGroupApproved(firestoreData);
      console.log(`✅ Group saved to Firestore: ${groupId}`);

      // Step 8: Update local cache
      this.processedGroups.set(telegramUrl, processedGroupData);
      this.saveProcessedGroups();

      return {
        success: true,
        groupId,
        data: processedGroupData,
        cacheStatus,
        shouldStore: true
      };

    } catch (error) {
      console.error(`❌ Error processing group ${telegramUrl}:`, error);
      return {
        success: false,
        error: 'Erro ao carregar dados do Telegram. Tente novamente.',
        cacheStatus: 'miss',
        shouldStore: false
      };
    }
  }

  /**
   * Batch process groups with intelligent caching
   */
  async batchProcessGroups(
    groupsData: Array<{ url: string; category: string }>,
    userId?: string,
    userEmail?: string
  ): Promise<{
    results: GroupProcessingResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      skipped: number;
      fromCache: number;
    };
  }> {
    console.log(`🚀 Starting batch processing of ${groupsData.length} groups`);

    const results: GroupProcessingResult[] = [];
    const summary = {
      total: groupsData.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      fromCache: 0
    };

    for (const { url, category } of groupsData) {
      try {
        console.log(`📝 Processing: ${url} -> ${category}`);
        
        const result = await this.processGroup(url, category, userId, userEmail);
        results.push(result);

        if (result.success) {
          summary.successful++;
        } else {
          summary.failed++;
        }

        if (result.cacheStatus === 'skipped') {
          summary.skipped++;
        } else if (result.cacheStatus === 'hit') {
          summary.fromCache++;
        }

        // Respectful delay between processing
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Batch processing error for ${url}:`, error);
        
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          cacheStatus: 'miss',
          shouldStore: false
        });

        summary.failed++;
      }
    }

    console.log(`✅ Batch processing completed:`, summary);
    return { results, summary };
  }

  /**
   * Refresh group data if content has changed
   */
  async refreshGroupIfChanged(telegramUrl: string): Promise<{
    wasUpdated: boolean;
    changes?: {
      contentChanged: boolean;
      imageChanged: boolean;
    };
    newData?: CacheAwareGroupData;
  }> {
    const processed = this.processedGroups.get(telegramUrl);
    
    if (!processed) {
      console.log('ℹ️ Group not in local cache, cannot check for changes');
      return { wasUpdated: false };
    }

    try {
      const changeCheck = await telegramApiService.checkForContentChanges(
        telegramUrl,
        processed.contentHash,
        processed.imageHash
      );

      if (!changeCheck.hasContentChanged && !changeCheck.hasImageChanged) {
        console.log('✅ No changes detected, no update needed');
        return { wasUpdated: false };
      }

      console.log('🔄 Changes detected, updating group data...');
      
      // Update local cache with new data
      if (changeCheck.newData) {
        const updatedData: CacheAwareGroupData = {
          ...processed,
          contentHash: changeCheck.newData.content_hash,
          imageHash: changeCheck.newData.image_hash,
          lastAnalyzed: new Date(),
          fromCache: changeCheck.newData.from_cache
        };

        this.processedGroups.set(telegramUrl, updatedData);
        this.saveProcessedGroups();

        return {
          wasUpdated: true,
          changes: {
            contentChanged: changeCheck.hasContentChanged,
            imageChanged: changeCheck.hasImageChanged
          },
          newData: updatedData
        };
      }

      return { wasUpdated: false };

    } catch (error) {
      console.error('❌ Error checking for group changes:', error);
      return { wasUpdated: false };
    }
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(): {
    totalProcessed: number;
    lastProcessed?: Date;
    cacheHitRate: number;
  } {
    const processed = Array.from(this.processedGroups.values());
    const fromCacheCount = processed.filter(g => g.fromCache).length;
    
    return {
      totalProcessed: processed.length,
      lastProcessed: processed.length > 0 ? 
        new Date(Math.max(...processed.map(g => g.lastAnalyzed?.getTime() || 0))) : 
        undefined,
      cacheHitRate: processed.length > 0 ? (fromCacheCount / processed.length) * 100 : 0
    };
  }

  /**
   * Clear local processing cache
   */
  clearProcessingCache(): void {
    this.processedGroups.clear();
    localStorage.removeItem(this.PROCESSED_GROUPS_KEY);
    console.log('🧹 Cleared local processing cache');
  }
}

export const cacheAwareGroupService = new CacheAwareGroupService();