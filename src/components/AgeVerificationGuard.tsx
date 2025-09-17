import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isAgeVerified, requiresAgeVerification } from '@/utils/ageVerification';

interface AgeVerificationGuardProps {
  children: React.ReactNode;
  categoryId?: string;
}

const AgeVerificationGuard = ({ children, categoryId }: AgeVerificationGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if current route requires age verification
    if (categoryId && requiresAgeVerification(categoryId)) {
      if (!isAgeVerified()) {
        // Redirect to age verification page with return URL
        const currentPath = location.pathname + location.search;
        navigate(`/verificacao-idade?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }
    }
  }, [categoryId, navigate, location]);

  // If category requires verification and user hasn't verified, don't render children
  if (categoryId && requiresAgeVerification(categoryId) && !isAgeVerified()) {
    return null;
  }

  return <>{children}</>;
};

export default AgeVerificationGuard;