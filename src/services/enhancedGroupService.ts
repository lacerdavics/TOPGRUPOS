import { 
  collection, 
  addDoc, 
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  updateDoc,
  doc,
  QueryDocumentSnapshot,
  increment
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAnalyticsConfig } from "./analyticsConfigService";
import { getFakePopularGroups } from "./fakeAnalyticsService";
import { getConfiguredPopularGroupsByCategory, getConfiguredPopularGroups } from "./popularGroupsService";
import { filterBlockedGroups } from "@/utils/groupFilters";

// Helper function to check if an image is a real uploaded image (not generic Telegram profile)
const isRealUploadedImage = (imageUrl: string): boolean => {
  if (!imageUrl) {
    console.log(`❌ Imagem vazia/nula: ${imageUrl}`);
    return false;
  }
  
  console.log(`🔍 Analisando URL: ${imageUrl}`);
  
  // Exclude telesco.pe domains (generic Telegram avatars)
  if (imageUrl.includes('telesco.pe')) {
    console.log(`❌ Rejeitada (telesco.pe): ${imageUrl}`);
    return false;
  }
  
  // Exclude Telegram userpic API (generic profile images with initials)
  if (imageUrl.includes('t.me/i/userpic')) {
    console.log(`❌ Rejeitada (userpic): ${imageUrl}`);
    return false;
  }
  
  // Exclude data:image/svg+xml (generic SVG avatars with initials)
  if (imageUrl.startsWith('data:image/svg+xml')) {
    console.log(`❌ Rejeitada (SVG genérico): ${imageUrl.substring(0, 50)}...`);
    return false;
  }
  
  // Exclude ui-avatars.com (generic avatar service)
  if (imageUrl.includes('ui-avatars.com')) {
    console.log(`❌ Rejeitada (ui-avatars): ${imageUrl}`);
    return false;
  }
  
  // If it has any other URL format, consider it a real uploaded image
  console.log(`✅ ACEITA como imagem real: ${imageUrl}`);
  return true;
};

export interface GroupWithStats {
  id: string;
  name: string;
  description: string;
  telegramUrl: string;
  category: string;
  imageUrl?: string;
  approved: boolean;
  suspended: boolean;
  createdAt: Date;
  createdBy: string; // UID do usuário que criou
  viewCount: number;
  lastViewed?: Timestamp;
}

// Get popular groups (configured manually or analytics-based)
export const getPopularGroups = async (category?: string, limitCount: number = 10): Promise<GroupWithStats[]> => {
  try {
    // For category 'all', check for general popular groups configuration
    if (category === 'all' || !category) {
      try {
        // Check for general popular groups configuration
        const generalPopularQuery = query(
          collection(db, "generalPopularGroups"),
          orderBy("position")
        );
        
        const generalPopularSnapshot = await getDocs(generalPopularQuery);
        
        if (!generalPopularSnapshot.empty) {
          const configuredGeneralGroups = await Promise.all(
            generalPopularSnapshot.docs.map(async (configDoc) => {
              try {
                const config = configDoc.data();
                const groupDoc = await getDoc(doc(db, "groups", config.groupId));
                if (groupDoc.exists()) {
                  const data = groupDoc.data();
                  return {
                    id: groupDoc.id,
                    ...data,
                    viewCount: data.viewCount || 0,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    imageUrl: data.profileImage
                  } as GroupWithStats;
                }
                return null;
              } catch (error) {
                console.error(`Error fetching general popular group ${configDoc.data().groupId}:`, error);
                return null;
              }
            })
          );
          
          const validGeneralGroups = configuredGeneralGroups.filter(group => group !== null) as GroupWithStats[];
          
          if (validGeneralGroups.length > 0) {
            return filterBlockedGroups(validGeneralGroups).slice(0, limitCount);
          }
        }
      } catch (error) {
        console.error('Error getting general popular groups configuration:', error);
      }
    }
    
    // For specific categories, check configured popular groups
    let configuredGroups = [];
    if (category && category !== 'all') {
      configuredGroups = await getConfiguredPopularGroupsByCategory(category);
    } else {
      // Get all configured groups from all categories
      const allConfigured = await getConfiguredPopularGroups();
      configuredGroups = allConfigured;
    }
    
    // Get all groups to match with configurations
    let q = query(
      collection(db, "groups"),
      where("approved", "==", true)
    );

    if (category && category !== 'all') {
      q = query(q, where("category", "==", category));
    }

    const querySnapshot = await getDocs(q);
    const allGroups = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      viewCount: doc.data().viewCount || 0,
      imageUrl: doc.data().profileImage // Map profileImage to imageUrl
    })) as GroupWithStats[];
    
    const availableGroups = allGroups.filter(group => !group.suspended);

    // If we have configured groups, use them for the configured positions
    if (configuredGroups.length > 0) {
      const resultGroups: GroupWithStats[] = [];
      const configuredIds = new Set<string>();
      
      // Filter configured groups by category if not 'all'
      let relevantConfigured = configuredGroups;
      if (category && category !== 'all') {
        relevantConfigured = configuredGroups.filter(config => config.category === category);
      }
      
      // Add configured groups in their specified positions
      for (let i = 1; i <= limitCount; i++) {
        const configForPosition = relevantConfigured.find(config => config.position === i);
        
        if (configForPosition) {
          const actualGroup = availableGroups.find(group => group.id === configForPosition.id);
          if (actualGroup) {
            resultGroups.push(actualGroup);
            configuredIds.add(actualGroup.id);
          }
        }
      }
      
      // Fill remaining positions with random/analytics-based groups
      const remainingGroups = availableGroups.filter(group => !configuredIds.has(group.id));
      const remainingSlotsNeeded = limitCount - resultGroups.length;
      
      if (remainingSlotsNeeded > 0 && remainingGroups.length > 0) {
        const config = await getAnalyticsConfig();
        
        if (config.useRealAnalytics) {
          // Sort with priority: 1) groups with real uploaded images first, 2) view count
          const sortedRemaining = remainingGroups.sort((a, b) => {
            const aHasImage = isRealUploadedImage(a.imageUrl);
            const bHasImage = isRealUploadedImage(b.imageUrl);
            
            // Priority 1: Groups with images come first
            if (aHasImage && !bHasImage) return -1;
            if (bHasImage && !aHasImage) return 1;
            
            // Priority 2: If both have same image status, sort by view count
            return (b.viewCount || 0) - (a.viewCount || 0);
          });
          resultGroups.push(...sortedRemaining.slice(0, remainingSlotsNeeded));
        } else {
          // Use fake analytics for remaining slots, but prioritize groups with real uploaded images
          const sortedRemaining = remainingGroups.sort((a, b) => {
            const aHasImage = isRealUploadedImage(a.imageUrl);
            const bHasImage = isRealUploadedImage(b.imageUrl);
            
            // Priority: Groups with images come first
            if (aHasImage && !bHasImage) return -1;
            if (bHasImage && !aHasImage) return 1;
            
            return 0; // Keep original order for same image status
          });
          const fakePopularRemaining = await getFakePopularGroups(sortedRemaining, remainingSlotsNeeded);
          resultGroups.push(...fakePopularRemaining);
        }
      }
      
      return filterBlockedGroups(resultGroups).slice(0, limitCount);
    }

    // No configured groups - fall back to original logic
    const config = await getAnalyticsConfig();
    
    console.log('🔄 getPopularGroups called - Applying photo priority sorting...');
    
    if (config.useRealAnalytics) {
      // Use real analytics - sort with priority: 1) groups with valid images first, 2) view count
      const sortedGroups = availableGroups.sort((a, b) => {
        // Check for real uploaded images (not generic Telegram profile images)  
        const aHasValidImage = !!(a.imageUrl && isRealUploadedImage(a.imageUrl));
        const bHasValidImage = !!(b.imageUrl && isRealUploadedImage(b.imageUrl));
        
        console.log(`🔍 Comparando: A(${a.name}) tem foto válida: ${aHasValidImage}, B(${b.name}) tem foto válida: ${bHasValidImage}`);
        
        // PRIORITY: Groups WITH valid images come FIRST (return -1 means A comes before B)
        if (aHasValidImage && !bHasValidImage) {
          console.log(`✅ ${a.name} TEM foto válida, ${b.name} NÃO TEM - A vai primeiro`);
          return -1;
        }
        if (bHasValidImage && !aHasValidImage) {
          console.log(`✅ ${b.name} TEM foto válida, ${a.name} NÃO TEM - B vai primeiro`);
          return 1;
        }
        
        // Priority 2: If both have same image status, sort by view count
        return (b.viewCount || 0) - (a.viewCount || 0);
      });
      
      const withValidImages = sortedGroups.filter(g => isRealUploadedImage(g.imageUrl));
      const withoutValidImages = sortedGroups.filter(g => !isRealUploadedImage(g.imageUrl));
      
      console.log(`📸 REAL ANALYTICS - Grupos com foto válida: ${withValidImages.length} | Sem foto/foto inválida: ${withoutValidImages.length}`);
      return filterBlockedGroups(sortedGroups).slice(0, limitCount);
    } else {
      // Use fake analytics - prioritize groups with valid images, then randomize
      const sortedGroups = availableGroups.sort((a, b) => {
        // Check for real uploaded images (not generic Telegram profile images)
        const aHasValidImage = isRealUploadedImage(a.imageUrl);
        const bHasValidImage = isRealUploadedImage(b.imageUrl);
        
        console.log(`🔍 FAKE - Comparando: A(${a.name}) foto: ${aHasValidImage}, B(${b.name}) foto: ${bHasValidImage}`);
        
        // PRIORITY: Groups WITH valid images come FIRST
        if (aHasValidImage && !bHasValidImage) {
          console.log(`✅ FAKE - ${a.name} TEM foto, ${b.name} NÃO - A primeiro`);
          return -1;
        }
        if (bHasValidImage && !aHasValidImage) {
          console.log(`✅ FAKE - ${b.name} TEM foto, ${a.name} NÃO - B primeiro`);
          return 1;
        }
        
        return 0; // Keep original order for same image status
      });
      
      const withValidImages = sortedGroups.filter(g => isRealUploadedImage(g.imageUrl));
      const withoutValidImages = sortedGroups.filter(g => !isRealUploadedImage(g.imageUrl));
      
      console.log(`📸 FAKE ANALYTICS - Grupos com foto válida: ${withValidImages.length} | Sem foto/foto inválida: ${withoutValidImages.length}`);
      return filterBlockedGroups(await getFakePopularGroups(sortedGroups, limitCount));
    }
  } catch (error) {
    console.error("❌ Erro ao buscar grupos populares:", error);
    return [];
  }
};

// Get all groups from a category (for complete pagination)
export const getAllCategoryGroups = async (category: string): Promise<GroupWithStats[]> => {
  try {
    console.log(`🔍 Carregando TODOS os grupos da categoria: "${category}"`);
    
    let q = query(
      collection(db, "groups"),
      where("approved", "==", true)
    );

    if (category && category !== 'all') {
      q = query(q, where("category", "==", category));
    }

    const querySnapshot = await getDocs(q);
    const mappedGroups = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      viewCount: doc.data().viewCount || 0,
      imageUrl: doc.data().profileImage // Map profileImage to imageUrl
    })) as GroupWithStats[];
    
    // Filter out suspended groups
    const allGroups = mappedGroups.filter(group => !group.suspended);
    
    console.log(`✅ Total de grupos carregados: ${allGroups.length}`);
    return filterBlockedGroups(allGroups);
  } catch (error) {
    console.error("❌ Erro ao carregar todos os grupos da categoria:", error);
    return [];
  }
};

// Get groups with popular and regular sections for category pages
export const getCategoryGroupsWithSections = async (
  category: string,
  popularLimit: number = 10,
  regularLimit: number = 20
): Promise<{ popularGroups: GroupWithStats[], regularGroups: GroupWithStats[] }> => {
  console.log(`🚀 INÍCIO getCategoryGroupsWithSections - categoria: "${category}", popularLimit: ${popularLimit}, regularLimit: ${regularLimit}`);
  
  try {
    // Check analytics configuration
    console.log(`🔧 Buscando configuração de analytics...`);
    const config = await getAnalyticsConfig();
    console.log(`🔧 Analytics config: useRealAnalytics = ${config.useRealAnalytics}`);
    
    // Get ALL groups from category
    console.log(`📥 Carregando TODOS os grupos da categoria "${category}"...`);
    const allGroups = await getAllCategoryGroups(category);
    console.log(`📊 TOTAL de grupos carregados: ${allGroups.length}`);

    console.log('🔄 getCategoryGroupsWithSections called - Applying photo priority sorting...');
    console.log(`📊 Total de grupos carregados para categoria "${category}": ${allGroups.length}`);
    
    if (config.useRealAnalytics) {
      console.log('🔥 USANDO REAL ANALYTICS');
      // Use real analytics - sort with priority: 1) groups with valid images first, 2) view count
      const sortedGroups = [...allGroups].sort((a, b) => {
        // Check for real uploaded images (not generic Telegram profile images)
        const aHasValidImage = isRealUploadedImage(a.imageUrl);
        const bHasValidImage = isRealUploadedImage(b.imageUrl);
        
        console.log(`🔍 CATEGORIA REAL - Comparando: A(${a.name}) foto: ${aHasValidImage}, B(${b.name}) foto: ${bHasValidImage}`);
        
        // PRIORITY: Groups WITH valid images come FIRST  
        if (aHasValidImage && !bHasValidImage) {
          console.log(`✅ CATEGORIA - ${a.name} TEM foto, ${b.name} NÃO - A primeiro`);
          return -1;
        }
        if (bHasValidImage && !aHasValidImage) {
          console.log(`✅ CATEGORIA - ${b.name} TEM foto, ${a.name} NÃO - B primeiro`);
          return 1;
        }
        
        // Priority 2: If both have same image status, sort by view count
        return (b.viewCount || 0) - (a.viewCount || 0);
      });
      const popularGroups = sortedGroups.slice(0, popularLimit);
      const regularGroups = sortedGroups.slice(popularLimit);
      
      const popularWithValid = popularGroups.filter(g => isRealUploadedImage(g.imageUrl));
      const regularWithValid = regularGroups.filter(g => isRealUploadedImage(g.imageUrl));
      
      console.log(`📸 CATEGORIA REAL - Populares: ${popularWithValid.length}/${popularGroups.length} com foto válida | Regulares: ${regularWithValid.length}/${regularGroups.length} com foto válida`);
      console.log(`🎯 PRIMEIRA CATEGORIA - Primeiros 3 populares: ${popularGroups.slice(0, 3).map(g => `${g.name} (foto: ${isRealUploadedImage(g.imageUrl)})`).join(', ')}`);
      return { popularGroups: filterBlockedGroups(popularGroups), regularGroups: filterBlockedGroups(regularGroups) };
    } else {
      console.log('🎭 USANDO FAKE ANALYTICS');
      // Use fake analytics - prioritize groups with valid images for both sections
      const sortedGroups = [...allGroups].sort((a, b) => {
        // Check for real uploaded images (not generic Telegram profile images)
        const aHasValidImage = isRealUploadedImage(a.imageUrl);
        const bHasValidImage = isRealUploadedImage(b.imageUrl);
        
        console.log(`🔍 CATEGORIA FAKE - Comparando: A(${a.name}) foto: ${aHasValidImage}, B(${b.name}) foto: ${bHasValidImage}`);
        
        // PRIORITY: Groups WITH valid images come FIRST
        if (aHasValidImage && !bHasValidImage) {
          console.log(`✅ CATEGORIA FAKE - ${a.name} TEM foto, ${b.name} NÃO - A primeiro`);
          return -1;
        }
        if (bHasValidImage && !aHasValidImage) {
          console.log(`✅ CATEGORIA FAKE - ${b.name} TEM foto, ${a.name} NÃO - B primeiro`);
          return 1;
        }
        
        return 0; // Keep original order for same image status
      });
      
      const popularGroups = await getFakePopularGroups(sortedGroups, popularLimit);
      const popularIds = popularGroups.map(g => g.id);
      const remainingGroups = sortedGroups.filter(g => !popularIds.includes(g.id));
      
      const regularGroupsWithViews = remainingGroups.map(group => ({
        ...group,
        viewCount: Math.floor(Math.random() * 10000) + 5000
      }));
      
      const popularWithValid = popularGroups.filter(g => isRealUploadedImage(g.imageUrl));
      const regularWithValid = regularGroupsWithViews.filter(g => isRealUploadedImage(g.imageUrl));
      
      console.log(`📸 CATEGORIA FAKE - Populares: ${popularWithValid.length}/${popularGroups.length} com foto válida | Regulares: ${regularWithValid.length}/${regularGroupsWithViews.length} com foto válida`);
      console.log(`🎯 PRIMEIRA CATEGORIA FAKE - Primeiros 3 populares: ${popularGroups.slice(0, 3).map(g => `${g.name} (foto: ${isRealUploadedImage(g.imageUrl)})`).join(', ')}`);
      return { popularGroups: filterBlockedGroups(popularGroups), regularGroups: filterBlockedGroups(regularGroupsWithViews) };
    }
  } catch (error) {
    console.error("❌ Erro ao buscar grupos com seções:", error);
    return { popularGroups: [], regularGroups: [] };
  }
};

// Get remaining groups (paginated, excluding popular ones)
export const getRemainingGroups = async (
  category?: string,
  pageSize: number = 20,
  lastDoc?: QueryDocumentSnapshot,
  excludeIds: string[] = []
): Promise<{ groups: GroupWithStats[], lastDoc?: QueryDocumentSnapshot }> => {
  try {
    let q = query(
      collection(db, "groups"),
      where("approved", "==", true)
    );

    if (category && category !== 'all') {
      q = query(q, where("category", "==", category));
    }

    q = query(q, orderBy("createdAt", "desc"), limit(pageSize * 2)); // Get more to filter suspended ones

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    
    // Filter out suspended groups and popular groups that are already shown
    const filteredDocs = querySnapshot.docs.filter(doc => {
      const data = doc.data();
      return !data.suspended && !excludeIds.includes(doc.id);
    });
    
    const groups = filteredDocs.slice(0, pageSize).map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      viewCount: doc.data().viewCount || 0,
      imageUrl: doc.data().profileImage // Map profileImage to imageUrl
    })) as GroupWithStats[];

    const newLastDoc = filteredDocs[Math.min(filteredDocs.length - 1, pageSize - 1)];

    return { groups: filterBlockedGroups(groups), lastDoc: newLastDoc };
  } catch (error) {
    console.error("❌ Erro ao buscar grupos restantes:", error);
    return { groups: [] };
  }
};

// Get groups by user
export const getGroupsByUser = async (userId: string): Promise<GroupWithStats[]> => {
  try {
    const q = query(
      collection(db, "groups"),
      where("createdBy", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    return filterBlockedGroups(querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      viewCount: doc.data().viewCount || 0,
      imageUrl: doc.data().profileImage // Map profileImage to imageUrl
    })) as GroupWithStats[]);
  } catch (error) {
    console.error("❌ Erro ao buscar grupos do usuário:", error);
    return [];
  }
};

// Get group stats for admin
export const getGroupStats = async () => {
  try {
    // Total groups
    const allGroupsQuery = query(collection(db, "groups"));
    const allGroupsSnapshot = await getDocs(allGroupsQuery);
    const totalGroups = allGroupsSnapshot.size;

    // Get all groups and filter for active/suspended in memory to avoid composite index
    const allGroups = allGroupsSnapshot.docs.map(doc => doc.data());
    
    // Active groups (approved and not suspended) 
    const activeGroups = allGroups.filter(group => group.approved === true && group.suspended !== true).length;

    // Suspended groups
    const suspendedGroups = allGroups.filter(group => group.suspended === true).length;

    // Pending groups
    const pendingGroups = allGroups.filter(group => group.approved === false).length;

    return {
      totalGroups,
      activeGroups,
      suspendedGroups,
      pendingGroups
    };
  } catch (error) {
    console.error("❌ Erro ao buscar estatísticas dos grupos:", error);
    return {
      totalGroups: 0,
      activeGroups: 0,
      suspendedGroups: 0,
      pendingGroups: 0
    };
  }
};

// Increment view count when user clicks on group
export const incrementGroupViews = async (groupId: string): Promise<void> => {
  try {
    const groupRef = doc(db, "groups", groupId);
    await updateDoc(groupRef, {
      viewCount: increment(1),
      lastViewed: Timestamp.now()
    });
  } catch (error) {
    console.error("❌ Erro ao incrementar visualizações:", error);
  }
};