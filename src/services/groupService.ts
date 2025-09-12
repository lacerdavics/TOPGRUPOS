import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  DocumentData,
  QuerySnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Group } from "@/components/GroupCard";
import { filterBlockedGroups, isBlockedGroupName } from "@/utils/groupFilters";
import { createExpiredLinkNotification } from "./expiredLinkNotificationService";
import { getActivePromotedGroupsByCategory } from "./promotionService";

export interface GroupData {
  name: string;
  description: string;
  category: string;
  telegramUrl: string;
  profileImage?: string;
  createdAt: Timestamp;
  approved: boolean;
  membersCount?: number;
  userId?: string;
  userEmail?: string | null;
}

// Converter function for Firestore documents
const convertFirestoreGroup = (doc: any): Group => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    category: data.category,
    telegramUrl: data.telegramUrl,
    profileImage: data.profileImage,
    createdAt: data.createdAt.toDate(),
    membersCount: data.membersCount
  };
};

// Add a new group with automatic approval based on photo
export const addGroup = async (groupData: Omit<GroupData, 'createdAt' | 'approved'> & { hasCustomPhoto?: boolean }, userId?: string): Promise<string> => {
  try {
    console.log('🔵 Verificando duplicatas antes de adicionar grupo');
    console.log('🔵 Dados para verificação:', {
      category: groupData.category,
      name: groupData.name,
      userId: groupData.userId
    });
    
    // Check for duplicate groups using category, name, and userId
    const duplicateQuery = query(
      collection(db, "groups"),
      where("category", "==", groupData.category),
      where("name", "==", groupData.name),
      where("userId", "==", groupData.userId || userId || 'anonymous')
    );
    
    const duplicateSnapshot = await getDocs(duplicateQuery);
    
    if (!duplicateSnapshot.empty) {
      console.log('🚨 Grupo duplicado encontrado!');
      throw new Error('Grupo já existente no servidor');
    }
    
    console.log('✅ Nenhuma duplicata encontrada, prosseguindo com cadastro');
    
    console.log('🔵 addGroup chamado com:', groupData);
    console.log('🔵 Firestore db instance:', db);
    
    // Verificar se o nome indica link expirado antes de adicionar
    if (isBlockedGroupName(groupData.name)) {
      console.log('🚨 Tentativa de adicionar grupo com link expirado detectada:', groupData.name);
      
      // Criar notificação para o usuário
      if (groupData.userEmail) {
        await createExpiredLinkNotification(
          groupData.userEmail,
          groupData.name,
          'temp-id', // Será atualizado se necessário
          groupData.telegramUrl
        );
      }
      
      throw new Error('O link do Telegram parece ter expirado. Verifique se o link está correto e tente novamente. Uma notificação foi enviada sobre este problema.');
    }
    
    // Determine approval status based on photo presence
    const approved = groupData.hasCustomPhoto === true;
    
    console.log(`🔍 Status de aprovação: ${approved ? 'APROVADO' : 'PENDENTE'} - Foto personalizada: ${groupData.hasCustomPhoto}`);
    
    const { hasCustomPhoto, ...dataToSave } = groupData; // Remove hasCustomPhoto from saved data
    
    const docRef = await addDoc(collection(db, "groups"), {
      ...dataToSave,
      createdAt: Timestamp.now(),
      approved: approved,
      createdBy: userId || 'anonymous',
      viewCount: 0
    });
    
    console.log(`🟢 Documento adicionado com ID: ${docRef.id} - Status: ${approved ? 'APROVADO' : 'PENDENTE'}`);
    
    return docRef.id;
  } catch (error) {
    console.error("🔴 Erro detalhado ao adicionar grupo: ", error);
    throw error;
  }
};

// Add a new group already approved (used for admin batch import)
export const addGroupApproved = async (groupData: Omit<GroupData, 'createdAt' | 'approved'>): Promise<string> => {
  try {
    console.log('🔵 addGroupApproved chamado com:', {
      ...groupData,
      categoryInfo: `"${groupData.category}"`
    });
    
    // Ensure required fields are present for Firebase rules
    const completeGroupData = {
      ...groupData,
      createdAt: Timestamp.now(),
      approved: true,
      suspended: false, // Explicitly set suspended to false
      createdBy: groupData.userId || 'admin-upload',
      viewCount: (groupData as any).viewCount || 0
    };
    
    console.log('🔵 Dados completos para salvar:', completeGroupData);
    
    const docRef = await addDoc(collection(db, "groups"), completeGroupData);
    console.log('🟢 Documento (aprovado) adicionado com ID:', docRef.id, 'categoria:', groupData.category);
    return docRef.id;
  } catch (error) {
    console.error("🔴 Erro ao adicionar grupo aprovado: ", error);
    console.error("🔴 Detalhes do erro:", {
      code: (error as any)?.code,
      message: (error as any)?.message,
      stack: (error as any)?.stack
    });
    throw error;
  }
};

// Get groups by category - OPTIMIZED VERSION WITH PROMOTED GROUPS PRIORITY
export const getGroupsByCategory = async (category: string): Promise<Group[]> => {
  try {
    console.log(`🔍 Buscando grupos da categoria: "${category}"`);
    
    // Get promoted groups for this category first
    const promotedGroups = await getActivePromotedGroupsByCategory(category);
    const promotedGroupIds = promotedGroups.map(pg => pg.groupId);
    
    console.log(`🚀 Encontrados ${promotedGroups.length} grupos promovidos para categoria "${category}"`);
    
    // Try optimized query first - filter by category at database level
    try {
      const optimizedQuery = query(
        collection(db, "groups"),
        where("approved", "==", true),
        where("category", "==", category),
        where("suspended", "!=", true)
      );
      
      const querySnapshot = await getDocs(optimizedQuery);
      const allGroups = querySnapshot.docs.map(doc => {
        const data = doc.data() as any;
        const group = convertFirestoreGroup(doc);
        // Add recategorization data
        (group as any).lastRecategorizedAt = data.lastRecategorizedAt;
        (group as any).recategorizedCount = data.recategorizedCount || 0;
        // Mark if promoted
        (group as any).isPromoted = promotedGroupIds.includes(group.id);
        return group;
      });
      
      // Sort with PROMOTED GROUPS FIRST
      allGroups.sort((a, b) => {
        const aPromoted = (a as any).isPromoted;
        const bPromoted = (b as any).isPromoted;
        
        // PRIORITY 0: Promoted groups always come first
        if (aPromoted && !bPromoted) return -1;
        if (bPromoted && !aPromoted) return 1;
        
        // For promoted groups, maintain their promotion order
        if (aPromoted && bPromoted) {
          const aPromotion = promotedGroups.find(pg => pg.groupId === a.id);
          const bPromotion = promotedGroups.find(pg => pg.groupId === b.id);
          
          // Sort by position if available, otherwise by start date
          if (aPromotion?.position && bPromotion?.position) {
            return aPromotion.position - bPromotion.position;
          }
          return (bPromotion?.startDate.getTime() || 0) - (aPromotion?.startDate.getTime() || 0);
        }
        
        // For non-promoted groups, use regular sorting
        const aHasImage = !!(a as any).profileImage;
        const bHasImage = !!(b as any).profileImage;
        
        // Priority 1: Groups with images come first
        if (aHasImage && !bHasImage) return -1;
        if (bHasImage && !aHasImage) return 1;
        
        // Priority 2: If both have same image status, sort by recategorization
        const aRecategorized = (a as any).lastRecategorizedAt;
        const bRecategorized = (b as any).lastRecategorizedAt;
        
        // If both have recategorization dates, sort by most recent recategorization
        if (aRecategorized && bRecategorized) {
          return bRecategorized.toDate().getTime() - aRecategorized.toDate().getTime();
        }
        
        // If only one has recategorization, prioritize it
        if (aRecategorized && !bRecategorized) return -1;
        if (bRecategorized && !aRecategorized) return 1;
        
        // Priority 3: If neither has recategorization, sort by creation date
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      console.log(`✅ OPTIMIZED: Encontrados ${allGroups.length} grupos para categoria "${category}" (${promotedGroups.length} promovidos)`);
      return filterBlockedGroups(allGroups);
      
    } catch (indexError) {
      console.warn(`⚠️ Índice não disponível para categoria "${category}", usando fallback:`, indexError);
      
      // Fallback: Use the old method but more efficient
      const fallbackQuery = query(
        collection(db, "groups"),
        where("approved", "==", true)
      );
      
      const querySnapshot = await getDocs(fallbackQuery);
      const allGroups = querySnapshot.docs
        .map(doc => {
          const data = doc.data() as any;
          // Skip suspended groups early
          if (data.suspended === true) return null;
          
          const group = convertFirestoreGroup(doc);
          // Add recategorization data
          (group as any).lastRecategorizedAt = data.lastRecategorizedAt;
          (group as any).recategorizedCount = data.recategorizedCount || 0;
          // Mark if promoted
          (group as any).isPromoted = promotedGroupIds.includes(group.id);
          return group;
        })
        .filter(group => group !== null) // Remove suspended groups
        .filter(group => (group!.category || '').toString().trim().toLowerCase() === category.trim().toLowerCase());
      
      // Sort with PROMOTED GROUPS FIRST (same logic as above)
      allGroups.sort((a, b) => {
        const aPromoted = (a as any).isPromoted;
        const bPromoted = (b as any).isPromoted;
        
        // PRIORITY 0: Promoted groups always come first
        if (aPromoted && !bPromoted) return -1;
        if (bPromoted && !aPromoted) return 1;
        
        // For promoted groups, maintain their promotion order
        if (aPromoted && bPromoted) {
          const aPromotion = promotedGroups.find(pg => pg.groupId === a.id);
          const bPromotion = promotedGroups.find(pg => pg.groupId === b.id);
          
          // Sort by position if available, otherwise by start date
          if (aPromotion?.position && bPromotion?.position) {
            return aPromotion.position - bPromotion.position;
          }
          return (bPromotion?.startDate.getTime() || 0) - (aPromotion?.startDate.getTime() || 0);
        }
        
        // For non-promoted groups, use regular sorting
        const aHasImage = !!(a as any).profileImage;
        const bHasImage = !!(b as any).profileImage;
        
        // Priority 1: Groups with images come first
        if (aHasImage && !bHasImage) return -1;
        if (bHasImage && !aHasImage) return 1;
        
        // Priority 2: If both have same image status, sort by recategorization
        const aRecategorized = (a as any).lastRecategorizedAt;
        const bRecategorized = (b as any).lastRecategorizedAt;
        
        // If both have recategorization dates, sort by most recent recategorization
        if (aRecategorized && bRecategorized) {
          return bRecategorized.toDate().getTime() - aRecategorized.toDate().getTime();
        }
        
        // If only one has recategorization, prioritize it
        if (aRecategorized && !bRecategorized) return -1;
        if (bRecategorized && !aRecategorized) return 1;
        
        // Priority 3: If neither has recategorization, sort by creation date
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      console.log(`✅ FALLBACK: Encontrados ${allGroups.length} grupos para categoria "${category}" (${promotedGroups.length} promovidos)`);
      return filterBlockedGroups(allGroups);
    }
  } catch (error) {
    console.error(`❌ Erro ao buscar grupos da categoria "${category}":`, error);
    return [];
  }
};

// Get all approved groups
export const getAllGroups = async (): Promise<Group[]> => {
  try {
    const q = query(
      collection(db, "groups"),
      where("approved", "==", true)
    );
    const querySnapshot = await getDocs(q);
    const groups = querySnapshot.docs
      .map(doc => {
        const data = doc.data() as any;
        const group = convertFirestoreGroup(doc);
        // Add recategorization data
        (group as any).lastRecategorizedAt = data.lastRecategorizedAt;
        (group as any).recategorizedCount = data.recategorizedCount || 0;
        return group;
      })
      .filter(group => {
        // Manually filter out suspended groups
        const data = querySnapshot.docs.find(doc => doc.id === group.id)?.data() as any;
        return !(data?.suspended === true);
      });
    
    // Sort with priority: 1) groups with photos first, 2) recategorization, 3) creation date
    groups.sort((a, b) => {
      const aHasImage = !!(a as any).profileImage;
      const bHasImage = !!(b as any).profileImage;
      
      // Priority 1: Groups with images come first
      if (aHasImage && !bHasImage) return -1;
      if (bHasImage && !aHasImage) return 1;
      
      // Priority 2: If both have same image status, sort by recategorization
      const aRecategorized = (a as any).lastRecategorizedAt;
      const bRecategorized = (b as any).lastRecategorizedAt;
      
      // If both have recategorization dates, sort by most recent recategorization
      if (aRecategorized && bRecategorized) {
        return bRecategorized.toDate().getTime() - aRecategorized.toDate().getTime();
      }
      
      // If only one has recategorization, prioritize it
      if (aRecategorized && !bRecategorized) return -1;
      if (bRecategorized && !aRecategorized) return 1;
      
      // Priority 3: If neither has recategorization, sort by creation date
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    
    return filterBlockedGroups(groups);
  } catch (error) {
    console.error("Error getting all groups: ", error);
    return [];
  }
};

// Search groups with intelligent search
export const searchGroups = async (searchTerm: string, category?: string): Promise<Group[]> => {
  try {
    // Import the intelligent search service
    const { intelligentSearch } = await import('./intelligentSearchService');
    
    // Query only approved groups; filter by category client-side for consistency
    const q = query(
      collection(db, "groups"),
      where("approved", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    let allGroups = querySnapshot.docs
      .map(doc => {
        const data = doc.data() as any;
        const group = convertFirestoreGroup(doc);
        // Add recategorization data
        (group as any).lastRecategorizedAt = data.lastRecategorizedAt;
        (group as any).recategorizedCount = data.recategorizedCount || 0;
        return group;
      })
      .filter(group => {
        // Manually filter out suspended groups
        const data = querySnapshot.docs.find(doc => doc.id === group.id)?.data() as any;
        return !(data?.suspended === true);
      });
    
    // Optional category filter (client-side)
    let result = allGroups;
    if (category && category !== 'all') {
      const normalized = category.trim().toLowerCase();
      result = result.filter(g => (g.category || '').toString().trim().toLowerCase() === normalized);
    }

    // Use intelligent search if there's a search term
    if (searchTerm.trim()) {
      try {
        // Try intelligent search first
        result = await intelligentSearch(searchTerm, result);
        console.log(`🧠 Busca inteligente encontrou ${result.length} resultados para "${searchTerm}"`);
      } catch (error) {
        console.warn("Busca inteligente falhou, usando busca tradicional:", error);
        
        // Fallback to traditional search
        const lowerSearchTerm = searchTerm.toLowerCase();
        result = result.filter(group => {
          // Import decodeHtmlEntities here to avoid circular imports
          const decodeHtml = (text: string) => {
            if (!text) return text;
            return text
              .replace(/&#39;/g, "'")
              .replace(/&#33;/g, "!")
              .replace(/&#34;/g, '"')
              .replace(/&#38;/g, "&")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'");
          };
          
          const decodedName = decodeHtml(group.name);
          const decodedDescription = decodeHtml(group.description);
          
          // Enhanced traditional search with word matching
          const searchWords = lowerSearchTerm.split(/\s+/);
          return searchWords.some(word => {
            if (word.length < 2) return false;
            return decodedName.toLowerCase().includes(word) ||
                   decodedDescription.toLowerCase().includes(word);
          }) || decodedName.toLowerCase().includes(lowerSearchTerm) ||
             decodedDescription.toLowerCase().includes(lowerSearchTerm);
        });
      }
    } else {
      // Sort with priority: 1) groups with photos first, 2) recategorization, 3) creation date
      result.sort((a, b) => {
        const aHasImage = !!(a as any).profileImage;
        const bHasImage = !!(b as any).profileImage;
        
        // Priority 1: Groups with images come first
        if (aHasImage && !bHasImage) return -1;
        if (bHasImage && !aHasImage) return 1;
        
        // Priority 2: If both have same image status, sort by recategorization
        const aRecategorized = (a as any).lastRecategorizedAt;
        const bRecategorized = (b as any).lastRecategorizedAt;
        
        // If both have recategorization dates, sort by most recent recategorization
        if (aRecategorized && bRecategorized) {
          return bRecategorized.toDate().getTime() - aRecategorized.toDate().getTime();
        }
        
        // If only one has recategorization, prioritize it
        if (aRecategorized && !bRecategorized) return -1;
        if (bRecategorized && !aRecategorized) return 1;
        
        // Priority 3: If neither has recategorization, sort by creation date
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }
    
    return filterBlockedGroups(result);
  } catch (error) {
    console.error("Error searching groups: ", error);
    return [];
  }
};

// Get popular groups (most members)
export const getPopularGroups = async (limitCount: number = 10): Promise<Group[]> => {
  try {
    const q = query(
      collection(db, "groups"),
      where("approved", "==", true)
    );
    const querySnapshot = await getDocs(q);
    const groups = querySnapshot.docs
      .map(convertFirestoreGroup)
      .filter(group => {
        // Manually filter out suspended groups
        const data = querySnapshot.docs.find(doc => doc.id === group.id)?.data() as any;
        return !(data?.suspended === true);
      });
    
    // Sort by membersCount in JavaScript and limit
    groups.sort((a, b) => (b.membersCount || 0) - (a.membersCount || 0));
    
    return filterBlockedGroups(groups).slice(0, limitCount);
  } catch (error) {
    console.error("Error getting popular groups: ", error);
    return [];
  }
};

// Get recent groups
export const getRecentGroups = async (limitCount: number = 10): Promise<Group[]> => {
  try {
    const q = query(
      collection(db, "groups"),
      where("approved", "==", true)
    );
    const querySnapshot = await getDocs(q);
    const groups = querySnapshot.docs
      .map(convertFirestoreGroup)
      .filter(group => {
        // Manually filter out suspended groups
        const data = querySnapshot.docs.find(doc => doc.id === group.id)?.data() as any;
        return !(data?.suspended === true);
      });
    
    // Sort by createdAt in JavaScript and limit
    groups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return filterBlockedGroups(groups).slice(0, limitCount);
  } catch (error) {
    console.error("Error getting recent groups: ", error);
    return [];
  }
};

// Check if group already exists by Telegram URL
export const checkGroupExists = async (telegramUrl: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, "groups"),
      where("telegramUrl", "==", telegramUrl),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Error checking if group exists: ", error);
    return false;
  }
};