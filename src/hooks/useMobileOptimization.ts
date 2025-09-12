import { useState, useEffect, useCallback, useMemo } from 'react';

// Hook para otimizações específicas de mobile
export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'fast'>('fast');

  // Detectar mobile e capacidades do device
  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // Detectar dispositivos de baixo desempenho
      const isLowEnd = (
        navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2 ||
        (navigator as any).deviceMemory && (navigator as any).deviceMemory <= 2 ||
        navigator.userAgent.includes('Android') && window.innerWidth < 400
      );
      setIsLowEndDevice(isLowEnd);

      // Detectar velocidade de conexão
      const connection = (navigator as any).connection;
      if (connection) {
        const slow = connection.effectiveType === 'slow-2g' || 
                    connection.effectiveType === '2g' ||
                    connection.effectiveType === '3g' ||
                    connection.saveData;
        setConnectionSpeed(slow ? 'slow' : 'fast');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Configurações otimizadas baseadas no device
  const optimizations = useMemo(() => ({
    // Reduzir número de itens mostrados em devices lentos
    itemsPerPage: isLowEndDevice ? 6 : isMobile ? 12 : 24,
    
    // Lazy loading mais agressivo em mobile
    lazyLoadThreshold: isMobile ? '100px' : '200px',
    
    // Debounce mais longo em devices lentos
    debounceMs: isLowEndDevice ? 500 : 300,
    
    // Usar imagens menores em mobile/conexão lenta
    imageQuality: connectionSpeed === 'slow' ? 'low' : isMobile ? 'medium' : 'high',
    
    // Desabilitar animações em devices lentos
    disableAnimations: isLowEndDevice,
    
    // Virtual scrolling threshold
    virtualScrollThreshold: isLowEndDevice ? 20 : 50,
    
    // Preload menos imagens em mobile
    preloadCount: isLowEndDevice ? 2 : isMobile ? 4 : 8
  }), [isMobile, isLowEndDevice, connectionSpeed]);

  return {
    isMobile,
    isLowEndDevice,
    connectionSpeed,
    ...optimizations
  };
};

// Hook para lazy loading otimizado
export const useLazyLoad = (threshold = '100px') => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: threshold,
        threshold: 0
      }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return [setRef, isVisible] as const;
};

// Hook para performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fps: 60,
    memory: 0,
    renderTime: 0
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        const memory = (performance as any).memory?.usedJSHeapSize || 0;
        
        setMetrics({
          fps,
          memory: Math.round(memory / 1024 / 1024), // MB
          renderTime: currentTime - lastTime
        });
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    measureFPS();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return metrics;
};