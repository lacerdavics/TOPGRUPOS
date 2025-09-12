import React from 'react';
import { useResponsiveBreakpoints } from '@/hooks/useResponsiveBreakpoints';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  minItemWidth?: number;
  gap?: 'sm' | 'md' | 'lg';
  priority?: boolean; // For above-the-fold content
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  minItemWidth = 280,
  gap = 'md',
  priority = false
}) => {
  const { isMobile, isTablet } = useResponsiveBreakpoints();

  const gapClasses = {
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  };

  // Responsive columns based on screen size and minimum item width
  const getGridCols = () => {
    if (isMobile) return 'grid-cols-1';
    if (isTablet) return 'grid-cols-2';
    return 'grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6';
  };

  return (
    <div
      className={cn(
        'grid w-full',
        getGridCols(),
        gapClasses[gap],
        className
      )}
      style={{
        // CSS Grid with auto-fit for better responsiveness
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}px, 1fr))`,
        // Performance optimization for priority content
        ...(priority && {
          contentVisibility: 'auto',
          containIntrinsicSize: '300px'
        })
      }}
    >
      {children}
    </div>
  );
};

export default ResponsiveGrid;