import { useState, useEffect, useCallback } from 'react';
import { 
  getActiveBanner, 
  getAllBanners, 
  getBannerStats,
  expireOldBanners,
  type Banner 
} from '@/services/bannerService';

export const useBannerManagement = () => {
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null);
  const [allBanners, setAllBanners] = useState<Banner[]>([]);
  const [stats, setStats] = useState({
    totalBanners: 0,
    activeBanners: 0,
    expiredBanners: 0
  });
  const [loading, setLoading] = useState(true);

  const loadActiveBanner = useCallback(async () => {
    try {
      const banner = await getActiveBanner();
      setActiveBanner(banner);
    } catch (error) {
      console.error('Erro ao carregar banner ativo:', error);
    }
  }, []);

  const loadAllBanners = useCallback(async () => {
    try {
      const banners = await getAllBanners();
      setAllBanners(banners);
    } catch (error) {
      console.error('Erro ao carregar todos os banners:', error);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const bannerStats = await getBannerStats();
      setStats(bannerStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas dos banners:', error);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      // Expire old banners first
      await expireOldBanners();
      
      // Then load fresh data
      await Promise.all([
        loadActiveBanner(),
        loadAllBanners(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Erro ao atualizar dados dos banners:', error);
    } finally {
      setLoading(false);
    }
  }, [loadActiveBanner, loadAllBanners, loadStats]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    activeBanner,
    allBanners,
    stats,
    loading,
    refreshData,
    loadActiveBanner
  };
};

export default useBannerManagement;