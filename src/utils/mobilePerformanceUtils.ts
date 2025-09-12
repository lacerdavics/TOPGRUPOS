// Utilities para otimização de performance no mobile

// Debounce otimizado para mobile
export const mobileDebounce = <T extends (...args: any[]) => void>(
  func: T,
  wait: number,
  immediate = false
): T => {
  let timeout: NodeJS.Timeout | null = null;
  
  return ((...args: any[]) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  }) as T;
};

// Throttle para scroll events
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  
  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
};

// Lazy load com Intersection Observer otimizado
export const createLazyLoader = (
  threshold = 0.1,
  rootMargin = '50px'
) => {
  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    },
    {
      threshold,
      rootMargin
    }
  );
  
  return imageObserver;
};

// Preload crítico de imagens
export const preloadCriticalImages = (urls: string[], priority = false) => {
  const promises = urls.map(url => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load ${url}`));
      
      // Set loading priority
      if (priority && 'loading' in img) {
        (img as any).loading = 'eager';
      }
      
      img.src = url;
    });
  });
  
  return Promise.allSettled(promises);
};

// Detectar capacidades do device
export const getDeviceCapabilities = () => {
  const connection = (navigator as any).connection;
  const memory = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  
  return {
    // Network
    isSlowConnection: connection && (
      connection.effectiveType === 'slow-2g' || 
      connection.effectiveType === '2g' ||
      connection.saveData
    ),
    
    // Memory
    isLowMemory: memory && memory <= 2,
    
    // CPU
    isLowEndCPU: cores && cores <= 2,
    
    // Screen
    isSmallScreen: window.innerWidth < 480,
    
    // Overall device assessment
    isLowEndDevice: function() {
      return this.isLowMemory || this.isLowEndCPU || this.isSlowConnection;
    }
  };
};

// Otimizar requests baseado na conexão
export const optimizeForConnection = () => {
  const capabilities = getDeviceCapabilities();
  
  return {
    // Quantidade de recursos a carregar
    batchSize: capabilities.isSlowConnection ? 3 : capabilities.isLowEndDevice() ? 6 : 12,
    
    // Qualidade de imagem
    imageQuality: capabilities.isSlowConnection ? 'low' : 
                  capabilities.isSmallScreen ? 'medium' : 'high',
    
    // Timeout para requests
    timeout: capabilities.isSlowConnection ? 10000 : 5000,
    
    // Prefetch
    shouldPrefetch: !capabilities.isSlowConnection && !capabilities.isLowEndDevice(),
    
    // Animações
    enableAnimations: !capabilities.isLowEndDevice()
  };
};

// Virtual scrolling simples
export const createVirtualScroller = (
  containerHeight: number,
  itemHeight: number,
  items: any[],
  overscan = 3
) => {
  let scrollTop = 0;
  
  const getVisibleRange = () => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );
    
    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan)
    };
  };
  
  const updateScrollTop = (newScrollTop: number) => {
    scrollTop = newScrollTop;
  };
  
  return {
    getVisibleRange,
    updateScrollTop,
    totalHeight: items.length * itemHeight
  };
};

// Cleanup de event listeners
export const cleanupListeners = (() => {
  const listeners: Array<{
    element: Element | Window;
    event: string;
    handler: EventListener;
  }> = [];
  
  const add = (element: Element | Window, event: string, handler: EventListener) => {
    element.addEventListener(event, handler);
    listeners.push({ element, event, handler });
  };
  
  const cleanup = () => {
    listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    listeners.length = 0;
  };
  
  return { add, cleanup };
})();

// Performance monitor simples
export const createPerformanceMonitor = () => {
  let fps = 60;
  let lastFrameTime = performance.now();
  let frameCount = 0;
  
  const measureFPS = () => {
    const currentTime = performance.now();
    frameCount++;
    
    if (currentTime >= lastFrameTime + 1000) {
      fps = Math.round((frameCount * 1000) / (currentTime - lastFrameTime));
      frameCount = 0;
      lastFrameTime = currentTime;
      
      // Log performance issues
      if (fps < 30) {
        console.warn('⚡ Low FPS detected:', fps);
      }
    }
    
    requestAnimationFrame(measureFPS);
  };
  
  measureFPS();
  
  return {
    getFPS: () => fps,
    getMemoryUsage: () => {
      const memory = (performance as any).memory;
      return memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0;
    }
  };
};