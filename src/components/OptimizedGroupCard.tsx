import React, { memo, useCallback, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import MobileOptimizedImage from "@/components/MobileOptimizedImage";
import { sanitizeGroupTitle, truncateTitle } from "@/utils/groupValidation";
import { decodeHtmlEntities } from "@/lib/utils";
import { ExternalLink, Eye } from "lucide-react";
import { useGroupImageEnhancement } from "@/hooks/useAIImageEnhancement";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useMobileOptimization } from "@/hooks/useMobileOptimization";

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

interface OptimizedGroupCardProps {
  group: EnhancedGroup;
  className?: string;
  onGroupClick?: (group: EnhancedGroup) => void;
  onGroupUpdate?: () => void;
  priority?: boolean;
}

// Memoized component to prevent unnecessary re-renders
const OptimizedGroupCard = memo<OptimizedGroupCardProps>(({ 
  group, 
  className = "",
  onGroupClick,
  onGroupUpdate,
  priority = false
}) => {
  const { toast } = useToast();
  const { disableAnimations, isMobile } = useMobileOptimization();

  // AI-enhanced image - disabled on low-end devices
  const { enhancedSrc, isEnhancing, hasEnhancement } = useGroupImageEnhancement(
    group.imageUrl
  );

  // Memoized calculations
  const decodedName = useMemo(() => decodeHtmlEntities(group.name), [group.name]);
  const sanitizedName = useMemo(() => sanitizeGroupTitle(decodedName), [decodedName]);
  const displayName = useMemo(() => truncateTitle(sanitizedName, isMobile ? 25 : 30), [sanitizedName, isMobile]);
  const viewCountDisplay = useMemo(() => {
    if (!group.viewCount || group.viewCount <= 0) return null;
    return group.viewCount > 999 
      ? `${(group.viewCount / 1000).toFixed(1)}k` 
      : group.viewCount.toLocaleString();
  }, [group.viewCount]);

  const handleGroupClick = useCallback(() => {
    onGroupClick?.(group);
  }, [onGroupClick, group]);

  const handleButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleGroupClick();
  }, [handleGroupClick]);

  return (
    <Card
        className={`group bg-card border border-border/30 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full ${
          disableAnimations ? '' : 'transform hover:-translate-y-2 hover:border-primary/20'
        } ${
          group.suspended ? 'opacity-60' : ''
        } ${className}`}
        onClick={handleGroupClick}
      >
        {/* Image Container */}
        <div className="relative aspect-square w-full overflow-hidden">
          <MobileOptimizedImage
            src={group.telegramUrl ? `https://t.me/${group.telegramUrl.replace('@', '').replace('https://t.me/', '')}/photo` : group.imageUrl || ''}
            fallbackSrc={group.imageUrl}
            alt={`Imagem do grupo ${sanitizedName}`}
            className={`w-full h-full object-cover ${disableAnimations ? '' : 'group-hover:scale-[1.02] transition-transform duration-300'}`}
            priority={priority}
          />
          
          {/* Content Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300">
            {/* Title at top */}
            <div className="absolute top-0 left-0 right-0 p-4">
              <h3 className="text-card-foreground text-sm font-bold leading-tight font-heading drop-shadow-md">
                {displayName}
              </h3>
            </div>
          </div>
        </div>

      {/* Information Section Below Image */}
      <div className="p-3 sm:p-5 space-y-2 sm:space-y-3">
        
        {/* Views */}
        <div className="flex justify-end items-center">
          {viewCountDisplay && (
            <span className="text-foreground/80 text-xs flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md border border-border/30">
              <Eye className="w-3 h-3 text-primary" />
              <span className="font-medium">{viewCountDisplay}</span>
            </span>
          )}
        </div>

        {/* Action button */}
        <button 
          className="btn-ver-detalhes"
          onClick={handleButtonClick}
          aria-label={`Ver detalhes do grupo ${sanitizedName}`}
          disabled={group.suspended}
        >
          <ExternalLink className="w-4 h-4" />
          VER DETALHES
        </button>
      </div>
    </Card>
  );
});

OptimizedGroupCard.displayName = 'OptimizedGroupCard';

export default OptimizedGroupCard;