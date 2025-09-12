import React from 'react';

interface GroupSkeletonProps {
  count?: number;
  className?: string;
}

const GroupSkeleton: React.FC<GroupSkeletonProps> = ({ count = 6, className = "" }) => {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-card border border-border/30 rounded-2xl overflow-hidden shadow-sm"
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          <div className="flex items-center p-4 gap-4">
            {/* Image skeleton */}
            <div className="skeleton-pulse w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex-shrink-0 bg-muted"></div>
            
            {/* Content skeleton */}
            <div className="flex-1 space-y-3">
              {/* Title skeleton */}
              <div className="skeleton-pulse h-4 w-3/4 rounded bg-muted"></div>
              
              {/* Category and views row */}
              <div className="flex justify-between items-center gap-2">
                {/* Category skeleton */}
                <div className="skeleton-pulse h-6 w-20 rounded-full bg-muted"></div>
                
                {/* Views skeleton */}
                <div className="skeleton-pulse h-5 w-12 rounded bg-muted"></div>
              </div>
              
              {/* Button skeleton */}
              <div className="skeleton-pulse h-8 w-28 rounded-lg bg-primary/20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GroupSkeleton;