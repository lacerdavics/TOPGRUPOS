// Performance optimization utilities

// Debounce function for search inputs
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle function for scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Intersection Observer utility for lazy loading
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };
  
  return new IntersectionObserver(callback, defaultOptions);
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSMemorySize: memory.usedJSMemorySize,
      totalJSMemorySize: memory.totalJSMemorySize,
      jsMemoryLimit: memory.jsMemoryLimit,
      percentageUsed: (memory.usedJSMemorySize / memory.jsMemoryLimit * 100).toFixed(2)
    };
  }
  return null;
};

// Performance measurement utility
export const measurePerformance = (name: string) => {
  const startTime = performance.now();
  
  return {
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`⚡ Performance: ${name} took ${duration.toFixed(2)}ms`);
      return duration;
    }
  };
};

// Optimize React component re-renders
export const shallowEqual = (obj1: any, obj2: any): boolean => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) {
    return false;
  }
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }
  
  return true;
};

// Batch DOM updates
export const batchUpdates = (callback: () => void) => {
  requestAnimationFrame(() => {
    callback();
  });
};

// Image preloading utility
export const preloadImages = (urls: string[]): Promise<void[]> => {
  return Promise.all(
    urls.map(url => 
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      })
    )
  );
};

// Network speed detection
export const getNetworkSpeed = (): string => {
  const connection = (navigator as any).connection;
  if (connection) {
    const speed = connection.effectiveType;
    return speed || 'unknown';
  }
  return 'unknown';
};

// Cache management
export const getCacheSize = async (): Promise<number> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
};

// Add performance monitoring to window for debugging
if (typeof window !== 'undefined') {
  (window as any).performanceUtils = {
    getMemoryUsage,
    measurePerformance,
    getNetworkSpeed,
    getCacheSize
  };
}