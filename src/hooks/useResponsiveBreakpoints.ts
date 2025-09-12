import { useState, useEffect } from 'react';

interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
  wide: number;
}

const defaultBreakpoints: BreakpointConfig = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  wide: 1536
};

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  width: number;
  height: number;
}

export const useResponsiveBreakpoints = (customBreakpoints?: Partial<BreakpointConfig>) => {
  const breakpoints = { ...defaultBreakpoints, ...customBreakpoints };
  
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isWide: false,
        width: 1024,
        height: 768
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      isMobile: width < breakpoints.mobile,
      isTablet: width >= breakpoints.mobile && width < breakpoints.desktop,
      isDesktop: width >= breakpoints.desktop && width < breakpoints.wide,
      isWide: width >= breakpoints.wide,
      width,
      height
    };
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      // Debounce resize events for better performance
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        setState(prevState => {
          const newState = {
            isMobile: width < breakpoints.mobile,
            isTablet: width >= breakpoints.mobile && width < breakpoints.desktop,
            isDesktop: width >= breakpoints.desktop && width < breakpoints.wide,
            isWide: width >= breakpoints.wide,
            width,
            height
          };
          
          // Only update if state actually changed to prevent unnecessary re-renders
          if (
            prevState.isMobile !== newState.isMobile ||
            prevState.isTablet !== newState.isTablet ||
            prevState.isDesktop !== newState.isDesktop ||
            prevState.isWide !== newState.isWide ||
            Math.abs(prevState.width - newState.width) > 50 // Only update width if significant change
          ) {
            return newState;
          }
          return prevState;
        });
      }, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [breakpoints]);

  return state;
};

// Hook for responsive values
export const useResponsiveValue = <T>(values: {
  mobile: T;
  tablet?: T;
  desktop?: T;
  wide?: T;
}) => {
  const { isMobile, isTablet, isDesktop, isWide } = useResponsiveBreakpoints();
  
  if (isWide && values.wide !== undefined) return values.wide;
  if (isDesktop && values.desktop !== undefined) return values.desktop;
  if (isTablet && values.tablet !== undefined) return values.tablet;
  
  return values.mobile;
};