import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flag, AlertTriangle, Send } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reportData: {
    type: string;
    reason: string;
    description: string;
  }) => void;
  groupName: string;
  isLoading?: boolean;
}

const reportTypes = [
  { value: "spam", label: "Spam ou conteúdo repetitivo" },
  { value: "inappropriate", label: "Conteúdo inapropriado" },
  { value: "fake", label: "Grupo falso ou enganoso" },
  { value: "inactive", label: "Grupo inativo ou link quebrado" },
  { value: "adult", label: "Conteúdo adulto não categorizado" },
  { value: "scam", label: "Golpe ou fraude" },
  { value: "other", label: "Outros" }
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  groupName,
  isLoading = false
}) => {
  const [reportType, setReportType] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportType || !reason.trim() || !description.trim()) {
      return;
    }

    onSubmit({
      type: reportType,
      reason: reason.trim(),
      description: description.trim()
    });

    // Reset form
    setReportType('');
    setReason('');
    setDescription('');
  };

  const isFormValid = reportType && reason.trim().length >= 5 && description.trim().length >= 20;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-lg mx-auto rounded-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <Flag className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <div className="space-y-2">
            <DialogTitle className="text-lg sm:text-xl font-bold">
              Denunciar Grupo
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Você está denunciando: <strong className="text-foreground">"{groupName}"</strong>
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Aviso importante */}
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-semibold mb-1">⚠️ Aviso Importante</p>
              <p>Denúncias sem fundamento ou fraudulentas serão ignoradas. Caso haja abuso do sistema, o usuário será banido por IP.</p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Tipo de denúncia */}
          <div className="space-y-2">
            <Label htmlFor="reportType" className="text-sm font-medium">
              Tipo de Denúncia *
            </Label>
            <Select value={reportType} onValueChange={setReportType} required>
              <SelectTrigger className="h-11 sm:h-12 text-sm sm:text-base">
                <SelectValue placeholder="Selecione o tipo de problema" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-sm sm:text-base">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Motivo resumido */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Motivo da Denúncia *
            </Label>
            <Input
              id="reason"
              placeholder="Resuma o problema em poucas palavras"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={100}
              required
              className="h-11 sm:h-12 text-sm sm:text-base"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mínimo 5 caracteres</span>
              <span className={reason.length < 5 ? "text-amber-600" : "text-green-600"}>
                {reason.length}/100
              </span>
            </div>
          </div>

          {/* Descrição detalhada */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição Detalhada *
            </Label>
            <Textarea
              id="description"
              placeholder="Descreva em detalhes o problema encontrado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              required
              className="resize-none text-sm sm:text-base"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mínimo 20 caracteres</span>
              <span className={description.length < 20 ? "text-amber-600" : "text-green-600"}>
                {description.length}/500
              </span>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:flex-1 h-11 sm:h-12 text-sm sm:text-base"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full sm:flex-1 h-11 sm:h-12 text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Denúncia
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};