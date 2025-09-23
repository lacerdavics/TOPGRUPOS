import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExternalLink, MoreVertical, Trash2, Edit, Flag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import IntelligentGroupImage from "@/components/IntelligentGroupImage";
import { useMobileToast } from "@/hooks/useMobileToast";
import { sanitizeGroupTitle, truncateTitle } from "@/utils/groupValidation";
import { decodeHtmlEntities } from "@/lib/utils";
import { useGroupImageEnhancement } from "@/hooks/useAIImageEnhancement";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { checkIsAdmin } from "@/services/userService";

export interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  telegramUrl: string;
  profileImage?: string;
  imageUrl?: string;
  createdAt: Date;
  membersCount?: number;
  approved?: boolean;
  suspended?: boolean;
}

interface GroupCardProps {
  group: Group;
  onGroupUpdate?: () => void;
  compact?: boolean; // ✅ Suporte a compact
}

const GroupCard = ({ group, onGroupUpdate, compact = false }: GroupCardProps) => {
  const { toast: showToast } = useMobileToast();
  const navigate = useNavigate();

  // AI-enhanced image
  const { enhancedSrc } = useGroupImageEnhancement(group.profileImage);

  // Listen for image correction events
  useEffect(() => {
    const handleImageCorrection = (event: CustomEvent) => {
      console.log('🔔 GroupCard: Evento de correção de imagem recebido:', event.detail);
      
      // Check if this event is for our group
      if (event.detail.groupId === group.id) {
        console.log(`✅ GroupCard: Imagem corrigida para grupo ${group.id} (${group.name})`);
        console.log(`🆕 Nova URL: ${event.detail.newImageUrl}`);
        console.log(`🗑️ URL antiga: ${event.detail.oldImageUrl}`);
        
        // Trigger parent component to refetch data from Firestore
        if (onGroupUpdate) {
          console.log('🔄 GroupCard: Solicitando atualização dos dados do grupo...');
          onGroupUpdate();
        } else {
          console.log('⚠️ GroupCard: onGroupUpdate não fornecido, não é possível atualizar');
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
  const decodedName = decodeHtmlEntities(group.name);
  const sanitizedName = sanitizeGroupTitle(decodedName);
  const displayName = truncateTitle(sanitizedName, compact ? 20 : 30); // menor título se compacto

  const handleGroupClick = () => {
    localStorage.setItem(`group_${group.id}`, JSON.stringify(group));
    navigate(
      `/grupo/${group.id}/descricao?name=${encodeURIComponent(
        group.name
      )}&description=${encodeURIComponent(group.description)}&telegramUrl=${encodeURIComponent(
        group.telegramUrl
      )}&category=${encodeURIComponent(group.category)}&imageUrl=${encodeURIComponent(
        group.profileImage || ""
      )}&viewCount=${group.membersCount || 0}`
    );
  };

  return (
    <div className={`space-y-${compact ? "2" : "3"}`}>
      <Card
        className={`group cursor-pointer overflow-hidden rounded-3xl bg-transparent border-0 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 ${
          group.approved === false ? "opacity-60" : ""
        }`}
        onClick={handleGroupClick}
      >
        <div className={`relative aspect-square w-full overflow-hidden rounded-3xl`}>
          <IntelligentGroupImage
            fallbackImageUrl={group.profileImage || group.imageUrl}
            telegramUrl={group.telegramUrl}
            groupName={sanitizedName}
            alt={`Imagem do grupo ${sanitizedName}`}
            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out`}
            priority={false}
            groupId={group.id}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="absolute bottom-4 left-4 right-4 flex justify-center">
            <Button
              className={`px-${compact ? "4" : "6"} py-${compact ? "2" : "3"} bg-white/10 backdrop-blur-xl border border-white/20 text-white font-semibold text-${compact ? "xs" : "sm"} rounded-2xl hover:bg-white/20 hover:border-white/30 hover:scale-105 transition-all duration-300 ease-out shadow-lg shadow-black/20 ${
                group.suspended ? "opacity-60 cursor-not-allowed" : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleGroupClick();
              }}
              disabled={group.approved === false || group.suspended}
              aria-label={`Ver detalhes do grupo ${sanitizedName}`}
            >
              <ExternalLink className={`w-${compact ? "3" : "4"} h-${compact ? "3" : "4"} mr-2`} />
              Ver Detalhes
            </Button>
          </div>
        </div>
      </Card>

      <div className="px-2">
        <h3 className={`text-foreground font-bold leading-tight font-heading line-clamp-2 text-${compact ? "xs" : "sm"}`}>
          {displayName}
        </h3>
        {group.approved === false && (
          <div className="inline-flex items-center mt-1 px-2 py-1 bg-red-500/10 backdrop-blur-sm rounded-lg border border-red-500/20">
            <span className="text-red-500 text-xs font-medium">NÃO APROVADO</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupCard;
