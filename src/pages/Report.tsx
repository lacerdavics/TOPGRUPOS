import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { submitReport } from "@/services/reportService";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";

const reportTypes = [
  { value: "spam", label: "Spam ou conteúdo repetitivo" },
  { value: "inappropriate", label: "Conteúdo inapropriado" },
  { value: "fake", label: "Grupo falso ou enganoso" },
  { value: "inactive", label: "Grupo inativo ou link quebrado" },
  { value: "adult", label: "Conteúdo adulto não categorizado" },
  { value: "scam", label: "Golpe ou fraude" },
  { value: "other", label: "Outros" }
];

const Report: React.FC = () => {
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
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (!groupId) {
      toast({
        title: "Erro",
        description: "ID do grupo não encontrado.",
        variant: "destructive"
      });
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

      toast({
        title: "Denúncia enviada",
        description: "Sua denúncia foi enviada com sucesso. Obrigado por nos ajudar a manter a qualidade da plataforma.",
        variant: "default"
      });

      // Reset form
      setReportType('');
      setReason('');
      setDescription('');
      
      // Navigate back
      navigate(-1);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar denúncia. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Button 
            onClick={() => navigate(-1)} 
            variant="ghost" 
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {/* Report Form Card */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">Denunciar Grupo</h1>
              <p className="text-muted-foreground mb-6">
                Você está denunciando o grupo: <strong>{groupName}</strong>
              </p>
              
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                  ⚠️ Aviso Importante
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Denúncias sem fundamento ou fraudulentas serão ignoradas. Caso haja abuso do sistema, o usuário será banido por IP.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reportType">Tipo de Denúncia *</Label>
                <Select value={reportType} onValueChange={setReportType} required>
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo da Denúncia *</Label>
                <Input
                  id="reason"
                  placeholder="Resuma o problema em poucas palavras"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={100}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {reason.length}/100 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição Detalhada *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva em detalhes o problema encontrado..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={6}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {description.length}/500 caracteres
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 flex-1 sm:flex-initial"
                >
                  {isSubmitting ? "Enviando..." : "Enviar Denúncia"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Report;