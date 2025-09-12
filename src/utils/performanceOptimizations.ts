// Performance optimization utilities for sub-2s loading
import React from 'react';
import { measurePerformance } from './performanceUtils';

// Preload critical resources
export const preloadCriticalResources = () => {
  const perf = measurePerformance('Critical Resource Preload');
  
  // Preload critical CSS
  const linkElement = document.createElement('link');
  linkElement.rel = 'preload';
  linkElement.as = 'style';
  linkElement.href = '/src/index.css';
  document.head.appendChild(linkElement);

  // Preload critical fonts
  const fontPreload = document.createElement('link');
  fontPreload.rel = 'preload';
  fontPreload.as = 'font';
  fontPreload.type = 'font/woff2';
  fontPreload.href = 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2';
  fontPreload.crossOrigin = 'anonymous';
  document.head.appendChild(fontPreload);

  perf.end();
};

// Optimize images for different screen sizes
export const getOptimizedImageUrl = (
  originalUrl: string, 
  width: number, 
  quality: 'high' | 'medium' | 'low' = 'medium'
): string => {
  if (!originalUrl) return '';
  
  // For external images, return original URL
  if (originalUrl.startsWith('http')) {
    return originalUrl;
  }
  
  // For local images, could implement WebP conversion
  return originalUrl;
};

// Optimize React re-renders
export const createOptimizedMemo = <T extends object>(
  Component: React.ComponentType<T>,
  propsAreEqual?: (prevProps: T, nextProps: T) => boolean
) => {
  return React.memo(Component, propsAreEqual);
};

// Batch DOM updates for better performance
export const batchDOMUpdates = (callback: () => void) => {
  // Use requestAnimationFrame to batch updates
  requestAnimationFrame(() => {
    // Use double RAF for better batching
    requestAnimationFrame(callback);
  });
};

// Detect slow networks and adjust quality
export const getNetworkAwareQuality = (): 'high' | 'medium' | 'low' => {
  const connection = (navigator as any).connection;
  if (!connection) return 'medium';
  
  if (connection.effectiveType === '4g' && !connection.saveData) {
    return 'high';
  } else if (connection.effectiveType === '3g') {
    return 'medium';
  } else {
    return 'low';
  }
};

// Resource hints for better loading
export const addResourceHints = () => {
  // DNS prefetch for external domains
  const addDNSPrefetch = (domain: string) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  };

  // Common external domains
  addDNSPrefetch('//fonts.googleapis.com');
  addDNSPrefetch('//fonts.gstatic.com');
  addDNSPrefetch('//t.me');
};

// Initialize performance optimizations
export const initPerformanceOptimizations = () => {
  // Add resource hints immediately
  addResourceHints();
  
  // Preload critical resources
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preloadCriticalResources);
  } else {
    preloadCriticalResources();
  }
  
  // Enable performance monitoring in development
  if (process.env.NODE_ENV === 'development') {
    // Add performance observer for monitoring
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'paint') {
            console.log(`🎨 ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
          }
        });
      });
      
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
    }
  }
};