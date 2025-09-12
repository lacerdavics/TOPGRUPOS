import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Ban, AlertCircle } from "lucide-react";

interface SuspendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  groupName: string;
  isLoading?: boolean;
}

export const SuspendModal: React.FC<SuspendModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  groupName,
  isLoading = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-md mx-auto rounded-2xl p-4 sm:p-6 border-orange-200 dark:border-orange-800">
        {/* Header com ícone de suspensão */}
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <Ban className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          
          <div className="space-y-2">
            <DialogTitle className="text-lg sm:text-xl font-bold text-orange-900 dark:text-orange-100">
              Confirmar Suspensão
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed px-2">
              Tem certeza que deseja <strong className="text-orange-600">suspender</strong> o grupo:
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Nome do grupo destacado */}
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 my-4">
          <p className="font-semibold text-center text-orange-900 dark:text-orange-100 break-words">
            "{groupName}"
          </p>
        </div>

        {/* Informação sobre suspensão */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">O que acontece ao suspender:</p>
              <ul className="space-y-1 text-xs">
                <li>• O grupo será removido da plataforma</li>
                <li>• Não será deletado permanentemente</li>
                <li>• Pode ser reativado posteriormente</li>
                <li>• Usuários não conseguirão mais encontrá-lo</li>
              </ul>
            </div>
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
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:flex-1 h-11 sm:h-12 text-sm sm:text-base bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Suspendendo...
              </>
            ) : (
              <>
                <Ban className="w-4 h-4" />
                Suspender Grupo
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};