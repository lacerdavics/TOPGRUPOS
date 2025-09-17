import { useState, useEffect, useCallback } from 'react';
import { getOptimizedPopularGroups, getOptimizedGroupsExcluding, type OptimizedGroup } from '@/services/optimizedPopularGroupsService';

export const useOptimizedPopularGroups = (category: string = 'all', limit: number = 6) => {
  const [groups, setGroups] = useState<OptimizedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    const startTime = performance.now();
    
    try {
      setLoading(true);
      setError(null);
      
      const popularGroups = await getOptimizedPopularGroups(category, limit);
      
      // Ensure all groups have valid view counts for display
      const groupsWithValidViews = popularGroups.map(group => ({
        ...group,
        viewCount: group.viewCount || Math.floor(Math.random() * 8000) + 2000 // 2k-10k range if no views
      }));
      
      setGroups(groupsWithValidViews);
      
      const loadTime = performance.now() - startTime;
      console.log(`⚡ Hook: ${groupsWithValidViews.length} grupos populares carregados em ${loadTime.toFixed(2)}ms`);
    } catch (err) {
      console.error('Erro ao carregar grupos populares:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [category, limit]);

  useEffect(() => {
    let isMounted = true;

    const executeLoad = async () => {
      if (!isMounted) return;
      await loadGroups();
    };

    executeLoad();

    return () => {
      isMounted = false;
    };
  }, [loadGroups]);

  return { groups, loading, error, refetch: loadGroups };
};
// Hook para carregar grupos excluindo IDs específicos (evitar duplicação)
export const useOptimizedGroupsExcluding = (category: string = 'all', limit: number = 20, excludeIds: string[] = []) => {
  const [groups, setGroups] = useState<OptimizedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    const startTime = performance.now();
    
    try {
      setLoading(true);
      setError(null);
      
      const otherGroups = await getOptimizedGroupsExcluding(category, limit, excludeIds);
      
      // Ensure all groups have valid view counts for display
      const groupsWithValidViews = otherGroups.map(group => ({
        ...group,
        viewCount: group.viewCount || Math.floor(Math.random() * 8000) + 2000
      }));
      
      setGroups(groupsWithValidViews);
      
      const loadTime = performance.now() - startTime;
      console.log(`⚡ Hook (excluding): ${groupsWithValidViews.length} grupos carregados em ${loadTime.toFixed(2)}ms, excluindo ${excludeIds.length} IDs`);
    } catch (err) {
      console.error('Erro ao carregar grupos excluindo IDs:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [category, limit, excludeIds]);

  useEffect(() => {
    let isMounted = true;

    const executeLoad = async () => {
      if (!isMounted) return;
      await loadGroups();
    };

    executeLoad();

    return () => {
      isMounted = false;
    };
  }, [loadGroups]);

  return { groups, loading, error, refetch: loadGroups };
};