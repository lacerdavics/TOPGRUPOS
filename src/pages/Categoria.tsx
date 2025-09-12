import { useState, useMemo, useEffect } from "react";
import GroupSkeleton from "@/components/GroupSkeleton";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GroupCard from "@/components/GroupCard";
import { GroupWithStats } from "@/services/enhancedGroupService";
import { Pagination } from "@/components/Pagination";
import { getCategoryById } from "@/data/categories";
import { getCategoryGroupsWithSections } from "@/services/enhancedGroupService";
import { usePagination } from "@/hooks/usePagination";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { ArrowLeft, Search, Filter, Plus, TrendingUp, Star, Shield } from "lucide-react";
import CategoryIcon from "@/components/CategoryIcon";
import { decodeHtmlEntities } from "@/lib/utils";

const Categoria = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [adminFilter, setAdminFilter] = useState("all"); // all, active, suspended
  const [popularGroups, setPopularGroups] = useState<GroupWithStats[]>([]);
  const [regularGroups, setRegularGroups] = useState<GroupWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { preloadImagesInBackground } = useImagePreloader();
  
  const category = getCategoryById(categoryId || "");

  // Memoize all image URLs for preloading
  const allImageUrls = useMemo(() => {
    const popularImages = popularGroups
      .filter(group => group.imageUrl && !group.imageUrl.includes('telesco.pe'))
      .map(group => group.imageUrl!);
    
    const regularImages = regularGroups
      .filter(group => group.imageUrl && !group.imageUrl.includes('telesco.pe'))
      .map(group => group.imageUrl!);
    
    return [...popularImages, ...regularImages];
  }, [popularGroups, regularGroups]);

  const loadGroups = async () => {
    if (!categoryId) return;
    
    console.log(`🔍 Categoria.tsx - Carregando grupos para categoria: "${categoryId}"`);
    setLoading(true);
    
    const startTime = performance.now();
    
    try {
      const { popularGroups: popular, regularGroups: regular } = await getCategoryGroupsWithSections(categoryId);
      const loadTime = performance.now() - startTime;
      console.log(`✅ Categoria.tsx - ${popular.length + regular.length} grupos carregados em ${loadTime.toFixed(2)}ms`);
      setPopularGroups(popular);
      setRegularGroups(regular);
    } catch (error) {
      console.error("❌ Categoria.tsx - Erro ao carregar grupos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load groups from Firebase
  useEffect(() => {
    loadGroups();
  }, [categoryId]);

  // Preload images after groups load
  useEffect(() => {
    if (allImageUrls.length > 0) {
      preloadImagesInBackground(allImageUrls);
    }
  }, [allImageUrls, preloadImagesInBackground]);
  
  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Categoria não encontrada</h1>
            <Button asChild>
              <Link to="/">Voltar para Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar grupos por categoria, termo de busca e status administrativo
  const filteredRegularGroups = useMemo(() => {
    console.log('🔍 Filtrando grupos regulares. Total:', regularGroups.length);
    let filtered = [...regularGroups];
    
    if (searchTerm) {
      filtered = filtered.filter(group => {
        const decodedName = decodeHtmlEntities(group.name);
        const decodedDescription = decodeHtmlEntities(group.description);
        return decodedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               decodedDescription.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    // Ordenação com priorização de grupos com fotos válidas (não do telesco.pe)
    filtered.sort((a, b) => {
      // Check for valid image URLs (not from telesco.pe which are failing)
      const aHasValidImage = !!(a.imageUrl && !a.imageUrl.includes('telesco.pe') && !a.imageUrl.includes('cdn1.telesco.pe'));
      const bHasValidImage = !!(b.imageUrl && !b.imageUrl.includes('telesco.pe') && !b.imageUrl.includes('cdn1.telesco.pe'));
      
      // Priority 1: Groups with valid images come first
      if (aHasValidImage && !bHasValidImage) return -1;
      if (bHasValidImage && !aHasValidImage) return 1;
      
      // Priority 2: If both have same image status, apply selected sorting
      if (sortBy === "recent") {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else if (sortBy === "popular") {
        return (b.viewCount || 0) - (a.viewCount || 0);
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
    
    console.log(`📸 CATEGORIA FILTER - Grupos com foto válida: ${filtered.filter(g => !!(g.imageUrl && !g.imageUrl.includes('telesco.pe'))).length}/${filtered.length}`);
    
    
    return filtered;
  }, [regularGroups, searchTerm, sortBy]);

  // Filtered popular groups
  const filteredPopularGroups = useMemo(() => {
    console.log('🌟 Filtrando grupos populares. Total:', popularGroups.length);
    let filtered = [...popularGroups];
    
    if (searchTerm) {
      filtered = filtered.filter(group => {
        const decodedName = decodeHtmlEntities(group.name);
        const decodedDescription = decodeHtmlEntities(group.description);
        return decodedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               decodedDescription.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }
    
    return filtered;
  }, [popularGroups, searchTerm]);

  // Total filtered groups for stats
  const totalFilteredGroups = filteredPopularGroups.length + filteredRegularGroups.length;

  // Paginação responsiva apenas para grupos regulares
  const getItemsPerPage = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) return 9; // Mobile: 4 linhas de 2 + 1 linha de 1
      if (width < 1024) return 10; // Tablet: 3 linhas de 3 + 1 linha de 1  
      return 15; // Desktop: 3 linhas de 4 + 1 linha de 3
    }
    return 9;
  };

  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage());
  const pagination = usePagination(filteredRegularGroups, { itemsPerPage });

  // Atualizar itemsPerPage quando a tela redimensionar e resetar paginação
  useEffect(() => {
    const handleResize = () => {
      const newItemsPerPage = getItemsPerPage();
      if (newItemsPerPage !== itemsPerPage) {
        setItemsPerPage(newItemsPerPage);
        // A paginação será resetada automaticamente pelo hook
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerPage]);

  // Reset pagination when filters change
  const handleFilterChange = () => {
    pagination.resetPage();
  };

  // Handle group updates (when admin suspends/deletes groups)
  const handleGroupUpdate = () => {
    loadGroups(); // Reload groups to reflect changes
  };

  

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-8 lg:py-12">
        {/* Header da Categoria */}
        <section className="mb-8">
          <Button 
            variant="ghost" 
            asChild 
            className="mb-4 hover:bg-muted/50 transition-colors duration-200"
          >
            <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para início
            </Link>
          </Button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}>
              <CategoryIcon iconData={category.icon} size={24} color="white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-heading">
                {category.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {category.description}
              </p>
            </div>
          </div>
        </section>

        {/* Filtros e Busca */}
        <section className="mb-8">
          <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar grupos por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleFilterChange();
                  }}
                  className="pl-12 h-12 bg-background/50 border-border/50 rounded-xl font-inter placeholder:text-muted-foreground/70 focus:bg-background focus:border-primary/50 transition-all duration-300"
                  aria-label="Buscar grupos"
                />
              </div>


              {/* Add Group Button */}
              <Button 
                variant="hero" 
                asChild 
                className="h-12 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Link to="/cadastrar">
                  <Plus className="w-5 h-5 mr-2" />
                  Cadastrar Grupo
                </Link>
              </Button>
            </div>
          </div>
        </section>


        {/* Lista de Grupos */}
        <section className="mb-12">
          {loading ? (
            <GroupSkeleton count={8} />
          ) : totalFilteredGroups > 0 ? (
            <>
              {/* Seção Mais Populares */}
              {filteredPopularGroups.length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground font-heading">
                        Mais Populares
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Os grupos com maior engajamento da categoria
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    {filteredPopularGroups.map((group, index) => (
                      <div 
                        key={group.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <GroupCard 
                          group={group}
                          onGroupUpdate={handleGroupUpdate}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seção Outros Grupos */}
              {filteredRegularGroups.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                      <Star className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground font-heading">
                        Outros Grupos
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {filteredRegularGroups.length} grupos • Página {pagination.currentPage} de {pagination.totalPages}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                    {pagination.paginatedItems.map((group, index) => (
                      <div 
                        key={group.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <GroupCard 
                          group={group}
                          onGroupUpdate={handleGroupUpdate}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {pagination.totalPages > 1 && (
                    <div className="mt-12">
                      <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={pagination.goToPage}
                        hasNextPage={pagination.hasNextPage}
                        hasPreviousPage={pagination.hasPreviousPage}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CategoryIcon iconData={category.icon} size={40} color="hsl(var(--muted-foreground))" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3 font-heading">
                  Nenhum grupo encontrado
                </h3>
                <p className="text-muted-foreground mb-8 font-inter leading-relaxed">
                  {searchTerm 
                    ? `Não encontramos grupos com o termo "${searchTerm}" nesta categoria. Tente ajustar sua busca ou explore outras categorias.`
                    : "Ainda não há grupos cadastrados nesta categoria. Que tal ser o primeiro a criar um grupo aqui?"
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="hero" 
                    asChild 
                    className="h-12 px-8 rounded-xl font-semibold shadow-lg hover:shadow-xl"
                  >
                    <Link to="/cadastrar">
                      <Plus className="w-5 h-5 mr-2" />
                      Cadastrar Primeiro Grupo
                    </Link>
                  </Button>
                  {searchTerm && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm("");
                        handleFilterChange();
                      }}
                      className="h-12 px-6 rounded-xl"
                    >
                      Limpar Busca
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      
    </div>
  );
};

export default Categoria;