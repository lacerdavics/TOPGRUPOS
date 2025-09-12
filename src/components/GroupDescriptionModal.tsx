import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import IntelligentGroupImage from "@/components/IntelligentGroupImage";
import { ExternalLink, Eye, Flag } from "lucide-react";
import { ReportModal } from "@/components/ReportModal";

interface GroupDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: {
    id: string;
    name: string;
    description: string;
    telegramUrl: string;
    category: string;
    imageUrl?: string;
    viewCount?: number;
  };
  onProceedToGroup: () => void;
}

export const GroupDescriptionModal: React.FC<GroupDescriptionModalProps> = ({
  isOpen,
  onClose,
  group,
  onProceedToGroup,
}) => {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Preserva a posição do scroll
  useEffect(() => {
    if (isOpen) setScrollPosition(window.scrollY);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && scrollPosition > 0) window.scrollTo(0, scrollPosition);
  }, [isOpen, scrollPosition]);

  const handleProceed = () => {
    onProceedToGroup();
    onClose();
  };

  const handleReportClick = () => setReportModalOpen(true);

  const decodeHtml = (html: string) => {
    if (!html) return html;
    return html
      .replace(/&#39;/g, "'")
      .replace(/&#33;/g, "!")
      .replace(/&#34;/g, '"')
      .replace(/&#38;/g, "&")
      .replace(/&amp;/g, "&");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[60vw] xl:w-[50vw]
          max-h-[90vh] sm:max-h-[85vh] lg:max-h-[80vh]
          overflow-y-auto p-4 sm:p-6 lg:p-8
          mx-auto rounded-2xl
        "
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight">
            {decodeHtml(group.name)}
          </DialogTitle>
          <DialogDescription className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <Badge variant="secondary" className="text-xs sm:text-sm">
              {group.category}
            </Badge>
            {group.viewCount && group.viewCount > 0 && (
              <span className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                <Eye className="h-3 w-3" />
                {group.viewCount > 999
                  ? `${(group.viewCount / 1000).toFixed(1)}k`
                  : group.viewCount.toLocaleString()}{" "}
                visualizações
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 sm:space-y-6 lg:space-y-8">
          {/* Imagem do grupo */}
          <div className="relative w-full h-32 sm:h-48 lg:h-56 xl:h-64 rounded-xl overflow-hidden">
            <IntelligentGroupImage
              telegramUrl={group.telegramUrl || ""}
              fallbackImageUrl={group.imageUrl}
              groupName={group.name}
              alt={group.name}
              className="w-full h-full"
              priority
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <h4 className="font-semibold text-base sm:text-lg">Descrição:</h4>
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base lg:text-lg">
              {decodeHtml(group.description) || "Sem descrição disponível."}
            </p>
          </div>

          {/* Rodapé com botões */}
          <div className="border-t pt-4 sm:pt-6 space-y-4">
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
              Ao clicar em "Entrar no Grupo", você será redirecionado para o Telegram.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap justify-end gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto text-sm sm:text-base order-3 sm:order-1"
              >
                Fechar
              </Button>
              <Button
                variant="outline"
                onClick={handleReportClick}
                className="w-full sm:w-auto gap-2 text-sm sm:text-base order-2"
              >
                <Flag className="h-4 w-4" />
                Denunciar
              </Button>
              <Button
                onClick={handleProceed}
                className="w-full sm:w-auto gap-2 text-sm sm:text-base font-semibold order-1 sm:order-3"
              >
                <ExternalLink className="h-4 w-4" />
                Entrar no Grupo
              </Button>
            </div>
          </div>
        </div>

        {/* Report Modal */}
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          groupId={group.id}
          groupName={group.name}
          onSubmit={(reason) => {
            console.log("Denúncia enviada:", reason, "para o grupo:", group.id);
            setReportModalOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
