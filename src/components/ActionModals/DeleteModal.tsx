import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  groupName?: string;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  groupName,
  title,
  description,
  confirmText,
  cancelText,
  isLoading = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-md mx-auto rounded-2xl p-4 sm:p-6 border-red-200 dark:border-red-800">
        
        {/* Header com ícone de alerta */}
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <div className="space-y-2">
            <DialogTitle className="text-lg sm:text-xl font-bold text-red-900 dark:text-red-100">
              {title || "Confirmar Exclusão"}
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed px-2">
              {description || `Tem certeza que deseja apagar permanentemente o grupo:`}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Nome do grupo destacado */}
        {groupName && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4 my-4">
            <p className="font-semibold text-center text-red-900 dark:text-red-100 break-words">
              "{groupName}"
            </p>
          </div>
        )}

        {/* Aviso importante */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
              <strong>Atenção:</strong> Esta ação não pode ser desfeita. O grupo será removido permanentemente da plataforma.
            </p>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:flex-1 h-11 sm:h-12 text-sm sm:text-base"
          >
            {cancelText || "Cancelar"}
          </Button>

          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:flex-1 h-11 sm:h-12 text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {confirmText || "Apagando..."}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {confirmText || "Apagar Grupo"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
