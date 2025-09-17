import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { categories } from "@/data/categories";
import CategoryIcon from "@/components/CategoryIcon";
import { useAuth } from "@/contexts/AuthContext";
import { checkIsAdmin } from "@/services/userService";
import { updateGroupCategory } from "@/services/groupService";
import { toast } from "sonner";
import Footer from "@/components/Footer";

const RecategorizeGroup: React.FC = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  
  const groupName = searchParams.get('name') || 'Grupo desconhecido';
  const currentCategory = searchParams.get('category') || '';
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const currentCategoryData = categories.find(cat => cat.id === currentCategory);
  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser?.uid) {
        const adminStatus = await checkIsAdmin(currentUser.uid);
        setIsAdmin(adminStatus);
        
        if (!adminStatus) {
          toast.error("Acesso negado. Apenas administradores podem recategorizar grupos.");
          navigate(-1);
        }
      } else {
        navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
      }
      setIsCheckingAuth(false);
    };

    checkAdminStatus();
  }, [currentUser?.uid, navigate]);

  const handleCategorySelect = () => {
    if (!selectedCategory || selectedCategory === currentCategory) {
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (!groupId) return;

    setIsLoading(true);
    
    try {
      await updateGroupCategory(groupId, selectedCategory);
      
      toast.success(`Grupo recategorizado com sucesso para "${selectedCategoryData?.name}"!`);
      
      navigate(-1);
    } catch (error) {
      console.error('Erro ao recategorizar grupo:', error);
      toast.error('Erro ao recategorizar grupo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleBack = () => {
    setShowConfirmation(false);
  };

  const isFormValid = selectedCategory && selectedCategory !== currentCategory;

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

          {!showConfirmation ? (
            <Card className="p-8 shadow-lg border">
              {/* Header - Seleção de Categoria */}
              <div className="text-center space-y-6 mb-8">
                <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                
                <div className="space-y-3">
                  <h1 className="text-2xl sm:text-3xl font-bold">Recategorizar Grupo</h1>
                  <p className="text-muted-foreground leading-relaxed">
                    Selecione a nova categoria para: <strong className="text-foreground">"{groupName}"</strong>
                  </p>
                </div>
              </div>

              {/* Categoria Atual */}
              <div className="bg-muted/50 border border-border/50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  {currentCategoryData && (
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentCategoryData.color} flex items-center justify-center`}>
                      <CategoryIcon iconData={currentCategoryData.icon} size={20} color="white" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Categoria Atual:</p>
                    <p className="font-semibold">{currentCategoryData?.name || currentCategory}</p>
                  </div>
                </div>
              </div>

              {/* Seleção de Nova Categoria */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="newCategory" className="text-sm font-medium">
                    Nova Categoria *
                  </Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecione a nova categoria" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {categories
                        .filter(cat => cat.id !== currentCategory)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id} className="text-base">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                                <CategoryIcon iconData={category.icon} size={14} color="white" />
                              </div>
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview da Nova Categoria */}
                {selectedCategoryData && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedCategoryData.color} flex items-center justify-center`}>
                        <CategoryIcon iconData={selectedCategoryData.icon} size={20} color="white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">Nova Categoria:</p>
                        <p className="font-semibold text-green-900 dark:text-green-100">{selectedCategoryData.name}</p>
                        <p className="text-xs text-green-700 dark:text-green-300">{selectedCategoryData.description}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 h-12 text-base"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCategorySelect}
                  disabled={isLoading || !isFormValid}
                  className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Continuar
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-8 shadow-lg border">
              {/* Header - Confirmação */}
              <div className="text-center space-y-6 mb-8">
                <div className="mx-auto w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                </div>
                
                <div className="space-y-3">
                  <h1 className="text-2xl sm:text-3xl font-bold">Confirmar Recategorização</h1>
                  <p className="text-muted-foreground leading-relaxed">
                    Tem certeza que deseja mover o grupo para a nova categoria?
                  </p>
                </div>
              </div>

              {/* Nome do grupo */}
              <div className="bg-card/50 border border-border/50 rounded-lg p-4 mb-6">
                <p className="font-semibold text-center break-words">
                  "{groupName}"
                </p>
              </div>

              {/* Mudança de Categoria */}
              <div className="space-y-4 mb-8">
                {/* Categoria Atual */}
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                  {currentCategoryData && (
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentCategoryData.color} flex items-center justify-center`}>
                      <CategoryIcon iconData={currentCategoryData.icon} size={16} color="white" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-red-700 dark:text-red-300 font-medium">DE:</p>
                    <p className="font-semibold text-red-900 dark:text-red-100">{currentCategoryData?.name}</p>
                  </div>
                </div>

                {/* Seta */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                    ↓
                  </div>
                </div>

                {/* Nova Categoria */}
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  {selectedCategoryData && (
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedCategoryData.color} flex items-center justify-center`}>
                      <CategoryIcon iconData={selectedCategoryData.icon} size={16} color="white" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-green-700 dark:text-green-300 font-medium">PARA:</p>
                    <p className="font-semibold text-green-900 dark:text-green-100">{selectedCategoryData?.name}</p>
                  </div>
                </div>
              </div>

              {/* Aviso */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-semibold mb-2">O que acontece:</p>
                    <ul className="space-y-1 text-sm">
                      <li>• O grupo será movido para a nova categoria</li>
                      <li>• Aparecerá nas buscas da nova categoria</li>
                      <li>• Será registrado como recategorizado</li>
                      <li>• Esta ação pode ser desfeita posteriormente</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botões de Confirmação */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex-1 h-12 text-base"
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 h-12 text-base bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Movendo...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirmar Mudança
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RecategorizeGroup;