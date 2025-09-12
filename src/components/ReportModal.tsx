import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Flag } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  onSubmit?: (reason: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groupName,
  onSubmit,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setIsSubmitting(true);

    try {
      // Chama callback externo, se existir
      if (onSubmit) {
        await onSubmit(reason);
      }

      // Simula envio
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
        setReason('');
      }, 500);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          fixed bottom-0 left-1/2 -translate-x-1/2 w-[95vw] p-4
          sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
          sm:max-w-md bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl
          overflow-y-auto z-50
        "
      >
        {/* Header */}
        <DialogHeader className="text-center sm:text-left space-y-3">
          <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center justify-center gap-2">
            <Flag className="w-5 h-5" />
            Denunciar "{groupName}"
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Explique o motivo da denúncia. Nossa equipe irá analisar o conteúdo.
          </DialogDescription>
        </DialogHeader>

        {/* Close button */}
        <DialogClose asChild>
          <button className="absolute top-3 right-3 p-1.5 rounded-full bg-muted/90 backdrop-blur-sm hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
            <span className="sr-only">Fechar</span>
          </button>
        </DialogClose>

        {/* Textarea */}
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full h-32 p-3 border border-border rounded-lg mt-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Motivo da denúncia..."
        />

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-5">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:flex-1 order-2 sm:order-1"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="w-full sm:flex-1 order-1 sm:order-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Denúncia'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
