import { 
  collection, 
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { setPopularGroup, removePopularGroup } from "./popularGroupsService";

export interface PromotedGroup {
  id: string; // document ID
  groupId: string; // reference to the group
  groupName: string;
  telegramUrl: string;
  imageUrl?: string;
  category: string;
  planId: string;
  planName: string;
  planDuration: number; // in days
  startDate: Date;
  endDate: Date;
  position?: number; // position in category (1-10)
  paymentStatus: 'pending' | 'paid' | 'expired';
  pixCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PROMOTED_GROUPS_COLLECTION = "promotedGroups";

// Add a new promotion (after payment confirmation)
export const addPromotedGroup = async (
  groupId: string,
  groupName: string,
  telegramUrl: string,
  category: string,
  planId: string,
  planName: string,
  planDuration: number,
  imageUrl?: string
): Promise<string> => {
  try {
    const now = new Date();
    const endDate = new Date(now.getTime() + (planDuration * 24 * 60 * 60 * 1000));
    
    const promotionData: Omit<PromotedGroup, 'id'> = {
      groupId,
      groupName,
      telegramUrl,
      imageUrl,
      category,
      planId,
      planName,
      planDuration,
      startDate: now,
      endDate,
      paymentStatus: 'paid',
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(collection(db, PROMOTED_GROUPS_COLLECTION), promotionData);
    
    // Try to add to popular groups (get next available position)
    await assignPopularPosition(docRef.id, groupId, groupName, telegramUrl, category, imageUrl);
    
    console.log(`✅ Grupo promovido adicionado: ${docRef.id} - ${groupName}`);
    return docRef.id;
  } catch (error) {
    console.error("❌ Erro ao adicionar grupo promovido:", error);
    throw error;
  }
};

// Assign a popular position to a promoted group
const assignPopularPosition = async (
  promotionId: string,
  groupId: string,
  groupName: string,
  telegramUrl: string,
  category: string,
  imageUrl?: string
): Promise<void> => {
  try {
    // Find next available position (1-10)
    const { getAvailablePositions } = await import('./popularGroupsService');
    const availablePositions = await getAvailablePositions(category);
    
    if (availablePositions.length > 0) {
      const position = availablePositions[0]; // Take first available position
      
      // Set as popular group
      await setPopularGroup(groupId, category, position, groupName, telegramUrl, imageUrl);
      
      // Update promotion with position
      const promotionRef = doc(db, PROMOTED_GROUPS_COLLECTION, promotionId);
      await updateDoc(promotionRef, { 
        position,
        updatedAt: new Date()
      });
      
      console.log(`✅ Grupo promovido posicionado na posição ${position} da categoria ${category}`);
    } else {
      console.log(`⚠️ Todas as posições da categoria ${category} estão ocupadas`);
    }
  } catch (error) {
    console.error("❌ Erro ao atribuir posição popular:", error);
  }
};

// Get all active promoted groups
export const getActivePromotedGroups = async (): Promise<PromotedGroup[]> => {
  try {
    const now = new Date();
    const q = query(
      collection(db, PROMOTED_GROUPS_COLLECTION),
      where("paymentStatus", "==", "paid"),
      where("endDate", ">", now),
      orderBy("endDate"),
      orderBy("startDate")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate() || new Date(),
      endDate: doc.data().endDate?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as PromotedGroup[];
  } catch (error) {
    console.error("❌ Erro ao buscar grupos promovidos ativos:", error);
    return [];
  }
};

// Get active promoted groups by category
export const getActivePromotedGroupsByCategory = async (category: string): Promise<PromotedGroup[]> => {
  try {
    const now = new Date();
    const q = query(
      collection(db, PROMOTED_GROUPS_COLLECTION),
      where("category", "==", category),
      where("paymentStatus", "==", "paid"),
      where("endDate", ">", now),
      orderBy("endDate"),
      orderBy("startDate")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate() || new Date(),
      endDate: doc.data().endDate?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as PromotedGroup[];
  } catch (error) {
    console.error("❌ Erro ao buscar grupos promovidos por categoria:", error);
    return [];
  }
};

// Check and expire old promotions
export const expireOldPromotions = async (): Promise<void> => {
  try {
    const now = new Date();
    const q = query(
      collection(db, PROMOTED_GROUPS_COLLECTION),
      where("paymentStatus", "==", "paid"),
      where("endDate", "<=", now)
    );
    
    const querySnapshot = await getDocs(q);
    const expiredPromotions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PromotedGroup[];
    
    // Remove from popular groups and update status
    for (const promotion of expiredPromotions) {
      try {
        // Remove from popular groups if has position
        if (promotion.position) {
          await removePopularGroup(promotion.category, promotion.position);
        }
        
        // Update status to expired
        const promotionRef = doc(db, PROMOTED_GROUPS_COLLECTION, promotion.id);
        await updateDoc(promotionRef, {
          paymentStatus: 'expired',
          updatedAt: new Date()
        });
        
        console.log(`✅ Promoção expirada: ${promotion.groupName}`);
      } catch (error) {
        console.error(`❌ Erro ao expirar promoção ${promotion.id}:`, error);
      }
    }
    
    if (expiredPromotions.length > 0) {
      console.log(`✅ ${expiredPromotions.length} promoções expiradas processadas`);
    }
  } catch (error) {
    console.error("❌ Erro ao processar promoções expiradas:", error);
  }
};

// Mark promotion as paid (webhook/payment confirmation)
export const markPromotionAsPaid = async (
  promotionId: string,
  groupData: {
    groupId: string;
    groupName: string;
    telegramUrl: string;
    category: string;
    imageUrl?: string;
  }
): Promise<void> => {
  try {
    const promotionRef = doc(db, PROMOTED_GROUPS_COLLECTION, promotionId);
    const promotionDoc = await getDoc(promotionRef);
    
    if (!promotionDoc.exists()) {
      throw new Error('Promoção não encontrada');
    }
    
    // Update payment status
    await updateDoc(promotionRef, {
      paymentStatus: 'paid',
      updatedAt: new Date()
    });
    
    // Assign popular position
    await assignPopularPosition(
      promotionId,
      groupData.groupId,
      groupData.groupName,
      groupData.telegramUrl,
      groupData.category,
      groupData.imageUrl
    );
    
    console.log(`✅ Promoção marcada como paga: ${promotionId}`);
  } catch (error) {
    console.error("❌ Erro ao marcar promoção como paga:", error);
    throw error;
  }
};

// Get promotion by payment data (for webhook processing)
export const getPromotionByPixCode = async (pixCode: string): Promise<PromotedGroup | null> => {
  try {
    const q = query(
      collection(db, PROMOTED_GROUPS_COLLECTION),
      where("pixCode", "==", pixCode)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      startDate: doc.data().startDate?.toDate() || new Date(),
      endDate: doc.data().endDate?.toDate() || new Date(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    } as PromotedGroup;
  } catch (error) {
    console.error("❌ Erro ao buscar promoção por PIX:", error);
    return null;
  }
};

// Initialize promotion tracking (call when PIX is generated)
export const initializePromotion = async (
  groupData: {
    groupId: string;
    groupName: string;
    telegramUrl: string;
    category: string;
    imageUrl?: string;
  },
  planData: {
    planId: string;
    planName: string;
    planDuration: number;
  },
  pixCode: string
): Promise<string> => {
  try {
    const now = new Date();
    const endDate = new Date(now.getTime() + (planData.planDuration * 24 * 60 * 60 * 1000));
    
    const promotionData: Omit<PromotedGroup, 'id'> = {
      groupId: groupData.groupId,
      groupName: groupData.groupName,
      telegramUrl: groupData.telegramUrl,
      imageUrl: groupData.imageUrl,
      category: groupData.category,
      planId: planData.planId,
      planName: planData.planName,
      planDuration: planData.planDuration,
      startDate: now,
      endDate,
      paymentStatus: 'pending',
      pixCode,
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(collection(db, PROMOTED_GROUPS_COLLECTION), promotionData);
    console.log(`✅ Promoção inicializada: ${docRef.id} - ${groupData.groupName}`);
    return docRef.id;
  } catch (error) {
    console.error("❌ Erro ao inicializar promoção:", error);
    throw error;
  }
};