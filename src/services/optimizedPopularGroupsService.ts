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

export interface OptimizedGroup {
  id: string;
  name: string;
  description: string;
  telegramUrl: string;
  category: string;
  imageUrl?: string;
  approved: boolean;
  suspended: boolean;
  createdAt: Date;
  viewCount: number;
}

// Helper function to check if an image is real (optimized version)
const hasRealImage = (imageUrl?: string): boolean => {
  if (!imageUrl) return false;
  
  // Quick checks for known fake image patterns
  if (imageUrl.includes('telesco.pe') || 
      imageUrl.includes('t.me/i/userpic') || 
      imageUrl.includes('ui-avatars.com') ||
      imageUrl.startsWith('data:image/svg+xml')) {
    return false;
  }
  
  return true;
};

// Get random popular groups from any category with fallback
export const getRandomPopularGroups = async (limitCount: number = 6): Promise<OptimizedGroup[]> => {
  const cacheKey = `random_popular_any_${limitCount}`;
  
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
        imageUrl: data.profileImage,
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
    
    // Prioritize groups with real images when possible
    const groupsWithImages = shuffled.filter(group => hasRealImage(group.imageUrl));
    const groupsWithoutImages = shuffled.filter(group => !hasRealImage(group.imageUrl));
    
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
  const cacheKey = `random_popular_${category}_${limitCount}`;
  
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
        imageUrl: data.profileImage,
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
    
    // Prioritize groups with real images when possible
    const groupsWithImages = shuffled.filter(group => hasRealImage(group.imageUrl));
    const groupsWithoutImages = shuffled.filter(group => !hasRealImage(group.imageUrl));
    
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