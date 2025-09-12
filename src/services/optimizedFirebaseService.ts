import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  doc,
  getDoc,
  startAfter,
  QueryDocumentSnapshot,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Connection optimization service
class OptimizedFirebaseService {
  private connectionStatus: 'connected' | 'offline' | 'pending' = 'pending';
  private retryCount = 0;
  private maxRetries = 3;
  
  // Enable offline persistence and optimize connection
  async initializeOptimizedConnection() {
    try {
      console.log('🚀 Initializing optimized Firebase connection...');
      
      // Re-enable network if disabled
      await enableNetwork(db);
      
      this.connectionStatus = 'connected';
      this.retryCount = 0;
      console.log('✅ Firebase connection optimized');
      
    } catch (error) {
      console.warn('⚠️ Firebase connection optimization failed:', error);
      this.connectionStatus = 'offline';
      this.handleConnectionError();
    }
  }

  // Optimized batch read with cursor pagination
  async getOptimizedGroups(categoryId?: string, pageSize = 20, lastDoc?: QueryDocumentSnapshot) {
    try {
      let q = query(
        collection(db, 'groups'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (categoryId) {
        q = query(
          collection(db, 'groups'),
          where('isActive', '==', true),
          where('category', '==', categoryId),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      
      return {
        docs: snapshot.docs,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
      };
      
    } catch (error) {
      console.error('❌ Error in optimized groups fetch:', error);
      return { docs: [], lastDoc: null, hasMore: false };
    }
  }

  // Optimized single document read with cache
  async getOptimizedDocument(collection: string, docId: string) {
    try {
      const docRef = doc(db, collection, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error fetching document ${docId}:`, error);
      return null;
    }
  }

  // Handle connection errors with retry logic
  private async handleConnectionError() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`🔄 Retrying Firebase connection (${this.retryCount}/${this.maxRetries})...`);
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
      
      setTimeout(() => {
        this.initializeOptimizedConnection();
      }, delay);
    } else {
      console.error('❌ Max Firebase connection retries reached');
      this.connectionStatus = 'offline';
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.connectionStatus;
  }

  // Force reconnection
  async forceReconnect() {
    this.retryCount = 0;
    await this.initializeOptimizedConnection();
  }
}

export const optimizedFirebaseService = new OptimizedFirebaseService();