import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { checkIsAdmin } from "@/services/userService";
import { doc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import Footer from "@/components/Footer";

const DeleteGroup: React.FC = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [groupData, setGroupData] = useState<any>(null);

  const groupName = searchParams.get('name') || 'Grupo desconhecido';

  useEffect(() => {
    const checkPermissions = async () => {
      if (!currentUser?.uid) {
        navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
        return;
      }

      if (!groupId) {
        toast.error("ID do grupo não encontrado.");
        navigate('/');
        return;
      }

      try {
        // Check if user is admin
        const adminStatus = await checkIsAdmin(currentUser.uid);
        setIsAdmin(adminStatus);

        // Get group data to check ownership
        const groupRef = doc(db, "groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
          toast.error("Grupo não encontrado.");
          navigate('/');
          return;
        }

        const data = groupSnap.data();
        setGroupData(data);

        // Check if user can delete this group
        const isOwner = data.userId === currentUser.uid || data.userEmail === currentUser.email;
        const canUserDelete = adminStatus || isOwner;

        if (!canUserDelete) {
          toast.error("Acesso negado. Você só pode excluir grupos que você cadastrou ou ser administrador.");
          navigate(-1);
          return;
        }

        setCanDelete(true);
      } catch (error) {
        console.error("Erro ao verificar permissões:", error);
        toast.error("Erro ao verificar permissões.");
        navigate(-1);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkPermissions();
  }, [currentUser?.uid, groupId, navigate]);

  const handleDeleteGroup = async () => {
    if (!groupId) return;
    
    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "groups", groupId));
      
      toast.success("Grupo excluído com sucesso!", {
        description: "O grupo foi removido permanentemente da plataforma."
      });
      
      // Redirect based on user type
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/meus-grupos');
      }
    } catch (error) {
      console.error("Erro ao excluir grupo:", error);
      toast.error("Erro ao excluir grupo. Tente novamente.");
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
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!canDelete) {
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

          {/* Delete Confirmation Card */}
          <Card className="p-8 shadow-lg border-red-200 dark:border-red-800">
            {/* Header com ícone de alerta */}
            <div className="text-center space-y-6 mb-8">
              <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-red-900 dark:text-red-100">
                  Confirmar Exclusão
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  Tem certeza que deseja <strong className="text-red-600">excluir permanentemente</strong> o grupo:
                </p>
              </div>
            </div>

            {/* Nome do grupo destacado */}
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-8">
              <p className="font-semibold text-center text-red-900 dark:text-red-100 break-words text-lg">
                "{groupName}"
              </p>
            </div>

            {/* Informações sobre permissões */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-2">
                    {isAdmin ? "🛡️ Você é administrador" : "👤 Você é o proprietário deste grupo"}
                  </p>
                  <p className="text-xs">
                    {isAdmin 
                      ? "Como administrador, você pode excluir qualquer grupo da plataforma."
                      : "Como proprietário, você pode excluir apenas os grupos que você cadastrou."
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Aviso importante */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-semibold mb-2">⚠️ Atenção - Esta ação é irreversível!</p>
                  <ul className="space-y-1 text-sm">
                    <li>• O grupo será removido permanentemente da plataforma</li>
                    <li>• Todos os dados relacionados serão perdidos</li>
                    <li>• Esta ação não pode ser desfeita</li>
                    <li>• O grupo não aparecerá mais nas buscas</li>
                    {isAdmin && (
                      <li>• O usuário que cadastrou será notificado da exclusão</li>
                    )}
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
                onClick={handleDeleteGroup}
                disabled={isLoading}
                className="flex-1 h-12 text-base bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Excluir Grupo Permanentemente
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

export default DeleteGroup;