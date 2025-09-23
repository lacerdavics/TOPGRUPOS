import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Users, Tag } from "lucide-react";
import { Group } from "./GroupCard";
import { getCategoryById } from "@/data/categories";
import CategoryIcon from "@/components/CategoryIcon";
import { decodeHtmlEntities } from "@/lib/utils";
import IntelligentGroupImage from "@/components/IntelligentGroupImage";

interface GroupModalProps {
  group: Group | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GroupModal = ({ group, open, onOpenChange }: GroupModalProps) => {
  if (!group) return null;

  // Decode HTML entities in group name and description
  const decodedName = decodeHtmlEntities(group.name);
  const decodedDescription = decodeHtmlEntities(group.description);

  const category = getCategoryById(group.category);
  


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-y-auto">
        <DialogHeader className="space-y-4 pb-4">
          <div className="flex items-center space-x-4">
            {/* Group Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
              {group.name ? (
                <IntelligentGroupImage
                  fallbackImageUrl={group.profileImage || group.imageUrl}
                  telegramUrl={group.telegramUrl}
                  groupName={decodedName}
                  alt={decodedName}
                  className="w-full h-full object-cover"
                  priority={true}
                  groupId={group.id}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted/80 flex items-center justify-center">
                  <div className="text-muted-foreground/60 text-xl font-bold">📷</div>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold leading-tight text-left">
                {decodedName}
              </DialogTitle>
              {group.membersCount && (
                <div className="flex items-center mt-2">
                  <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {group.membersCount.toLocaleString()} membros
                  </span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Category */}
          {category && (
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center space-x-2">
                {category.icon && (
                  <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                    <CategoryIcon iconData={category.icon} size={14} color="white" />
                  </div>
                )}
                <Badge variant="outline" className="text-xs">
                  {category.name}
                </Badge>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Descrição
            </h4>
            <p className="text-foreground leading-relaxed text-sm">
              {decodedDescription}
            </p>
          </div>

          {/* Action Button */}
          <div className="space-y-3 pt-4">
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
              asChild
            >
              <a 
                href={group.telegramUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Entrar no Grupo
              </a>
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Você será redirecionado para o Telegram
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupModal;