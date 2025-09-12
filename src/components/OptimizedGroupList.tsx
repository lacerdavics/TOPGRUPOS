import React, { memo, useCallback, useMemo } from 'react';
import { useVirtualScroll } from '@/hooks/useVirtualScroll';
import OptimizedGroupCard from '@/components/OptimizedGroupCard';
import GroupSkeleton from '@/components/GroupSkeleton';

interface EnhancedGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  telegramUrl: string;
  imageUrl?: string;
  createdAt: Date;
  membersCount?: number;
  suspended?: boolean;
  viewCount?: number;
}

interface OptimizedGroupListProps {
  groups: EnhancedGroup[];
  loading?: boolean;
  onGroupClick?: (group: EnhancedGroup) => void;
  onGroupUpdate?: () => void;
  itemHeight?: number;
  containerHeight?: number;
  useVirtualization?: boolean;
  className?: string;
}

const OptimizedGroupList = memo<OptimizedGroupListProps>(({
  groups,
  loading = false,
  onGroupClick,
  onGroupUpdate,
  itemHeight = 280,
  containerHeight = 600,
  useVirtualization = false,
  className = ""
}) => {
  const handleGroupClick = useCallback((group: EnhancedGroup) => {
    onGroupClick?.(group);
  }, [onGroupClick]);

  // Use virtual scrolling for large lists
  const {
    virtualItems,
    scrollElementProps,
    innerElementProps
  } = useVirtualScroll(groups, {
    itemHeight,
    containerHeight,
    overscan: 3
  });

  // Render loading state - no skeleton shown
  if (loading) {
    return null;
  }

  // Render empty state
  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum grupo encontrado.</p>
      </div>
    );
  }

  // Use virtual scrolling for very large lists (>50 items)
  if (useVirtualization && groups.length > 50) {
    return (
      <div {...scrollElementProps} className={className}>
        <div {...innerElementProps}>
          {virtualItems.map(({ index, start, item }) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: start,
                left: 0,
                width: '100%',
                height: itemHeight,
              }}
            >
              <OptimizedGroupCard
                group={item}
                onGroupClick={handleGroupClick}
                onGroupUpdate={onGroupUpdate}
                priority={index < 6} // Priority for first 6 items
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Regular grid layout for smaller lists
  return (
    <div className={`grid-responsive-cards ${className}`}>
      {groups.map((group, index) => (
        <div 
          key={group.id} 
          className="animate-fade-in-up"
          style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
        >
          <OptimizedGroupCard
            group={group}
            onGroupClick={handleGroupClick}
            onGroupUpdate={onGroupUpdate}
            priority={index < 6} // Priority loading for first 6 items
          />
        </div>
      ))}
    </div>
  );
});

OptimizedGroupList.displayName = 'OptimizedGroupList';

export default OptimizedGroupList;