import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackVisit } from '@/services/analyticsService';

export const usePageAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page visit
    trackVisit(location.pathname + location.search);
  }, [location]);
};

export default usePageAnalytics;