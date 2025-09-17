import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BatchUpload } from "@/components/BatchUpload";
import CategoryIcon from "@/components/CategoryIcon";

import { categories } from "@/data/categories";
import { addGroup } from "@/services/groupService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Send, ExternalLink, CheckCircle, Users, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { decodeHtmlEntities } from "@/lib/utils";
import { telegramBatchService } from "@/services/telegramBatchService";
import SEOHead from "@/components/SEOHead";
import { imageUploadService } from "@/services/imageUploadService";

const CadastrarGrupo = () => {
  const [formData, setFormData] = useState({
    telegramUrl: "",
    category: "",
    groupName: "",
    description: "",
    profileImage: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGroupInfo, setIsLoadingGroupInfo] = useState(false);
  const [hasCustomPhoto, setHasCustomPhoto] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [urlError, setUrlError] = useState("");
  const [showPhotoRetryButton, setShowPhotoRetryButton] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const { toast } = useToast();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Check if current user is admin
  const isAdmin = currentUser?.email === 'victorlacerdaprods@gmail.com';

  // Handle batch processing through normal form
  const handleBatchItem = async (url: string, category: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        setIsBatchProcessing(true);
        
        // Clear form first
        setFormData({
          telegramUrl: "",
          category: "",
          groupName: "",
          description: "",
          profileImage: ""
        });
        
        // Set URL and category
        setFormData(prev => ({
          ...prev,
          telegramUrl: url,
          category: category
        }));
        
        // Wait for the automatic extraction to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get group info
        const groupInfo = await telegramBatchService.getGroupInfo(url);
        
        if (groupInfo.error) {
          throw new Error(groupInfo.error);
        }

        const title = telegramBatchService.getTitle(groupInfo, url);
        const description = telegramBatchService.getDescription(groupInfo);
        const imageUrl = telegramBatchService.getImageUrl(groupInfo, title);
        const isValidForRegistration = groupInfo.is_valid_for_registration !== false;

        if (!isValidForRegistration) {
          throw new Error("Grupo rejeitado: usa foto padrão do Telegram");
        }

        if (!title || title === "Telegram" || title.includes("Telegram: Contact")) {
          throw new Error("Dados do grupo não encontrados");
        }

        // Update form with extracted data
        const finalDescription = description !== 'Descrição não disponível' ? 
          decodeHtmlEntities(description) : 
          `Grupo da categoria ${category}. Uma comunidade ativa no Telegram para discussões e compartilhamento de conteúdo relacionado.`;

        setFormData(prev => ({
          ...prev,
          groupName: decodeHtmlEntities(title),
          description: finalDescription,
          profileImage: imageUrl
        }));

        setHasCustomPhoto(Boolean(groupInfo.has_custom_image));

        // Download and upload image to Firebase Storage first
        let finalImageUrl = imageUrl;
        
        if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
          console.log('🔄 Processando imagem via batch...');
          
          const tempGroupId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const uploadResult = await imageUploadService.downloadAndUploadImage(imageUrl, tempGroupId);
          
          if (uploadResult.success && uploadResult.url) {
            finalImageUrl = uploadResult.url;
            console.log('✅ Imagem batch salva no Firebase Storage:', finalImageUrl);
          } else {
            console.warn('⚠️ Falha no upload da imagem batch, usando URL original:', uploadResult.error);
          }
        }

        // Prepare group data
        const groupData = {
          name: decodeHtmlEntities(title),
          description: finalDescription,
          category: category,
          telegramUrl: url,
          profileImage: finalImageUrl,
          membersCount: 0,
          userId: currentUser.uid,
          userEmail: currentUser.email,
          hasCustomPhoto: Boolean(groupInfo.has_custom_image)
        };

        // Save to Firestore using the same service
        const docId = await addGroup(groupData);
        console.log(`✅ Grupo ${url} salvo com ID: ${docId}`);

        resolve();
        
      } catch (error) {
        console.error(`❌ Erro no processamento batch para ${url}:`, error);
        reject(error);
      } finally {
        setIsBatchProcessing(false);
      }
    });
  };

  // Check authentication when component mounts
  useEffect(() => {
    if (!currentUser) {
      navigate('/auth?redirect=/cadastrar');
    }
  }, [currentUser, navigate]);

  const validateTelegramUrl = (url: string) => {
    if (!url.trim()) {
      setUrlError("");
      return true;
    }
    
    // Regex atualizada para aceitar todos os formatos válidos do Telegram:
    // - https://t.me/nomegrupo
    // - https://t.me/+código (links de convite)
    // - https://t.me/joinchat/código
    const telegramRegex = /^https?:\/\/(t\.me|telegram\.me)\/([\w\-+]+|joinchat\/[\w\-+]+)\/?$/;
    
    if (!telegramRegex.test(url)) {
      setUrlError("Este não é um link válido do Telegram. Use links como: https://t.me/seugrupo ou https://t.me/+código");
      return false;
    }
    
    setUrlError("");
    return true;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === "telegramUrl") {
      validateTelegramUrl(value);
      setShowPhotoRetryButton(false);
      setHasCustomPhoto(false);
      
      // Limpar campos automaticamente quando URL for removida
      if (!value.trim()) {
        setFormData(prev => ({
          ...prev,
          groupName: "",
          description: "",
          profileImage: ""
        }));
      }
    }
  };

  // useEffect para monitorar mudanças na URL do Telegram em tempo real
  useEffect(() => {
    // Limpar timeout anterior
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    const url = formData.telegramUrl.trim();
    
    // Se URL estiver vazia, não fazer nada (campos já foram limpos no handleInputChange)
    if (!url) {
      return;
    }

    // Se URL for válida, fazer a busca com debounce
    if (validateTelegramUrl(url)) {
      debounceTimeout.current = setTimeout(() => {
        extractGroupInfo(url);
      }, 800); // Debounce de 800ms para ser mais responsivo
    }

    // Cleanup do timeout quando o componente for desmontado ou URL mudar
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [formData.telegramUrl]); // Reagir apenas a mudanças na URL

  const retryGroupInfo = async () => {
    if (!formData.telegramUrl) return;
    
    console.log('🔄 Rechecando dados do grupo imediatamente...');
    
    // Feedback imediato para o usuário
    toast({
      title: "🔄 Verificando foto...",
      description: "Buscando dados atualizados do grupo",
    });
    
    setShowPhotoRetryButton(false);
    setIsLoadingGroupInfo(true);
    
    // FORÇAR refresh ignorando cache
    try {
      console.log('🚀 Forçando nova consulta à API...');
      const groupInfo = await telegramBatchService.forceRefreshGroupInfo(formData.telegramUrl);
      
      if (groupInfo.error) {
        throw new Error(groupInfo.error);
      }
      
      // Verificar se obteve dados válidos do grupo
      const title = telegramBatchService.getTitle(groupInfo, formData.telegramUrl);
      const description = telegramBatchService.getDescription(groupInfo);
      const imageUrl = telegramBatchService.getImageUrl(groupInfo, title);
      const isValidForRegistration = groupInfo.is_valid_for_registration !== false;
      const hasPhoto = Boolean(groupInfo.has_custom_image);
      
      console.log('🔍 Nova validação do grupo:', {
        isValidForRegistration,
        hasPhoto,
        is_valid_for_registration: groupInfo.is_valid_for_registration,
        has_custom_image: groupInfo.has_custom_image
      });
      
      // Se não é válido para cadastro devido à foto padrão, mostrar erro imediatamente
      if (!isValidForRegistration) {
        console.log('❌ Grupo ainda rejeitado: foto padrão do Telegram');
        throw new Error("Grupo não aceito: ainda usa foto padrão do Telegram");
      }
      
      if (title && title !== "Telegram" && !title.includes("Telegram: Contact")) {
        console.log("✅ Dados válidos obtidos após force refresh");
        
        setHasCustomPhoto(hasPhoto);
        setShowPhotoRetryButton(!hasPhoto);
        
        setFormData(prev => ({
          ...prev,
          groupName: decodeHtmlEntities(title),
          description: description !== 'Descrição não disponível' ? decodeHtmlEntities(description) : prev.description,
          profileImage: imageUrl
        }));
        
        toast({
          title: "✅ Foto atualizada com sucesso!",
          description: `${decodeHtmlEntities(title)} - Foto personalizada detectada`,
        });
      } else {
        throw new Error("Dados do grupo não encontrados");
      }
    } catch (error) {
      console.error("❌ Erro ao revalidar grupo:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Verificar se é erro de foto padrão
      if (errorMessage.includes("foto padrão")) {
        toast({
          title: "❌ Foto ainda não foi atualizada",
          description: "Este grupo/canal ainda usa a foto padrão do Telegram. Verifique se você atualizou a foto corretamente.",
          variant: "destructive",
        });
        setShowPhotoRetryButton(true);
        setHasCustomPhoto(false);
      } else {
        toast({
          title: "❌ Erro ao verificar grupo",
          description: "Não foi possível verificar se a foto foi atualizada. Tente novamente.",
          variant: "destructive",
        });
        setShowPhotoRetryButton(true);
      }
    } finally {
      setIsLoadingGroupInfo(false);
    }
  };

  const extractGroupInfo = async (url: string) => {
    if (!url.includes("t.me/") && !url.includes("telegram.me/")) {
      return;
    }

    // Verificar se a URL parece completa (evitar chamadas durante a digitação)
    const urlPath = url.split("t.me/")[1];
    if (!urlPath || urlPath.length < 3) {
      return;
    }

    // Se for um link de convite, deve ter mais de 10 caracteres
    if (urlPath.startsWith("+") && urlPath.length < 10) {
      return;
    }

    setIsLoadingGroupInfo(true);

    try {
      console.log("🔍 Buscando informações do grupo via API batch:", url);
      
      const groupInfo = await telegramBatchService.getGroupInfo(url);
      
      if (groupInfo.error) {
        throw new Error(groupInfo.error);
      }
      
      // Verificar se obteve dados válidos do grupo
      const title = telegramBatchService.getTitle(groupInfo, url);
      const description = telegramBatchService.getDescription(groupInfo);
      const imageUrl = telegramBatchService.getImageUrl(groupInfo, title);
      const isValidForRegistration = groupInfo.is_valid_for_registration !== false;
      const hasPhoto = Boolean(groupInfo.has_custom_image);
      
      console.log('🔍 Validação do grupo:', {
        isValidForRegistration,
        hasPhoto,
        is_valid_for_registration: groupInfo.is_valid_for_registration,
        has_custom_image: groupInfo.has_custom_image
      });
      
      // Se não é válido para cadastro devido à foto padrão, mostrar erro imediatamente
      if (!isValidForRegistration) {
        console.log('❌ Grupo rejeitado: foto padrão do Telegram');
        throw new Error("Grupo não aceito: usa foto padrão do Telegram");
      }
      
      if (title && title !== "Telegram" && !title.includes("Telegram: Contact")) {
        console.log("✅ Dados válidos obtidos da API batch");
        
        setHasCustomPhoto(hasPhoto);
        setShowPhotoRetryButton(!hasPhoto);
        
        setFormData(prev => ({
          ...prev,
          groupName: decodeHtmlEntities(title),
          description: description !== 'Descrição não disponível' ? decodeHtmlEntities(description) : prev.description,
          profileImage: imageUrl
        }));
        
        toast({
          title: "✅ Dados obtidos com sucesso!",
          description: `Nome: ${decodeHtmlEntities(title)}${description !== 'Descrição não disponível' ? ' | Descrição carregada' : ''}`,
        });
      } else {
        throw new Error("Dados do grupo não encontrados");
      }
    } catch (error) {
      console.error("❌ Erro ao obter dados do grupo:", error);
      
      // Não exibir toast para erros de rede/timeout ou URLs incompletas
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Verificar se é erro de foto padrão
      if (errorMessage.includes("foto padrão") || errorMessage.includes("usa foto padrão")) {
        toast({
          title: "❌ Grupo não aceito",
          description: "Este grupo/canal usa a foto padrão do Telegram. Adicione uma foto personalizada antes de cadastrar.",
          variant: "destructive",
        });
        setShowPhotoRetryButton(true);
        setHasCustomPhoto(false);
      } else if (errorMessage.includes("já existente") || errorMessage.includes("duplicado")) {
        toast({
          title: "❌ Grupo já cadastrado",
          description: "Este grupo já foi cadastrado anteriormente na plataforma. Cada grupo pode ser cadastrado apenas uma vez.",
          variant: "destructive",
        });
      } else if (!errorMessage.includes("AbortError")) {
        // Só mostrar erro se não for erro de foto padrão ou timeout
        toast({
          title: "❌ Não foi possível obter os dados do grupo",
          description: "Verifique o link e tente novamente.",
          variant: "destructive",
        });
      }
      
      // Limpar campos em caso de erro
      setFormData(prev => ({
        ...prev,
        groupName: "",
        description: prev.description, // Manter descrição existente
        profileImage: ""
      }));
    } finally {
      setIsLoadingGroupInfo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔵 Iniciando submit do formulário');
    console.log('🔵 Usuário atual:', currentUser);
    
    // Check authentication before submitting
    if (!currentUser) {
      console.log('🔴 Usuário não autenticado');
      navigate('/auth?redirect=/cadastrar');
      return;
    }
    
    // Validar novamente se é link do Telegram
    if (!validateTelegramUrl(formData.telegramUrl)) {
      console.log('🔴 URL do Telegram inválida');
      toast({
        title: "Link inválido",
        description: "Por favor, insira um link válido do Telegram.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificar se todos os campos obrigatórios estão preenchidos
    if (!formData.telegramUrl || !formData.category || !formData.description || !formData.groupName) {
      console.log('🔴 Campos obrigatórios faltando');
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios incluindo o nome do grupo.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se o grupo tem foto personalizada do Telegram (não aceitar foto padrão)
    if (!hasCustomPhoto) {
      console.log('🔴 Grupo sem foto personalizada do Telegram');
      setShowPhotoRetryButton(true);
      toast({
        title: "Foto do Telegram obrigatória",
        description: "Não aceitamos grupos/canais sem foto personalizada. Atualize a foto no Telegram e clique em 'Já atualizei a foto'.",
        variant: "destructive",
      });
      return;
    }

    console.log('🔵 Dados do formulário:', formData);
    setIsLoading(true);
    
    try {
      console.log('🔵 Processando imagem e salvando grupo...');
      
      // First, generate a temporary ID for the group to use in image naming
      const tempGroupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      let finalImageUrl = formData.profileImage;
      
      // If there's an external image URL, download and upload to Firebase Storage
      if (formData.profileImage && (formData.profileImage.startsWith('http://') || formData.profileImage.startsWith('https://'))) {
        console.log('🔄 Baixando e fazendo upload da imagem para Firebase Storage...');
        
        toast({
          title: "🔄 Processando imagem...",
          description: "Fazendo upload da imagem para otimizar o carregamento",
        });
        
        const uploadResult = await imageUploadService.downloadAndUploadImage(formData.profileImage, tempGroupId);
        
        if (uploadResult.success && uploadResult.url) {
          finalImageUrl = uploadResult.url;
          console.log('✅ Imagem salva no Firebase Storage:', finalImageUrl);
        } else {
          console.warn('⚠️ Falha no upload da imagem, usando URL original:', uploadResult.error);
          // Continue with original URL as fallback
        }
      }
      
      const groupData = {
        name: formData.groupName || formData.telegramUrl.split("/").pop() || "Grupo sem nome",
        description: formData.description,
        category: formData.category,
        telegramUrl: formData.telegramUrl,
        profileImage: finalImageUrl,
        membersCount: 0,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        hasCustomPhoto: hasCustomPhoto
      };
      
      console.log('🔵 Dados que serão enviados:', groupData);
      
      const docId = await addGroup(groupData);
      console.log('🟢 Grupo salvo com sucesso! ID:', docId);

      setIsSubmitted(true);
      
      // Show different messages based on approval status
      if (hasCustomPhoto) {
        toast({
          title: "✅ Grupo aprovado automaticamente!",
          description: "Seu grupo tem foto personalizada e foi aprovado. Já está disponível na plataforma!",
        });
      } else {
        toast({
          title: "📝 Grupo enviado para análise",
          description: "Grupo sem foto personalizada precisa de aprovação manual. Será analisado em breve.",
        });
      }
      
    } catch (error) {
      console.log('🔴 Erro ao salvar grupo:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Verificar se é erro de grupo duplicado
      if (errorMessage.includes("já existente") || errorMessage.includes("duplicado")) {
        toast({
          title: "❌ Grupo já cadastrado",
          description: "Este grupo já foi cadastrado anteriormente na plataforma. Cada grupo pode ser cadastrado apenas uma vez.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao cadastrar grupo",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading if user authentication is being checked
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-success-foreground" />
            </div>
            
            <h1 className="text-3xl font-bold mb-4">
              Grupo Cadastrado com <span className="text-primary">Sucesso!</span>
            </h1>
            
            <p className="text-muted-foreground mb-8 text-lg">
              {hasCustomPhoto ? (
                <>
                  Seu grupo foi <strong className="text-green-600">aprovado automaticamente</strong> por ter foto personalizada! 
                  Já está disponível na plataforma para todos verem.
                </>
              ) : (
                <>
                  Seu grupo foi enviado para análise manual por não ter foto personalizada. 
                  Estará disponível na plataforma após aprovação.
                </>
              )}
              <br />
              Obrigado por contribuir com nossa comunidade!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" asChild>
                <Link to="/">
                  Voltar para Home
                </Link>
              </Button>
              
              <Button variant="outline" onClick={() => {
                setIsSubmitted(false);
                setFormData({
                  telegramUrl: "",
                  category: "",
                  groupName: "",
                  description: "",
                  profileImage: ""
                });
              }}>
                Cadastrar Outro Grupo
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Cadastrar Grupo do Telegram Grátis | TopGrupos"
        description="Cadastre seu grupo do Telegram gratuitamente na maior plataforma do Brasil. Alcance milhares de novos membros e faça sua comunidade crescer!"
        keywords="cadastrar grupo telegram, divulgar grupo telegram, promover grupo telegram, crescer grupo telegram, telegram marketing, comunidades telegram"
        url="https://topgrupostele.com.br/cadastrar"
        canonical="https://topgrupostele.com.br/cadastrar"
      />
      
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="max-w-2xl mx-auto">
            {/* Admin Batch Upload - Only for admin users */}
            {isAdmin && (
              <div className="mb-8">
                <BatchUpload currentUser={currentUser} onProcessItem={handleBatchItem} />
              </div>
            )}
            
            {/* Header */}
          <div className="mb-6 sm:mb-8">
            <Button variant="ghost" asChild className="mb-3 sm:mb-4">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Link>
            </Button>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
              Cadastrar Grupo do <span className="text-primary">Telegram</span> Grátis
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Adicione seu grupo do Telegram à maior plataforma do Brasil e alcance milhares de novos membros
            </p>
          </div>

          <Card className="shadow-xl border-border/50">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  {formData.profileImage ? (
                    <img 
                      src={formData.profileImage} 
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
                  )}
                </div>
                <div>
                  <div className="text-base sm:text-lg font-semibold">Informações do Grupo</div>
                  {formData.groupName && (
                    <div className="text-xs sm:text-sm text-muted-foreground font-normal">
                      {formData.groupName}
                    </div>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">{/* Preview do Grupo em Tempo Real */}
                {formData.telegramUrl && (formData.groupName || isLoadingGroupInfo) && (
                  <Card className="p-3 sm:p-4 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 mb-6">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                          {isLoadingGroupInfo ? (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                          ) : formData.profileImage ? (
                            <img 
                              src={formData.profileImage} 
                              alt={formData.groupName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.groupName || "Grupo")}&background=0066cc&color=ffffff&size=800&font-size=0.4&format=png&bold=true`;
                              }}
                            />
                          ) : (
                            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                          )}
                        </div>
                        {!isLoadingGroupInfo && formData.groupName && (
                          <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-success-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1">
                          <h3 className="font-semibold text-base sm:text-lg">
                            {isLoadingGroupInfo ? "Carregando..." : (formData.groupName || "Nome do grupo")}
                          </h3>
                          {!isLoadingGroupInfo && formData.groupName && (
                            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                              Auto
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {isLoadingGroupInfo ? "Buscando informações..." : "Grupo do Telegram"}
                        </p>
                        {formData.description && !isLoadingGroupInfo && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {formData.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                )}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* URL do Telegram */}
                <div className="space-y-2">
                  <Label htmlFor="telegramUrl" className="text-sm font-medium">
                    Endereço do Grupo *
                  </Label>
                  <Input
                    id="telegramUrl"
                    type="url"
                    placeholder="https://t.me/seugrupo"
                    value={formData.telegramUrl}
                    onChange={(e) => handleInputChange("telegramUrl", e.target.value)}
                    className={`bg-muted/50 h-11 sm:h-12 ${urlError ? 'border-red-500 focus:border-red-500' : ''}`}
                    disabled={isBatchProcessing}
                  />
                  {urlError && (
                    <p className="text-xs text-red-500 mt-1">{urlError}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Cole aqui o link do seu grupo do Telegram</span>
                    {isLoadingGroupInfo && (
                      <div className="flex items-center gap-1 sm:gap-2 text-primary">
                        <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
                        <span>Buscando...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botão para tentar buscar foto novamente */}
                {showPhotoRetryButton && (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={retryGroupInfo}
                      disabled={isLoadingGroupInfo}
                      className="flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      {isLoadingGroupInfo ? (
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Já atualizei a foto
                    </Button>
                  </div>
                )}

                {/* Campo Nome do Grupo - sempre visível para edição */}
                {formData.telegramUrl && (
                  <div className="space-y-2">
                    <Label htmlFor="groupName" className="text-sm font-medium">
                      Nome do Grupo {!formData.groupName && "*"}
                    </Label>
                    <Input
                      id="groupName"
                      type="text"
                      placeholder="Digite o nome do seu grupo"
                      value={formData.groupName}
                      onChange={(e) => {
                        const name = e.target.value;
                        handleInputChange("groupName", name);
                        // Atualizar foto quando nome for alterado manualmente
                        if (name.trim()) {
                          setFormData(prev => ({
                            ...prev,
                            profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0066cc&color=ffffff&size=800&font-size=0.4&format=png&bold=true`
                          }));
                        }
                      }}
                      className="bg-muted/50 h-11 sm:h-12"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.groupName ? 
                        "Você pode editar o nome detectado automaticamente" : 
                        "Insira o nome real do seu grupo do Telegram"
                      }
                    </p>
                  </div>
                )}

                {/* Categoria */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Categoria *
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="bg-muted/50 h-12 text-base">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[60vh] overflow-y-auto">
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id} className="text-base py-3">
                          <div className="flex items-center gap-3 w-full">
                            <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${category.color} flex items-center justify-center flex-shrink-0`}>
                              <CategoryIcon iconData={category.icon} size={14} color="white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{category.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{category.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Descrição sobre o grupo *
                  </Label>
                   <Textarea
                     id="description"
                     placeholder="Descreva o que seu grupo oferece, regras, objetivo, etc..."
                     value={formData.description}
                     onChange={(e) => handleInputChange("description", e.target.value)}
                     className="bg-muted/50 min-h-[100px] sm:min-h-[120px] resize-none"
                     maxLength={1000}
                   />
                   <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-0 text-xs text-muted-foreground">
                     <span>Mínimo 100 caracteres</span>
                     <span className={formData.description.length < 100 ? "text-amber-600" : "text-green-600"}>
                       {formData.description.length}/1000 caracteres
                     </span>
                   </div>
                </div>

                {/* Aviso sobre responsabilidade das regras */}
                <div className="p-3 sm:p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                    <strong>📝 Importante:</strong> As regras internas do seu grupo são de total responsabilidade do administrador do grupo. Nossa plataforma não gerencia nem interfere nas regras particulares de cada comunidade.
                  </p>
                </div>


                {/* Submit Button */}
                <Button 
                  type="submit" 
                  variant="hero" 
                  size="lg" 
                  className="w-full h-11 sm:h-12"
                  disabled={isLoading || formData.description.length < 100 || isBatchProcessing}
                >
                  {isLoading || isBatchProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                      {isBatchProcessing ? "Processando Lote..." : "Cadastrando..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Cadastrar Grupo
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CadastrarGrupo;