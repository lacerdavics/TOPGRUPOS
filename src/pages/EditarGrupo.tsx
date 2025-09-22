import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { categories } from "@/data/categories";
import { telegramBatchService } from "@/services/telegramBatchService";
import { imageUploadService } from "@/services/imageUploadService";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, RefreshCw, Trash2, Save, AlertTriangle } from "lucide-react";
import { decodeHtmlEntities } from "@/lib/utils";
import Footer from "@/components/Footer";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import IntelligentGroupImage from "@/components/IntelligentGroupImage";

interface GroupData {
  id: string;
  name: string;
  description: string;
  category: string;
  telegramUrl: string;
  profileImage?: string;
  userId?: string;
  userEmail?: string;
  approved: boolean;
  suspended: boolean;
  createdAt: any;
}

const EditarGrupo = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [group, setGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    profileImage: ""
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    if (groupId) {
      loadGroup();
    }
  }, [groupId, currentUser, navigate]);

  const loadGroup = async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      const groupRef = doc(db, "groups", groupId);
      const groupSnap = await getDoc(groupRef);

      if (!groupSnap.exists()) {
        toast.error("Grupo não encontrado", {
          description: "O grupo que você está tentando editar não existe."
        });
        navigate('/meus-grupos');
        return;
      }

      const groupData = { id: groupSnap.id, ...groupSnap.data() } as GroupData;
      
      // Check if user can edit this group
      const userCanEdit = groupData.userId === currentUser?.uid || 
                          groupData.userEmail === currentUser?.email ||
                          currentUser?.email === 'victorlacerdaprods@gmail.com'; // Admin check

      if (!userCanEdit) {
        toast.error("Acesso negado", {
          description: "Você só pode editar grupos que você mesmo cadastrou."
        });
        navigate('/meus-grupos');
        return;
      }

      setGroup(groupData);
      setCanEdit(userCanEdit);
      setFormData({
        name: groupData.name,
        description: groupData.description,
        category: groupData.category,
        profileImage: groupData.profileImage || ""
      });

    } catch (error) {
      console.error("Erro ao carregar grupo:", error);
      toast.error("Erro ao carregar grupo", {
        description: "Não foi possível carregar os dados do grupo."
      });
      navigate('/meus-grupos');
    } finally {
      setLoading(false);
    }
  };

  const updateFromTelegram = async () => {
    if (!group) return;

    setUpdating(true);
    
    try {
      toast.info("🔄 Atualizando dados...", {
        description: "Buscando informações atualizadas do Telegram"
      });

      // Get fresh data from Telegram
      const groupInfo = await telegramBatchService.forceRefreshGroupInfo(group.telegramUrl);
      
      if (groupInfo.error) {
        throw new Error(groupInfo.error);
      }

      const title = telegramBatchService.getTitle(groupInfo, group.telegramUrl);
      const description = telegramBatchService.getDescription(groupInfo);
      const imageUrl = telegramBatchService.getImageUrl(groupInfo, title);

      if (!title || title === "Telegram" || title.includes("Telegram: Contact")) {
        throw new Error("Não foi possível obter dados atualizados do grupo");
      }

      // Process image if it's an external URL
      let finalImageUrl = imageUrl;
      if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        const uploadResult = await imageUploadService.downloadAndUploadImage(imageUrl, group.id);
        if (uploadResult.success && uploadResult.url) {
          finalImageUrl = uploadResult.url;
        }
      }

      // Update form data
      const updatedData = {
        name: decodeHtmlEntities(title),
        description: description !== 'Descrição não disponível' ? decodeHtmlEntities(description) : formData.description,
        category: formData.category, // Keep current category
        profileImage: finalImageUrl
      };

      setFormData(updatedData);

      toast.success("✅ Dados atualizados!", {
        description: "As informações do grupo foram atualizadas com sucesso."
      });

    } catch (error) {
      console.error("Erro ao atualizar dados do Telegram:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast.error("❌ Erro ao atualizar", {
        description: errorMessage
      });
    } finally {
      setUpdating(false);
    }
  };

  const saveChanges = async () => {
    if (!group || !groupId) return;

    if (!formData.name.trim() || !formData.description.trim() || !formData.category) {
      toast.error("Campos obrigatórios", {
        description: "Por favor, preencha todos os campos obrigatórios."
      });
      return;
    }

    if (formData.description.length < 100) {
      toast.error("Descrição muito curta", {
        description: "A descrição deve ter pelo menos 100 caracteres."
      });
      return;
    }

    setSaving(true);

    try {
      const groupRef = doc(db, "groups", groupId);
      await updateDoc(groupRef, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        profileImage: formData.profileImage,
        updatedAt: new Date()
      });

      toast.success("✅ Grupo atualizado!", {
        description: "As alterações foram salvas com sucesso."
      });

      // Update local state
      setGroup(prev => prev ? {
        ...prev,
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        profileImage: formData.profileImage
      } : null);

    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
      toast.error("Erro ao salvar", {
        description: "Não foi possível salvar as alterações. Tente novamente."
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async () => {
    if (!group || !groupId) return;

    setDeleting(true);

    try {
      const groupRef = doc(db, "groups", groupId);
      await deleteDoc(groupRef);

      toast.success("✅ Grupo apagado!", {
        description: "O grupo foi removido permanentemente da plataforma."
      });

      navigate('/meus-grupos');

    } catch (error) {
      console.error("Erro ao apagar grupo:", error);
      toast.error("Erro ao apagar grupo", {
        description: "Não foi possível apagar o grupo. Tente novamente."
      });
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados do grupo...</p>
        </div>
      </div>
    );
  }

  if (!group || !canEdit) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
            <p className="text-muted-foreground mb-6">
              Você não tem permissão para editar este grupo.
            </p>
            <Button onClick={() => navigate('/meus-grupos')}>
              Voltar aos Meus Grupos
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate('/meus-grupos')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar aos Meus Grupos
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">
              Editar <span className="text-primary">Grupo</span>
            </h1>
            <p className="text-muted-foreground">
              Edite as informações do seu grupo ou atualize com dados do Telegram
            </p>
          </div>

          <Card className="shadow-lg border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center overflow-hidden">
                  {formData.groupName ? (
                    <IntelligentGroupImage
                      telegramUrl={group?.telegramUrl}
                      fallbackImageUrl={formData.profileImage}
                      groupName={formData.groupName}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      priority={true}
                      groupId={group?.id}
                    />
                  ) : (
                    <span className="text-primary-foreground font-bold">
                      {formData.groupName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-lg font-semibold">Editando Grupo</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    {group?.name}
                  </div>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Update from Telegram Button */}
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Atualizar dados do Telegram
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                  Clique aqui se modificou a foto, o nome ou a descrição do seu grupo no Telegram, 
                  e você queira atualizar aqui no site.
                </p>
                <Button 
                  onClick={updateFromTelegram}
                  disabled={updating}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {updating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Atualizando do Telegram...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Atualizar dados do Telegram
                    </>
                  )}
                </Button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Grupo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Nome do grupo"
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Descrição do grupo"
                    className="bg-muted/50 min-h-[120px] resize-none"
                    maxLength={1000}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Mínimo 100 caracteres</span>
                    <span className={formData.description.length < 100 ? "text-amber-600" : "text-green-600"}>
                      {formData.description.length}/1000 caracteres
                    </span>
                  </div>
                </div>

                {/* Telegram URL (read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="telegramUrl">Link do Telegram (não editável)</Label>
                  <Input
                    id="telegramUrl"
                    value={group.telegramUrl}
                    readOnly
                    className="bg-muted/30 text-muted-foreground"
                  />
                  <p className="text-xs text-muted-foreground">
                    O link do Telegram não pode ser alterado. Para mudar o link, você precisa cadastrar um novo grupo.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <Button
                  onClick={saveChanges}
                  disabled={saving || formData.description.length < 100}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  className="flex-1 sm:flex-initial"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Apagar Grupo
                </Button>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                      Importante:
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                      Alterações feitas aqui não modificam seu grupo no Telegram. 
                      Este formulário apenas atualiza as informações exibidas em nossa plataforma.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={deleteGroup}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja apagar permanentemente o grupo "${group?.name}"? Esta ação não pode ser desfeita e o grupo será removido da plataforma.`}
        confirmText="Apagar Grupo"
        cancelText="Cancelar"
        isLoading={deleting}
      />


      <Footer />
    </div>
  );
};

export default EditarGrupo;