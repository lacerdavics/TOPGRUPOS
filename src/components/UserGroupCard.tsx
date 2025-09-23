import { Edit, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import IntelligentGroupImage from "@/components/IntelligentGroupImage";
import { decodeHtmlEntities } from "@/lib/utils";
import { sanitizeGroupTitle } from "@/utils/groupValidation";
import { useEffect } from "react";

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  telegramUrl?: string;
  profileImage?: string;
}

interface UserGroupCardProps {
  group: Group;
  onPromote: (groupId: string) => void;
  onEdit: (groupId: string) => void;
  onGroupUpdate?: () => void;
}

const UserGroupCard = ({ group, onPromote, onEdit, onGroupUpdate }: UserGroupCardProps) => {
  const navigate = useNavigate();

  // Listen for image correction events
  useEffect(() => {
    const handleImageCorrection = (event: CustomEvent) => {
      console.log('🔔 UserGroupCard: Evento de correção de imagem recebido:', event.detail);
      
      // Check if this event is for our group
      if (event.detail.groupId === group.id) {
        console.log(`✅ UserGroupCard: Imagem corrigida para grupo ${group.id} (${group.name})`);
        console.log(`🆕 Nova URL: ${event.detail.newImageUrl}`);
        console.log(`🗑️ URL antiga: ${event.detail.oldImageUrl}`);
        
        // Trigger parent component to refetch data from Firestore
        if (onGroupUpdate) {
          console.log('🔄 UserGroupCard: Solicitando atualização dos dados do grupo...');
          onGroupUpdate();
        } else {
          console.log('⚠️ UserGroupCard: onGroupUpdate não fornecido, não é possível atualizar');
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
  const handlePromoteClick = () => {
    navigate('/promover');
  };

  const handleDeleteClick = () => {
    navigate(`/grupo/${group.id}/apagar?name=${encodeURIComponent(group.name)}`);
  };
  const decodedName = decodeHtmlEntities(group.name);
  const sanitizedName = sanitizeGroupTitle(decodedName);

  console.log(`🔍 UserGroupCard - Grupo ${group.id}:`, {
    name: group.name,
    imageUrl: group.imageUrl,
    profileImage: group.profileImage,
    telegramUrl: group.telegramUrl,
  });

  return (
    <div className="bg-card rounded-xl p-4 border hover:shadow-lg transition-all duration-200 hover:scale-[1.02] flex flex-col h-full min-h-[320px]">
      {/* Group Image */}
      <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden mb-4">
        <IntelligentGroupImage
          telegramUrl={group.telegramUrl || ''}
          fallbackImageUrl={group.imageUrl || group.profileImage}
          groupName={sanitizedName}
          alt={`Imagem do grupo ${sanitizedName}`}
          className="w-full h-full object-cover"
          priority={false}
          groupId={group.id}
        />
      </div>
      
      {/* Group Info */}
      <div className="flex-1 space-y-3 mb-4">
        <h3 className="font-semibold text-lg line-clamp-2 leading-tight">{sanitizedName}</h3>
        <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">{group.description}</p>
        {/* Apenas a categoria */}
        <div className="pt-2">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
            {group.category}
          </span>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-3 border-t border-border mt-auto">
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1 text-xs h-8"
          onClick={handlePromoteClick}
        >
          <ExternalLink className="w-3 h-3" />
          Promover
        </Button>
        
        <Button
          size="sm"
          variant="secondary"
          className="w-full gap-1 text-xs h-8"
          onClick={() => onEdit(group.id)}
        >
          <Edit className="w-3 h-3" />
          Editar
        </Button>
        
        <Button
          size="sm"
          variant="destructive"
          className="w-full gap-1 text-xs h-8"
          onClick={handleDeleteClick}
        >
          <Trash2 className="w-3 h-3" />
          Excluir
        </Button>
      </div>
    </div>
  );
};

export default UserGroupCard;
