import { 
  collection, 
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface PopularGroupConfig {
  id: string;
  groupId: string;
  groupName: string;
  telegramUrl: string;
  category: string;
  position: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const POPULAR_GROUPS_COLLECTION = "popularGroupsConfig";
const GENERAL_POPULAR_GROUPS_COLLECTION = "generalPopularGroups";

// Set a group as popular in a specific category and position
export const setPopularGroup = async (
  groupId: string,
  category: string,
  position: number,
  groupName: string,
  telegramUrl: string,
  imageUrl?: string
): Promise<void> => {
  try {
    const configId = `${category}_${position}`;
    const configData: Omit<PopularGroupConfig, 'id'> = {
      groupId,
      groupName,
      telegramUrl,
      category,
      position,
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(doc(db, POPULAR_GROUPS_COLLECTION, configId), configData);
    console.log(`✅ Grupo popular definido: ${groupName} na posição ${position} da categoria ${category}`);
  } catch (error) {
    console.error("❌ Erro ao definir grupo popular:", error);
    throw error;
  }
};

// Remove a popular group from a specific category and position
export const removePopularGroup = async (category: string, position: number): Promise<void> => {
  try {
    const configId = `${category}_${position}`;
    await deleteDoc(doc(db, POPULAR_GROUPS_COLLECTION, configId));
    console.log(`✅ Grupo popular removido da posição ${position} da categoria ${category}`);
  } catch (error) {
    console.error("❌ Erro ao remover grupo popular:", error);
    throw error;
  }
};

// Get all configured popular groups
export const getConfiguredPopularGroups = async (): Promise<PopularGroupConfig[]> => {
  try {
    const q = query(
      collection(db, POPULAR_GROUPS_COLLECTION),
      orderBy("category"),
      orderBy("position")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as PopularGroupConfig[];
  } catch (error) {
    console.error("❌ Erro ao buscar grupos populares configurados:", error);
    return [];
  }
};

// Get configured popular groups by category
export const getConfiguredPopularGroupsByCategory = async (category: string): Promise<PopularGroupConfig[]> => {
  try {
    const q = query(
      collection(db, POPULAR_GROUPS_COLLECTION),
      where("category", "==", category),
      orderBy("position")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as PopularGroupConfig[];
  } catch (error) {
    console.error("❌ Erro ao buscar grupos populares por categoria:", error);
    return [];
  }
};

// Get available positions in a category (1-10)
export const getAvailablePositions = async (category: string): Promise<number[]> => {
  try {
    const configuredGroups = await getConfiguredPopularGroupsByCategory(category);
    const usedPositions = configuredGroups.map(config => config.position);
    
    const allPositions = Array.from({ length: 10 }, (_, i) => i + 1);
    return allPositions.filter(pos => !usedPositions.includes(pos));
  } catch (error) {
    console.error("❌ Erro ao buscar posições disponíveis:", error);
    return [];
  }
};

// Set general popular group (for homepage)
export const setGeneralPopularGroup = async (
  groupId: string,
  position: number,
  groupName: string,
  telegramUrl: string,
  category: string,
  imageUrl?: string
): Promise<void> => {
  try {
    const configId = `general_${position}`;
    const configData = {
      groupId,
      groupName,
      telegramUrl,
      category,
      position,
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(doc(db, GENERAL_POPULAR_GROUPS_COLLECTION, configId), configData);
    console.log(`✅ Grupo popular geral definido: ${groupName} na posição ${position}`);
  } catch (error) {
    console.error("❌ Erro ao definir grupo popular geral:", error);
    throw error;
  }
};

// Remove general popular group
export const removeGeneralPopularGroup = async (position: number): Promise<void> => {
  try {
    const configId = `general_${position}`;
    await deleteDoc(doc(db, GENERAL_POPULAR_GROUPS_COLLECTION, configId));
    console.log(`✅ Grupo popular geral removido da posição ${position}`);
  } catch (error) {
    console.error("❌ Erro ao remover grupo popular geral:", error);
    throw error;
  }
};

// Get all general popular groups
export const getGeneralPopularGroups = async (): Promise<PopularGroupConfig[]> => {
  try {
    const q = query(
      collection(db, GENERAL_POPULAR_GROUPS_COLLECTION),
      orderBy("position")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as PopularGroupConfig[];
  } catch (error) {
    console.error("❌ Erro ao buscar grupos populares gerais:", error);
    return [];
  }
};

// Check if a group is configured as popular
export const isGroupPopular = async (groupId: string, category?: string): Promise<boolean> => {
  try {
    if (category) {
      const categoryGroups = await getConfiguredPopularGroupsByCategory(category);
      return categoryGroups.some(config => config.groupId === groupId);
    } else {
      const allGroups = await getConfiguredPopularGroups();
      return allGroups.some(config => config.groupId === groupId);
    }
  } catch (error) {
    console.error("❌ Erro ao verificar se grupo é popular:", error);
    return false;
  }
};

// Get popular group configuration by group ID
export const getPopularGroupConfig = async (groupId: string): Promise<PopularGroupConfig | null> => {
  try {
    const allConfigs = await getConfiguredPopularGroups();
    return allConfigs.find(config => config.groupId === groupId) || null;
  } catch (error) {
    console.error("❌ Erro ao buscar configuração do grupo popular:", error);
    return null;
  }
};

// Update popular group configuration
export const updatePopularGroupConfig = async (
  configId: string,
  updates: Partial<Omit<PopularGroupConfig, 'id' | 'createdAt'>>
): Promise<void> => {
  try {
    const configRef = doc(db, POPULAR_GROUPS_COLLECTION, configId);
    await setDoc(configRef, {
      ...updates,
      updatedAt: new Date()
    }, { merge: true });
    
    console.log(`✅ Configuração do grupo popular atualizada: ${configId}`);
  } catch (error) {
    console.error("❌ Erro ao atualizar configuração do grupo popular:", error);
    throw error;
  }
};