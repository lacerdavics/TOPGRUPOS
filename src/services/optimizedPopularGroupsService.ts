import { 
  collection, 
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cache } from "./cacheService";
import { filterBlockedGroups } from "@/utils/groupFilters";
import { isGroupImageReal } from "@/utils/groupValidation";
import { filterAdultGroups, isAgeVerified } from "@/utils/ageVerification";

export interface OptimizedGroup {
  id: string;
  name: string;
  description: string;
  telegramUrl: string;
  category: string;
  imageUrl?: string;
  profileImage?: string; // Add profileImage field for compatibility
  approved: boolean;
  suspended: boolean;
  createdAt: Date;
  viewCount: number;
}

// Get random popular groups from any category with fallback
export const getRandomPopularGroups = async (limitCount: number = 6): Promise<OptimizedGroup[]> => {
  // Check if should include adult content
  const includeAdultContent = isAgeVerified();
  const cacheKey = `random_popular_any_${limitCount}_${includeAdultContent}`;
  
  // Shorter cache time for random groups (2 minutes)
  const cached = cache.get<OptimizedGroup[]>(cacheKey);
  if (cached) {
    console.log(`⚡ Cache HIT para grupos aleatórios: ${cacheKey}`);
    return cached;
  }

  console.log(`🔄 Carregando grupos aleatórios de qualquer categoria`);
  const startTime = performance.now();

  try {
    let q = query(
      collection(db, "groups"),
      where("approved", "==", true)
    );

    const querySnapshot = await getDocs(q);
    console.log(`📊 Total de grupos encontrados: ${querySnapshot.docs.length}`);
    
    const allGroups: OptimizedGroup[] = [];
    
    // Process docs and filter out suspended groups
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Skip suspended groups early
      if (data.suspended === true) return;
      
      console.log(`📄 Processando grupo: ${data.name} - Categoria: ${data.category}`);
      
      // Generate realistic view count if not present
      const baseViewCount = data.viewCount || 0;
      const viewCount = baseViewCount > 0 ? baseViewCount : Math.floor(Math.random() * 12000) + 3000;
      
      allGroups.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        telegramUrl: data.telegramUrl,
        category: data.category,
        profileImage: data.profileImage, // Campo principal
        imageUrl: data.profileImage, // Compatibilidade
        approved: true,
        suspended: false,
        createdAt: data.createdAt?.toDate() || new Date(),
        viewCount: viewCount
      });
    });

    console.log(`✅ Grupos válidos processados: ${allGroups.length}`);

    if (allGroups.length === 0) {
      console.log(`⚠️ Nenhum grupo encontrado no banco`);
      return [];
    }

    // Shuffle array for randomness
    const shuffled = allGroups.sort(() => 0.5 - Math.random());
    
    // Filter adult content if not verified
    const ageFiltered = filterAdultGroups(shuffled, includeAdultContent);
    
    // Prioritize groups with real images when possible
    const groupsWithImages = ageFiltered.filter(group => isGroupImageReal(group.profileImage));
    const groupsWithoutImages = ageFiltered.filter(group => !isGroupImageReal(group.profileImage));
    
    // Take from groups with images first, then fill with groups without images
    const result = [
      ...groupsWithImages.slice(0, limitCount),
      ...groupsWithoutImages.slice(0, Math.max(0, limitCount - groupsWithImages.length))
    ].slice(0, limitCount);

    const filtered = filterBlockedGroups(result);
    
    // Cache for 2 minutes (shorter for random content)
    cache.set(cacheKey, filtered, 120000);
    
    const loadTime = performance.now() - startTime;
    console.log(`⚡ ${filtered.length} grupos aleatórios carregados em ${loadTime.toFixed(2)}ms`);
    
    return filtered;

  } catch (error) {
    console.error("❌ Erro ao carregar grupos aleatórios:", error);
    return [];
  }
};

// Get random popular groups from a specific category
export const getRandomPopularGroupsByCategory = async (category: string, limitCount: number = 6): Promise<OptimizedGroup[]> => {
  // Check if should include adult content
  const includeAdultContent = isAgeVerified();
  const cacheKey = `random_popular_${category}_${limitCount}_${includeAdultContent}`;
  
  // Shorter cache time for random groups (2 minutes)
  const cached = cache.get<OptimizedGroup[]>(cacheKey);
  if (cached) {
    console.log(`⚡ Cache HIT para grupos aleatórios: ${cacheKey}`);
    return cached;
  }

  console.log(`🔄 Carregando grupos aleatórios da categoria: ${category}`);
  const startTime = performance.now();

  try {
    let q = query(
      collection(db, "groups"),
      where("approved", "==", true),
      where("category", "==", category)
    );

    const querySnapshot = await getDocs(q);
    console.log(`📊 Grupos encontrados na categoria ${category}: ${querySnapshot.docs.length}`);
    
    const allGroups: OptimizedGroup[] = [];
    
    // Process docs and filter out suspended groups
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Skip suspended groups early
      if (data.suspended === true) return;
      
      // Generate realistic view count if not present
      const baseViewCount = data.viewCount || 0;
      const viewCount = baseViewCount > 0 ? baseViewCount : Math.floor(Math.random() * 12000) + 3000;
      
      allGroups.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        telegramUrl: data.telegramUrl,
        category: data.category,
        profileImage: data.profileImage, // Campo principal
        imageUrl: data.profileImage, // Compatibilidade
        approved: true,
        suspended: false,
        createdAt: data.createdAt?.toDate() || new Date(),
        viewCount: viewCount
      });
    });

    // If no groups in this category, fallback to any category
    if (allGroups.length === 0) {
      console.log(`⚠️ Nenhum grupo na categoria ${category}, fazendo fallback para qualquer categoria`);
      return getRandomPopularGroups(limitCount);
    }

    // Shuffle array for randomness
    const shuffled = allGroups.sort(() => 0.5 - Math.random());
    
    // Filter adult content if not verified (only for non-adult categories)
    const ageFiltered = category === 'adulto' ? shuffled : filterAdultGroups(shuffled, includeAdultContent);
    
    // Prioritize groups with real images when possible
    const groupsWithImages = ageFiltered.filter(group => isGroupImageReal(group.profileImage));
    const groupsWithoutImages = ageFiltered.filter(group => !isGroupImageReal(group.profileImage));
    
    // Take from groups with images first, then fill with groups without images
    const result = [
      ...groupsWithImages.slice(0, limitCount),
      ...groupsWithoutImages.slice(0, Math.max(0, limitCount - groupsWithImages.length))
    ].slice(0, limitCount);

    const filtered = filterBlockedGroups(result);
    
    // Cache for 2 minutes (shorter for random content)
    cache.set(cacheKey, filtered, 120000);
    
    const loadTime = performance.now() - startTime;
    console.log(`⚡ ${filtered.length} grupos aleatórios da categoria ${category} carregados em ${loadTime.toFixed(2)}ms`);
    
    return filtered;

  } catch (error) {
    console.error("❌ Erro ao carregar grupos aleatórios:", error);
    return [];
  }
};

// Get popular groups with aggressive caching and optimization
export const getOptimizedPopularGroups = async (category?: string, limitCount: number = 6): Promise<OptimizedGroup[]> => {
  // If a specific category is provided, use random selection from that category
  if (category && category !== 'all') {
    return getRandomPopularGroupsByCategory(category, limitCount);
  }
  
  // For 'all' or no category, get random groups from any category
  return getRandomPopularGroups(limitCount);
};

// Get groups excluding specific IDs (to avoid duplication)
export const getOptimizedGroupsExcluding = async (
  category?: string, 
  limitCount: number = 20, 
  excludeIds: string[] = []
): Promise<OptimizedGroup[]> => {
  // Check if should include adult content
  const includeAdultContent = isAgeVerified();
  const cacheKey = `optimized_excluding_${category || 'all'}_${limitCount}_${excludeIds.length}_${includeAdultContent}`;
  
  // Check cache first
  const cached = cache.get<OptimizedGroup[]>(cacheKey);
  if (cached) {
    console.log(`⚡ Cache HIT para grupos excluindo IDs: ${cacheKey}`);
    console.log('🔍 DEBUG SERVICE: Returning cached groups:', cached.length);
    console.log('🔍 DEBUG SERVICE: Cached group IDs:', cached.map(g => g.id));
    return cached;
  }

  console.log(`🔄 Carregando grupos excluindo ${excludeIds.length} IDs`);
  console.log('🔍 DEBUG SERVICE: Exclude IDs received:', excludeIds);
  console.log('🔍 DEBUG SERVICE: Category filter:', category);
  console.log('🔍 DEBUG SERVICE: Limit count:', limitCount);
  const startTime = performance.now();

  try {
    let q = query(
      collection(db, "groups"),
      where("approved", "==", true)
    );

    if (category && category !== 'all') {
      q = query(q, where("category", "==", category));
    }

    const querySnapshot = await getDocs(q);
    console.log(`🔍 DEBUG SERVICE: Total docs from Firestore: ${querySnapshot.docs.length}`);
    console.log(`📊 Total de grupos encontrados: ${querySnapshot.docs.length}`);
    
    const allGroups: OptimizedGroup[] = [];
    let excludedCount = 0;
    
    // Process docs and filter out suspended groups and excluded IDs
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Skip excluded IDs (suspended groups already filtered by approved=true query)
      if (excludeIds.includes(doc.id)) {
        excludedCount++;
        console.log(`🔍 DEBUG SERVICE: Skipping excluded group: ${data.name} (ID: ${doc.id})`);
        return;
      }
      
      // Generate realistic view count if not present
      const baseViewCount = data.viewCount || 0;
      const viewCount = baseViewCount > 0 ? baseViewCount : Math.floor(Math.random() * 12000) + 3000;
      
      allGroups.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        telegramUrl: data.telegramUrl,
        category: data.category,
        profileImage: data.profileImage,
        imageUrl: data.profileImage,
        approved: true,
        createdAt: data.createdAt?.toDate() || new Date(),
        viewCount: viewCount
      });
    });

    console.log(`🔍 DEBUG SERVICE: Groups after filtering - Total: ${allGroups.length}, Excluded skipped: ${excludedCount}`);
    console.log('🔍 DEBUG SERVICE: Remaining group IDs:', allGroups.map(g => g.id));
    console.log('🔍 DEBUG SERVICE: Remaining group names:', allGroups.map(g => g.name));
    
    // If no groups found, return empty array immediately
    if (allGroups.length === 0) {
      console.log('⚠️ DEBUG SERVICE: No groups found after filtering');
      cache.set(cacheKey, [], 120000);
      return [];
    }
    
    // Filter adult content if not verified
    const ageFiltered = filterAdultGroups(allGroups, includeAdultContent);
    console.log('🔍 DEBUG SERVICE: Groups after age filtering:', ageFiltered.length);
    
    // Shuffle and limit
    const shuffled = ageFiltered.sort(() => 0.5 - Math.random());
    console.log('🔍 DEBUG SERVICE: After shuffle, taking first', limitCount, 'groups');
    const result = shuffled.slice(0, limitCount);
    console.log('🔍 DEBUG SERVICE: Groups after limit slice:', result.length);
    console.log('🔍 DEBUG SERVICE: Group IDs after limit:', result.map(g => g.id));
    const filtered = filterBlockedGroups(result);
    console.log('🔍 DEBUG SERVICE: Groups after filterBlockedGroups:', filtered.length);
    console.log('🔍 DEBUG SERVICE: Final group IDs:', filtered.map(g => g.id));
    console.log('🔍 DEBUG SERVICE: Final group names:', filtered.map(g => g.name));
    
    // Cache for 2 minutes
    cache.set(cacheKey, filtered, 120000);
    
    const loadTime = performance.now() - startTime;
    console.log(`⚡ ${filtered.length} grupos (excluindo ${excludeIds.length} IDs) carregados em ${loadTime.toFixed(2)}ms`);
    
    return filtered;

  } catch (error) {
    console.error("❌ Erro ao carregar grupos excluindo IDs:", error);
    return [];
  }
};
// Optimized function to increment group views with cache invalidation
export const incrementOptimizedGroupViews = async (groupId: string): Promise<void> => {
  try {
    // Import the original function
    const { incrementGroupViews } = await import('./enhancedGroupService');
    await incrementGroupViews(groupId);
    
    // Invalidate cache entries that might include this group
    cache.clear();
    console.log('🔄 Cache invalidado após incremento de views');
  } catch (error) {
    console.error('❌ Erro ao incrementar views:', error);
  }
};