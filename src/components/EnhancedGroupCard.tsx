import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye, ExternalLink } from "lucide-react";
import IntelligentGroupImage from "@/components/IntelligentGroupImage";
import { sanitizeGroupTitle, truncateTitle } from "@/utils/groupValidation";
import { decodeHtmlEntities } from "@/lib/utils";
import { incrementOptimizedGroupViews } from "@/services/optimizedPopularGroupsService";
import { trackVisit } from "@/services/analyticsService";
import { useNavigate } from "react-router-dom";

export interface EnhancedGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  telegramUrl: string;
  imageUrl?: string;
  createdAt: Date;
  viewCount?: number;
}

// Compatible interface for optimized groups
export interface OptimizedGroupCompatible {
  id: string;
  name: string;
  description: string;
  category: string;
  telegramUrl: string;
  imageUrl?: string;
  createdAt: Date;
  viewCount?: number;
}

interface EnhancedGroupCardProps {
  group: EnhancedGroup | OptimizedGroupCompatible;
  className?: string;
  onGroupUpdate?: () => void;
}

const EnhancedGroupCard: React.FC<EnhancedGroupCardProps> = ({ 
  group, 
  className = "",
  onGroupUpdate
}) => {
  const navigate = useNavigate();

  // Listen for image correction events
  useEffect(() => {
    const handleImageCorrection = (event: CustomEvent) => {
      console.log('🔔 EnhancedGroupCard: Evento de correção de imagem recebido:', event.detail);
      
      // Check if this event is for our group
      if (event.detail.groupId === group.id) {
        console.log(`✅ EnhancedGroupCard: Imagem corrigida para grupo ${group.id} (${group.name})`);
        console.log(`🆕 Nova URL: ${event.detail.newImageUrl}`);
        console.log(`🗑️ URL antiga: ${event.detail.oldImageUrl}`);
        
        // Trigger parent component to refetch data from Firestore
        if (onGroupUpdate) {
          console.log('🔄 EnhancedGroupCard: Solicitando atualização dos dados do grupo...');
          onGroupUpdate();
        } else {
          console.log('⚠️ EnhancedGroupCard: onGroupUpdate não fornecido, não é possível atualizar');
        }
      }
    };

    // Add event listener
    window.addEventListener('groupImageCorrected', handleImageCorrection as EventListener);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('groupImageCorrected', handleImageCorrection as EventListener);
    };
  }, [group.id, group.name, onGroupUpdate]);
  // Decode HTML entities and sanitize group name
  const decodedName = decodeHtmlEntities(group.name);
  const sanitizedName = sanitizeGroupTitle(decodedName);
  const displayName = truncateTitle(sanitizedName, 30);

  const handleGroupClick = async () => {
    // Track analytics
    await trackVisit(`/group/${group.id}`);
    
    // Store group data and navigate to description page
    localStorage.setItem(`group_${group.id}`, JSON.stringify(group));
    navigate(`/grupo/${group.id}/descricao?name=${encodeURIComponent(group.name)}&description=${encodeURIComponent(group.description)}&telegramUrl=${encodeURIComponent(group.telegramUrl)}&category=${encodeURIComponent(group.category)}&imageUrl=${encodeURIComponent(group.imageUrl || '')}&viewCount=${group.viewCount || 0}`);
  };

  if ((group as any).approved === false) {
    return null; // Don't render suspended groups
  }

  return (
    <>
      <Card className={`card-group group cursor-pointer ${className}`} onClick={handleGroupClick}>
        {/* Image Container */}
        <div className="relative aspect-square w-full overflow-hidden">
          <IntelligentGroupImage
            fallbackImageUrl={group.imageUrl || (group as any).profileImage}
            telegramUrl={group.telegramUrl}
            groupName={sanitizedName}
            alt={`Imagem do grupo ${sanitizedName}`}
            className="w-full h-full group-hover:scale-[1.05] transition-transform duration-500"
            priority={false}
            groupId={group.id}
          />
          
          {/* Content Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300">
            {/* Title at top */}
            <div className="absolute top-0 left-0 right-0 p-4">
              <h3 className="text-primary-foreground text-sm font-bold leading-tight font-heading drop-shadow-md">
                {displayName}
              </h3>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
              
              {/* Meta Information */}
              <div className="flex justify-end items-center gap-2">
                {group.viewCount && group.viewCount > 0 && (
                  <span className="badge-modern bg-primary/10 text-primary-foreground border-border/20 backdrop-blur-sm flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span className="text-xs">{group.viewCount.toLocaleString()}</span>
                  </span>
                )}
              </div>

              {/* Action Button */}
              <button 
                className="btn-ver-detalhes"
                onClick={(e) => {
                  e.stopPropagation();
                  handleGroupClick();
                }}
                aria-label={`Ver detalhes do grupo ${sanitizedName}`}
              >
                <ExternalLink className="w-4 h-4" />
                Ver Detalhes
              </button>
            </div>
          </div>
        </div>
      </Card>

    </>
  );
};

export default EnhancedGroupCard;