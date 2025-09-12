import { 
  collection, 
  addDoc, 
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { User } from "firebase/auth";

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin: boolean;
  disabled?: boolean;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
}

// Create user in Firestore when registering
export const createUserInFirestore = async (user: User): Promise<void> => {
  try {
    const userData: UserData = {
      uid: user.uid,
      email: user.email || '',
      isAdmin: false, // Always false for new accounts
      createdAt: Timestamp.now(),
      lastLogin: Timestamp.now()
    };
    
    await setDoc(doc(db, "users", user.uid), userData);
    console.log('✅ Usuário criado no Firestore:', userData);
  } catch (error) {
    console.error("❌ Erro ao criar usuário no Firestore:", error);
    throw error;
  }
};

// Update user last login
export const updateUserLastLogin = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      lastLogin: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error("❌ Erro ao atualizar último login:", error);
  }
};

// Get user data from Firestore
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as UserData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("❌ Erro ao buscar dados do usuário:", error);
    return null;
  }
};

// Check if user is admin
export const checkIsAdmin = async (uid: string): Promise<boolean> => {
  try {
    console.log('🔍 Checking admin status for UID:', uid);
    
    // TEMPORARY: Auto-grant admin to specific user
    if (uid === 'xWb008uXFddy9WflNYsOi5d5wLv1') {
      console.log('🚨 EMERGENCY: Auto-granting admin to known user');
      await setAdminStatus(uid, true);
      return true;
    }
    
    const userData = await getUserData(uid);
    console.log('👤 User data:', userData);
    const isAdmin = userData?.isAdmin || false;
    console.log('🔐 Is admin:', isAdmin);
    return isAdmin;
  } catch (error) {
    console.error("❌ Erro ao verificar se usuário é admin:", error);
    return false;
  }
};

// Set admin status for a user (emergency function)
export const setAdminStatus = async (uid: string, isAdmin: boolean): Promise<void> => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      isAdmin: isAdmin,
      lastLogin: Timestamp.now()
    }, { merge: true });
    console.log(`✅ Admin status set to ${isAdmin} for user:`, uid);
  } catch (error) {
    console.error("❌ Erro ao definir status de admin:", error);
    throw error;
  }
};

// Get all users (admin only)
export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const q = query(
      collection(db, "users"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserData);
  } catch (error) {
    console.error("❌ Erro ao buscar todos os usuários:", error);
    return [];
  }
};