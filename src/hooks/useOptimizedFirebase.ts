import { useEffect, useState, useCallback } from 'react';
import { optimizedFirebaseService } from '@/services/optimizedFirebaseService';
import { QueryDocumentSnapshot } from 'firebase/firestore';

interface UseOptimizedGroupsResult {
  groups: any[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  connectionStatus: 'connected' | 'offline' | 'pending';
}

export const useOptimizedGroups = (categoryId?: string, pageSize = 20): UseOptimizedGroupsResult => {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'offline' | 'pending'>('pending');

  // Initialize optimized connection
  useEffect(() => {
    const initConnection = async () => {
      await optimizedFirebaseService.initializeOptimizedConnection();
      setConnectionStatus(optimizedFirebaseService.getConnectionStatus());
    };
    
    initConnection();
  }, []);

  // Load initial groups
  const loadGroups = useCallback(async (reset = false) => {
    try {
      setError(null);
      if (reset) {
        setLoading(true);
        setGroups([]);
        setLastDoc(null);
      }

      const result = await optimizedFirebaseService.getOptimizedGroups(
        categoryId, 
        pageSize, 
        reset ? undefined : lastDoc
      );

      if (reset) {
        setGroups(result.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        setGroups(prev => [...prev, ...result.docs.map(doc => ({ id: doc.id, ...doc.data() }))]);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      setConnectionStatus(optimizedFirebaseService.getConnectionStatus());
      
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar grupos');
      console.error('❌ Error loading groups:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryId, pageSize, lastDoc]);

  // Load more groups
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadGroups(false);
    }
  }, [loading, hasMore, loadGroups]);

  // Refresh groups
  const refresh = useCallback(() => {
    loadGroups(true);
  }, [loadGroups]);

  // Load groups when category changes
  useEffect(() => {
    loadGroups(true);
  }, [categoryId]);

  return {
    groups,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    connectionStatus
  };
};

// Hook for connection monitoring
export const useFirebaseConnection = () => {
  const [status, setStatus] = useState<'connected' | 'offline' | 'pending'>('pending');

  useEffect(() => {
    const checkConnection = () => {
      setStatus(optimizedFirebaseService.getConnectionStatus());
    };

    // Check every 5 seconds
    const interval = setInterval(checkConnection, 5000);
    checkConnection();

    return () => clearInterval(interval);
  }, []);

  const forceReconnect = useCallback(async () => {
    await optimizedFirebaseService.forceReconnect();
    setStatus(optimizedFirebaseService.getConnectionStatus());
  }, []);

  return { status, forceReconnect };
};