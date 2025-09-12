import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Ban, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { checkIsAdmin } from "@/services/userService";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import Footer from "@/components/Footer";

const SuspendGroup: React.FC = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const groupName = searchParams.get('name') || 'Grupo desconhecido';

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser?.uid) {
        const adminStatus = await checkIsAdmin(currentUser.uid);
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          toast.error("Acesso negado. Apenas administradores podem suspender grupos.");
          navigate(-1);
        }
      } else {
        navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      }
      setIsCheckingAuth(false);
    };

    checkAdminStatus();
  }, [currentUser?.uid, navigate]);

  const handleSuspendGroup = async () => {
    if (!groupId) return;
    
    setIsLoading(true);
    try {
      await updateDoc(doc(db, "groups", groupId), {
        approved: false,
        suspended: true,
        suspendedAt: new Date(),
        suspendedBy: currentUser?.uid
      });
      toast.success("Grupo suspenso com sucesso!");
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error("Erro ao suspender grupo. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

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

          {/* Suspend Confirmation Card */}
          <Card className="p-8 shadow-lg border-orange-200 dark:border-orange-800">
            {/* Header com ícone de suspensão */}
            <div className="text-center space-y-6 mb-8">
              <div className="mx-auto w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                <Ban className="w-10 h-10 text-orange-600 dark:text-orange-400" />
              </div>
              
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-orange-900 dark:text-orange-100">
                  Confirmar Suspensão
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  Tem certeza que deseja <strong className="text-orange-600">suspender</strong> o grupo:
                </p>
              </div>
            </div>

            {/* Nome do grupo destacado */}
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-6 mb-8">
              <p className="font-semibold text-center text-orange-900 dark:text-orange-100 break-words text-lg">
                "{groupName}"
              </p>
            </div>

            {/* Informação sobre suspensão */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-2">O que acontece ao suspender:</p>
                  <ul className="space-y-1 text-sm">
                    <li>• O grupo será removido da plataforma temporariamente</li>
                    <li>• Não será deletado permanentemente</li>
                    <li>• Pode ser reativado posteriormente por um administrador</li>
                    <li>• Usuários não conseguirão mais encontrá-lo nas buscas</li>
                    <li>• O grupo ficará marcado como "suspenso" no sistema</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 h-12 text-base"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSuspendGroup}
                disabled={isLoading}
                className="flex-1 h-12 text-base bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Suspendendo...
                  </>
                ) : (
                  <>
                    <Ban className="w-5 h-5" />
                    Suspender Grupo
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SuspendGroup;