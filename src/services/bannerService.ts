import { 
  collection, 
  addDoc, 
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export interface Banner {
  id?: string;
  imageUrl: string;
  fileName: string;
  fileSize: number;
  durationDays: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  uploadedBy: string; // UID do admin
  uploaderEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const BANNERS_COLLECTION = "banners";
const BANNERS_STORAGE_PATH = "banners";

// Upload banner to Firebase Storage and save metadata to Firestore
export const uploadBanner = async (
  file: File, 
  durationDays: number, 
  userId: string,
  userEmail: string
): Promise<string> => {
  try {
    console.log('🚀 Iniciando upload de banner:', {
      fileName: file.name,
      fileSize: Math.round(file.size / 1024) + ' KB',
      durationDays,
      userId
    });

    // Validate file type
    if (!file.type.includes('webp')) {
      throw new Error('Apenas arquivos WebP são aceitos');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Arquivo muito grande. Máximo 10MB');
    }

    // Deactivate any existing active banner first
    await deactivateAllBanners();

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `banner_${timestamp}_${file.name}`;
    const filePath = `${BANNERS_STORAGE_PATH}/${fileName}`;

    console.log('📁 Fazendo upload para:', filePath);

    // Upload to Firebase Storage
    const storageRef = ref(storage, filePath);
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: file.type,
      cacheControl: 'public,max-age=31536000', // Cache for 1 year
    });

    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log('✅ Upload concluído, URL:', downloadURL);

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + durationDays);

    // Save metadata to Firestore
    const bannerData: Omit<Banner, 'id'> = {
      imageUrl: downloadURL,
      fileName: file.name,
      fileSize: file.size,
      durationDays,
      startDate,
      endDate,
      isActive: true,
      uploadedBy: userId,
      uploaderEmail: userEmail,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, BANNERS_COLLECTION), bannerData);
    console.log('✅ Banner salvo no Firestore com ID:', docRef.id);

    return docRef.id;
  } catch (error) {
    console.error('❌ Erro ao fazer upload do banner:', error);
    throw error;
  }
};

// Get currently active banner
export const getActiveBanner = async (): Promise<Banner | null> => {
  try {
    const now = new Date();
    // First get all active banners, then filter by endDate in memory
    // This avoids the complex composite index requirement
    const q = query(
      collection(db, BANNERS_COLLECTION),
      where("isActive", "==", true)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    // Filter active banners that haven't expired and get the most recent one
    const activeBanners = querySnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as Banner;
      })
      .filter(banner => banner.endDate > now)
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime()); // Sort by endDate desc

    if (activeBanners.length === 0) {
      return null;
    }

    // Return the banner with the latest end date
    return activeBanners[0];
  } catch (error) {
    console.error('❌ Erro ao buscar banner ativo:', error);
    return null;
  }
};

// Get all banners (for admin management)
export const getAllBanners = async (): Promise<Banner[]> => {
  try {
    const q = query(
      collection(db, BANNERS_COLLECTION),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Banner;
    });
  } catch (error) {
    console.error('❌ Erro ao buscar todos os banners:', error);
    return [];
  }
};

// Deactivate a specific banner
export const deactivateBanner = async (bannerId: string): Promise<void> => {
  try {
    const bannerRef = doc(db, BANNERS_COLLECTION, bannerId);
    await updateDoc(bannerRef, {
      isActive: false,
      updatedAt: new Date()
    });
    
    console.log('✅ Banner desativado:', bannerId);
  } catch (error) {
    console.error('❌ Erro ao desativar banner:', error);
    throw error;
  }
};

// Deactivate all banners (used before uploading new one)
export const deactivateAllBanners = async (): Promise<void> => {
  try {
    const q = query(
      collection(db, BANNERS_COLLECTION),
      where("isActive", "==", true)
    );

    const querySnapshot = await getDocs(q);
    
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        isActive: false,
        updatedAt: new Date()
      })
    );

    await Promise.all(updatePromises);
    console.log(`✅ ${querySnapshot.docs.length} banners desativados`);
  } catch (error) {
    console.error('❌ Erro ao desativar todos os banners:', error);
    throw error;
  }
};

// Delete banner (remove from both Firestore and Storage)
export const deleteBanner = async (bannerId: string, imageUrl: string): Promise<void> => {
  try {
    console.log('🗑️ Deletando banner:', bannerId);

    // Delete from Firestore
    await deleteDoc(doc(db, BANNERS_COLLECTION, bannerId));
    console.log('✅ Banner removido do Firestore');

    // Delete from Storage
    try {
      // Extract storage path from URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)$/);
      if (pathMatch) {
        const storagePath = decodeURIComponent(pathMatch[1]);
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
        console.log('✅ Arquivo removido do Storage');
      }
    } catch (storageError) {
      console.warn('⚠️ Erro ao remover arquivo do Storage (pode já ter sido removido):', storageError);
    }

    console.log('✅ Banner deletado completamente');
  } catch (error) {
    console.error('❌ Erro ao deletar banner:', error);
    throw error;
  }
};

// Check and expire old banners (can be called periodically)
export const expireOldBanners = async (): Promise<void> => {
  try {
    const now = new Date();
    const q = query(
      collection(db, BANNERS_COLLECTION),
      where("isActive", "==", true),
      where("endDate", "<=", now)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return;
    }

    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        isActive: false,
        updatedAt: new Date()
      })
    );

    await Promise.all(updatePromises);
    console.log(`✅ ${querySnapshot.docs.length} banners expirados automaticamente`);
  } catch (error) {
    console.error('❌ Erro ao expirar banners antigos:', error);
  }
};

// Extend banner duration
export const extendBannerDuration = async (
  bannerId: string, 
  additionalDays: number
): Promise<void> => {
  try {
    const bannerRef = doc(db, BANNERS_COLLECTION, bannerId);
    const bannerDoc = await getDoc(bannerRef);
    
    if (!bannerDoc.exists()) {
      throw new Error('Banner não encontrado');
    }

    const currentEndDate = bannerDoc.data().endDate?.toDate() || new Date();
    const newEndDate = new Date(currentEndDate);
    newEndDate.setDate(newEndDate.getDate() + additionalDays);

    await updateDoc(bannerRef, {
      endDate: newEndDate,
      durationDays: bannerDoc.data().durationDays + additionalDays,
      updatedAt: new Date()
    });

    console.log(`✅ Duração do banner estendida por ${additionalDays} dias`);
  } catch (error) {
    console.error('❌ Erro ao estender duração do banner:', error);
    throw error;
  }
};

// Get banner statistics
export const getBannerStats = async (): Promise<{
  totalBanners: number;
  activeBanners: number;
  expiredBanners: number;
}> => {
  try {
    const allBannersQuery = query(collection(db, BANNERS_COLLECTION));
    const allBannersSnapshot = await getDocs(allBannersQuery);
    
    const now = new Date();
    let activeBanners = 0;
    let expiredBanners = 0;
    
    allBannersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const endDate = data.endDate?.toDate() || new Date();
      
      if (data.isActive && endDate > now) {
        activeBanners++;
      } else if (endDate <= now) {
        expiredBanners++;
      }
    });

    return {
      totalBanners: allBannersSnapshot.size,
      activeBanners,
      expiredBanners
    };
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas dos banners:', error);
    return {
      totalBanners: 0,
      activeBanners: 0,
      expiredBanners: 0
    };
  }
};