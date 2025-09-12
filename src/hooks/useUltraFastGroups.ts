import { useState, useEffect } from 'react';
import { getUltraFastPopularGroups, type UltraFastGroup } from '@/services/ultraFastGroupService';

export const useUltraFastGroups = (limit: number = 6) => {
  const [groups, setGroups] = useState<UltraFastGroup[]>([]);
  const [loading, setLoading] = useState(false); // Start as false for instant display
  const [error, setError] = useState<string | null>(null);

  const loadGroups = async () => {
    const startTime = performance.now();
    
    try {
      setError(null);
      setLoading(true);
      
      // Get groups instantly (fallback + background fetch)
      const popularGroups = await getUltraFastPopularGroups(limit);
      
      setGroups(popularGroups);
      
      const loadTime = performance.now() - startTime;
      console.log(`⚡ Ultra-fast hook: ${popularGroups.length} grupos carregados em ${loadTime.toFixed(2)}ms`);
    } catch (err) {
      console.error('Erro ao carregar grupos ultra-rápidos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [limit]);

  const refetch = () => {
    loadGroups();
  };

  return { groups, loading, error, refetch };
};