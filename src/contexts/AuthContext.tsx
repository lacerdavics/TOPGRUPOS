import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserInFirestore, updateUserLastLogin, checkIsAdmin } from '@/services/userService';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔵 AuthContext: Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔵 AuthContext: Auth state changed', user ? 'User logged in' : 'User logged out');
      setCurrentUser(user);
      
      if (user) {
        // Update last login
        await updateUserLastLogin(user.uid);
      }
      
      console.log('🔵 AuthContext: Setting loading to false');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user document in Firestore
    await createUserInFirestore(userCredential.user);
  };

  const login = async (email: string, password: string) => {
    console.log('🔵 AuthContext: Login function called with email:', email);
    console.log('🔵 AuthContext: Firebase auth instance:', !!auth);
    
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('🟢 AuthContext: Login successful, user:', result.user.email);
    } catch (error: any) {
      console.log('🔴 AuthContext: Login error:', error);
      console.log('📢 Toast: Tentando mostrar toast de erro...');
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    console.log('🔵 AuthContext: Reset password function called with email:', email);
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('🟢 AuthContext: Password reset email sent successfully');
    } catch (error: any) {
      console.error('🔴 AuthContext: Reset password error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    login,
    register,
    resetPassword,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};