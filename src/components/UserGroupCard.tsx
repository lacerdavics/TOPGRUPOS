import { Users, Edit, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  membersCount?: number;
  imageUrl?: string;
}

interface UserGroupCardProps {
  group: Group;
  onPromote: (groupId: string) => void;
  onEdit: (groupId: string) => void;
}

const UserGroupCard = ({ group, onPromote, onEdit }: UserGroupCardProps) => {
  const navigate = useNavigate();

  const handlePromoteClick = () => {
    navigate('/promover');
  };
  return (
    <div className="bg-card rounded-xl p-4 border hover:shadow-lg transition-all duration-200 hover:scale-[1.02] flex flex-col h-full min-h-[320px]">
      {/* Group Image */}
      <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden mb-4">
        {group.imageUrl ? (
          <img 
            src={group.imageUrl} 
            alt={group.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Users className="w-12 h-12 text-muted-foreground" />
        )}
      </div>
      
      {/* Group Info */}
      <div className="flex-1 space-y-3 mb-4">
        <h3 className="font-semibold text-lg line-clamp-2 leading-tight">{group.name}</h3>
        <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">{group.description}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
            {group.category}
          </span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            {group.membersCount || 0}
          </span>
        </div>
      </div>
      
      {/* Action Buttons - Fixed at bottom */}
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
      </div>
    </div>
  );
};

export default UserGroupCard;