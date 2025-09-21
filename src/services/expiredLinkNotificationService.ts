import { addDoc, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ExpiredLinkNotification {
  id?: string;
  userId: string; // trocamos de userEmail → userId (uid do Firebase)
  groupName: string;
  groupId: string;
  telegramUrl: string;
  createdAt: Date;
  notified: boolean;
  notifiedAt?: Date;
}

// Criar notificação sobre link expirado
export const createExpiredLinkNotification = async (
  userId: string,
  groupName: string,
  groupId: string,
  telegramUrl: string
): Promise<void> => {
  try {
    await addDoc(collection(db, 'expired_link_notifications'), {
      userId,
      groupName,
      groupId,
      telegramUrl,
      createdAt: new Date(),
      notified: false
    });
    
    console.log(`📧 Notificação de link expirado criada para userId=${userId}`);
  } catch (error) {
    console.error('❌ Erro ao criar notificação de link expirado:', error);
    throw error;
  }
};

// Buscar notificações não enviadas (para uso interno, ex: admin/cron jobs)
export const getPendingNotifications = async (): Promise<ExpiredLinkNotification[]> => {
  try {
    const q = query(
      collection(db, 'expired_link_notifications'),
      where('notified', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as ExpiredLinkNotification[];
  } catch (error) {
    console.error('❌ Erro ao buscar notificações pendentes:', error);
    return [];
  }
};

// Marcar notificação como enviada
export const markNotificationAsSent = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'expired_link_notifications', notificationId);
    await updateDoc(notificationRef, {
      notified: true,
      notifiedAt: new Date()
    });
    
    console.log(`✅ Notificação marcada como enviada: ${notificationId}`);
  } catch (error) {
    console.error('❌ Erro ao marcar notificação como enviada:', error);
    throw error;
  }
};

// Buscar notificações de um usuário específico (pelo uid)
export const getUserNotifications = async (userId: string): Promise<ExpiredLinkNotification[]> => {
  try {
    const q = query(
      collection(db, 'expired_link_notifications'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      notifiedAt: doc.data().notifiedAt?.toDate()
    })) as ExpiredLinkNotification[];
  } catch (error) {
    console.error('❌ Erro ao buscar notificações do usuário:', error);
    return [];
  }
};
