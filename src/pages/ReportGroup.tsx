import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { submitReport } from "@/services/reportService";
import { ArrowLeft, Flag, AlertTriangle, Send } from "lucide-react";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const reportTypes = [
  { value: "spam", label: "Spam ou conteúdo repetitivo" },
  { value: "inappropriate", label: "Conteúdo inapropriado" },
  { value: "fake", label: "Grupo falso ou enganoso" },
  { value: "inactive", label: "Grupo inativo ou link quebrado" },
  { value: "adult", label: "Conteúdo adulto não categorizado" },
  { value: "scam", label: "Golpe ou fraude" },
  { value: "other", label: "Outros" }
];

const ReportGroup: React.FC = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groupName = searchParams.get('name') || 'Grupo desconhecido';
  
  const [reportType, setReportType] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reportType || !reason.trim() || !description.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (reason.trim().length < 5) {
      toast.error("O motivo deve ter pelo menos 5 caracteres.");
      return;
    }

    if (description.trim().length < 20) {
      toast.error("A descrição deve ter pelo menos 20 caracteres.");
      return;
    }

    if (!groupId) {
      toast.error("ID do grupo não encontrado.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await submitReport({
        groupId,
        groupName,
        reportType,
        reason: reason.trim(),
        description: description.trim()
      });

      toast.success("Denúncia enviada com sucesso. Obrigado por nos ajudar a manter a qualidade da plataforma.");

      // Reset form
      setReportType('');
      setReason('');
      setDescription('');
      
      // Navigate back
      navigate(-1);
    } catch (error) {
      toast.error("Erro ao enviar denúncia. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const isFormValid = reportType && reason.trim().length >= 5 && description.trim().length >= 20;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Button 
            onClick={handleCancel} 
            variant="ghost" 
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {/* Report Form Card */}
          <Card className="p-8 shadow-lg border">
            {/* Header */}
            <div className="text-center space-y-6 mb-8">
              <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <Flag className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-bold">Denunciar Grupo</h1>
                <p className="text-muted-foreground leading-relaxed">
                  Você está denunciando o grupo: <strong className="text-foreground">"{groupName}"</strong>
                </p>
              </div>
            </div>
            
            {/* Aviso importante */}
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold mb-2">⚠️ Aviso Importante</p>
                  <p>Denúncias sem fundamento ou fraudulentas serão ignoradas. Caso haja abuso do sistema, o usuário será banido por IP.</p>
                </div>
              </div>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de denúncia */}
              <div className="space-y-2">
                <Label htmlFor="reportType" className="text-sm font-medium">
                  Tipo de Denúncia *
                </Label>
                <Select value={reportType} onValueChange={setReportType} required>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o tipo de problema" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
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
                  className="h-12"
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
                  rows={6}
                  required
                  className="resize-none"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mínimo 20 caracteres</span>
                  <span className={description.length < 20 ? "text-amber-600" : "text-green-600"}>
                    {description.length}/500
                  </span>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 h-12 text-base"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className="flex-1 h-12 text-base bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Enviar Denúncia
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReportGroup;