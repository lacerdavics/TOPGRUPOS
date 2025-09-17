import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Footer from "@/components/Footer";
import UserGroupsStats from "@/components/UserGroupsStats";
import UserGroupsGrid from "@/components/UserGroupsGrid";

interface Group {
  id: string;
  name: string;
  description: string;
  link: string;
  category: string;
  createdAt: any;
  userId: string;
  imageUrl?: string;
  telegramUrl?: string;
  profileImage?: string; // Campo principal do Firestore onde a imagem é armazenada
}

const MeusGrupos = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalGroups, setTotalGroups] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  
  const GROUPS_PER_PAGE = 12;

  useEffect(() => {
    console.log("🔐 Estado da autenticação:", { 
      hasUser: !!currentUser, 
      uid: currentUser?.uid,
      email: currentUser?.email 
    });
    
    if (!currentUser) {
      navigate('/auth?redirect=/meus-grupos');
      return;
    }

    fetchUserGroups(1);
  }, [currentUser, navigate]);

  const fetchUserGroups = async (page: number, resetData: boolean = true) => {
    try {
      setLoading(true);
      console.log("🔍 Buscando grupos para usuário:", currentUser?.uid, "página:", page);
      
      if (!currentUser) return;

      // Calcular offset para paginação
      const offset = (page - 1) * GROUPS_PER_PAGE;
      
      // Buscar todos os grupos do usuário para paginação simples
      const allGroupsQuery = query(
        collection(db, "groups"),
        where("userId", "==", currentUser.uid),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(allGroupsQuery);
      console.log("📊 Total de documentos encontrados:", snapshot.size);
      
      // Aplicar paginação no lado cliente com mapeamento correto de imagens
      const allGroups = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        console.log(`🔍 Mapeando grupo ${doc.id}:`, {
          name: data.name,
          profileImage: data.profileImage,
          imageUrl: data.imageUrl,
          telegramUrl: data.telegramUrl
        });
        return {
          id: doc.id,
          ...data,
          imageUrl: data.profileImage || data.imageUrl, // Garante que imageUrl receba profileImage
          profileImage: data.profileImage, // Mantém profileImage explicitamente
          telegramUrl: data.telegramUrl || data.link // Garante que telegramUrl esteja disponível
        } as Group;
      });
      
      const paginatedGroups = allGroups.slice(offset, offset + GROUPS_PER_PAGE);
      const hasMore = offset + GROUPS_PER_PAGE < allGroups.length;
      
      console.log(`✅ Grupos mapeados para página ${page}:`, paginatedGroups.map(g => ({
        id: g.id,
        name: g.name,
        hasImageUrl: !!g.imageUrl,
        hasProfileImage: !!g.profileImage,
        hasTelegramUrl: !!g.telegramUrl
      })));
      
      setGroups(paginatedGroups);
      setCurrentPage(page);
      setHasNextPage(hasMore);
      setTotalGroups(allGroups.length);
      
      console.log("✅ Grupos carregados para página", page, ":", paginatedGroups.length);
    } catch (error) {
      console.error("❌ Erro ao carregar grupos do usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      fetchUserGroups(currentPage + 1, false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchUserGroups(currentPage - 1, false);
    }
  };

  const handlePromoteGroup = (groupId: string) => {
    // TODO: Implement promote functionality
    console.log('Promover grupo:', groupId);
  };

  const handleEditGroup = (groupId: string) => {
    navigate(`/editar-grupo/${groupId}`);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Meus <span className="text-primary">Grupos</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Gerencie todos os grupos que você cadastrou na plataforma
          </p>
        </div>

        {/* Stats Cards */}
        <UserGroupsStats groups={groups} totalGroups={totalGroups} />

        {/* Action Button */}
        <div className="flex justify-center mb-8">
          <Button 
            onClick={() => navigate('/cadastrar')}
            className="gap-2 px-6 py-3 text-base h-auto"
          >
            <Plus className="w-5 h-5" />
            Cadastrar Novo Grupo
          </Button>
        </div>

        {/* Groups Grid */}
        <div className="mb-12">
          <UserGroupsGrid
            groups={groups}
            loading={loading}
            onPromote={handlePromoteGroup}
            onEdit={handleEditGroup}
          />
        </div>

        {/* Pagination Controls */}
        {totalGroups > GROUPS_PER_PAGE && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 px-4">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Página {currentPage} - Mostrando {groups.length} de {totalGroups} grupos
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasNextPage}
                className="gap-2"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MeusGrupos;