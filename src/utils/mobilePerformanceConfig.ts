// Mobile performance configuration for ultra-light site experience

export const getMobilePerformanceConfig = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const isLowEnd = typeof navigator !== 'undefined' && (
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
    ((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 2) ||
    (navigator.userAgent.includes('Android') && window.innerWidth < 400)
  );

  const connection = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
  const isSlowConnection = connection && (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.effectiveType === '3g' ||
    connection.saveData
  );

  return {
    // Disable all animations on mobile/slow devices
    disableAnimations: isMobile || isLowEnd || isSlowConnection,
    
    // Reduce image quality
    imageQuality: isSlowConnection ? 'low' : isMobile ? 'medium' : 'high',
    
    // Reduce items per page
    itemsPerPage: isLowEnd ? 6 : isMobile ? 12 : 24,
    
    // Disable effects
    disableShadows: isLowEnd || isSlowConnection,
    disableGradients: isLowEnd || isSlowConnection,
    disableHoverEffects: isMobile,
    
    // Optimize scroll
    useNativeScroll: isMobile,
    
    // Reduce debounce for faster response
    debounceMs: isLowEnd ? 100 : 300
  };
};

// Apply performance optimizations immediately
export const applyMobileOptimizations = () => {
  if (typeof document === 'undefined') return;
  
  const config = getMobilePerformanceConfig();
  
  // Add performance class to body
  if (config.disableAnimations) {
    document.documentElement.classList.add('mobile-performance-mode');
  }
  
  // Add CSS for performance mode
  const style = document.createElement('style');
  style.textContent = `
    .mobile-performance-mode * {
      animation: none !important;
      transition: none !important;
      transform: none !important;
      will-change: auto !important;
    }
    
    /* Allow toast animations */
    .mobile-performance-mode .mobile-toast-alert *,
    .mobile-performance-mode [data-radix-toast-root],
    .mobile-performance-mode [data-radix-toast-viewport] {
      animation: inherit !important;
      transition: inherit !important;
      transform: inherit !important;
    }
    
    .mobile-performance-mode .card-modern:hover,
    .mobile-performance-mode .btn-modern:hover {
      transform: none !important;
      box-shadow: inherit !important;
    }
    
    ${config.disableShadows ? `
    .mobile-performance-mode * {
      box-shadow: none !important;
      filter: none !important;
      backdrop-filter: none !important;
    }
    
    .mobile-performance-mode .card-modern {
      box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
    }
    ` : ''}
    
    ${config.disableGradients ? `
    .mobile-performance-mode * {
      background-image: none !important;
    }
    ` : ''}
  `;
  
  document.head.appendChild(style);
};

// Initialize on load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyMobileOptimizations);
  } else {
    applyMobileOptimizations();
  }
}