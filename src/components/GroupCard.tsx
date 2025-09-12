import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, ExternalLink } from "lucide-react";
import IntelligentGroupImage from "@/components/IntelligentGroupImage";
import { useToast, toast } from "@/hooks/use-toast";
import { sanitizeGroupTitle, truncateTitle, checkTelegramUrlStatus } from "@/utils/groupValidation";
import { decodeHtmlEntities } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useGroupImageEnhancement } from "@/hooks/useAIImageEnhancement";
import { useNavigate } from "react-router-dom";

export interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  telegramUrl: string;
  profileImage?: string;
  createdAt: Date;
  membersCount?: number;
  suspended?: boolean;
}

interface GroupCardProps {
  group: Group;
  onGroupUpdate?: () => void;
}

const GroupCard = ({ group, onGroupUpdate }: GroupCardProps) => {
  const { toast: showToast } = useToast();
  const navigate = useNavigate();

  // AI-enhanced image
  const { enhancedSrc, isEnhancing, hasEnhancement } = useGroupImageEnhancement(group.profileImage);

  // Decode HTML entities and sanitize group name
  const decodedName = decodeHtmlEntities(group.name);
  const sanitizedName = sanitizeGroupTitle(decodedName);
  const displayName = truncateTitle(sanitizedName, 30);

  const handleGroupClick = () => {
    // Store group data and navigate to description page
    localStorage.setItem(`group_${group.id}`, JSON.stringify(group));
    navigate(`/grupo/${group.id}/descricao?name=${encodeURIComponent(group.name)}&description=${encodeURIComponent(group.description)}&telegramUrl=${encodeURIComponent(group.telegramUrl)}&category=${encodeURIComponent(group.category)}&imageUrl=${encodeURIComponent(group.profileImage || '')}&viewCount=${group.membersCount || 0}`);
  };


  return (
    <div className="space-y-3">
      {/* Premium Card Container */}
      <Card className={`group cursor-pointer overflow-hidden rounded-3xl bg-transparent border-0 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 ${group.suspended ? 'opacity-60' : ''}`} onClick={handleGroupClick}>
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl">
          
          {/* Background Image */}
          <IntelligentGroupImage
            telegramUrl={group.telegramUrl}
            fallbackImageUrl={group.profileImage}
            groupName={sanitizedName}
            alt={`Imagem do grupo ${sanitizedName}`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            priority={false}
          />
          
          {/* Premium Gradient Overlay - sem título */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Glassmorphism Button - Bottom Center */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-center">
            <Button 
              className={`
                px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 
                text-white font-semibold text-sm rounded-2xl
                hover:bg-white/20 hover:border-white/30 hover:scale-105
                transition-all duration-300 ease-out
                shadow-lg shadow-black/20
                ${group.suspended ? 'opacity-60 cursor-not-allowed' : ''}
              `}
              onClick={(e) => {
                e.stopPropagation();
                handleGroupClick();
              }}
              disabled={group.suspended}
              aria-label={`Ver detalhes do grupo ${sanitizedName}`}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Detalhes
            </Button>
          </div>

        </div>
      </Card>
      
      {/* Title Outside Card */}
      <div className="px-2">
        <h3 className="text-foreground text-sm font-bold leading-tight font-heading line-clamp-2">
          {displayName}
        </h3>
        {group.suspended && (
          <div className="inline-flex items-center mt-1 px-2 py-1 bg-red-500/10 backdrop-blur-sm rounded-lg border border-red-500/20">
            <span className="text-red-500 text-xs font-medium">SUSPENSO</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupCard;