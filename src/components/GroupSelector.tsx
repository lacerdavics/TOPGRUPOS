import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Group } from "@/components/GroupCard";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface GroupSelectorProps {
  onGroupSelect: (group: Group) => void;
  onBack: () => void;
  selectedPlanId?: string;
}

const GroupSelector = ({ onGroupSelect, onBack }: GroupSelectorProps) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const groupsPerPage = 2;

  useEffect(() => {
    fetchUserGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, currentUser?.email]);

  useEffect(() => {
    filterGroups();
  }, [groups, searchTerm]);

  const fetchUserGroups = async () => {
    if (!currentUser?.uid && !currentUser?.email) {
      setLoading(false);
      toast({
        title: "Faça login",
        description: "Você precisa estar logado para ver seus grupos.",
      });
      return;
    }

    try {
      setLoading(true);
      const groupsRef = collection(db, "groups");

      const qByUserId = currentUser?.uid
        ? query(groupsRef, where("userId", "==", currentUser.uid), where("approved", "==", true))
        : null;

      const qByEmail = currentUser?.email
        ? query(groupsRef, where("userEmail", "==", currentUser.email), where("approved", "==", true))
        : null;

      const [snapUid, snapEmail] = await Promise.all([
        qByUserId ? getDocs(qByUserId) : Promise.resolve(null),
        qByEmail ? getDocs(qByEmail) : Promise.resolve(null),
      ]);

      const mapDocToGroup = (doc: any): Group => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          description: data.description || "",
          category: data.category || "",
          telegramUrl: data.telegramUrl,
          profileImage: data.profileImage,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          membersCount: data.membersCount || 0,
        } as Group;
      };

      const listUid = snapUid ? snapUid.docs.filter(d => !d.data().suspended).map(mapDocToGroup) : [];
      const listEmail = snapEmail ? snapEmail.docs.filter(d => !d.data().suspended).map(mapDocToGroup) : [];

      const merged: Record<string, Group> = [...listUid, ...listEmail].reduce((acc, g) => {
        acc[g.id] = g;
        return acc;
      }, {} as Record<string, Group>);

      const userGroups: Group[] = Object.values(merged).sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));

      setGroups(userGroups);

      if (userGroups.length === 0) {
        toast({
          title: "Nenhum grupo encontrado",
          description: "Você ainda não cadastrou nenhum grupo aprovado.",
        });
      }
    } catch (error) {
      console.error("Erro ao buscar grupos do usuário:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar seus grupos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterGroups = () => {
    if (!searchTerm.trim()) {
      setFilteredGroups(groups);
      setCurrentPage(1);
      return;
    }

    const filtered = groups.filter(group => 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredGroups(filtered);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredGroups.length / groupsPerPage);
  const startIndex = (currentPage - 1) * groupsPerPage;
  const currentGroups = filteredGroups.slice(startIndex, startIndex + groupsPerPage);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleGroupSelect = (group: Group) => onGroupSelect(group);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Entre para continuar</h3>
        <p className="text-muted-foreground mb-4">Você precisa estar logado para prosseguir.</p>
        <Link to="/auth">
          <Button size="lg">Fazer login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Escolha onde quer aplicar a promoção
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Clique em "Selecionar" para continuar
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Groups Grid */}
      {currentGroups.length > 0 ? (
        <div className="space-y-3 sm:space-y-4 mb-8">
          {currentGroups.map((group) => (
            <Card 
              key={group.id} 
              className="p-4 sm:p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleGroupSelect(group)}
            >
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-muted mx-auto sm:mx-0">
                  {group.profileImage ? (
                    <img 
                      src={group.profileImage} 
                      alt={group.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-1 sm:gap-0">
                    <h3 className="font-semibold text-base sm:text-lg truncate sm:pr-2">{group.name}</h3>
                    <Badge variant="secondary" className="flex-shrink-0 mx-auto sm:mx-0">
                      {group.category}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                    {group.description}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                      {group.membersCount || 0} membros
                    </div>
                    <div className="hidden sm:block">
                      Criado em {group.createdAt.toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>

                <Button 
                  size="sm"
                  className="flex-shrink-0 w-full sm:w-auto mt-3 sm:mt-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGroupSelect(group);
                  }}
                >
                  Selecionar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? "Nenhum encontrado" : "Nada para exibir"}
          </h3>
          <p className="text-muted-foreground">
            {searchTerm 
              ? "Tente pesquisar com outros termos." 
              : "Você ainda não possui itens aprovados para promover."
            }
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="px-2 sm:px-4 py-2 text-xs sm:text-sm">
            Página {currentPage} de {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default GroupSelector;
