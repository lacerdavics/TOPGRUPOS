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
import { ArrowLeft, Search, Filter, Plus, TrendingUp, Star, Shield, X } from "lucide-react";
import CategoryIcon from "@/components/CategoryIcon";
import { decodeHtmlEntities } from "@/lib/utils";
import { isGroupImageReal } from "@/utils/groupValidation";
import AgeVerificationGuard from "@/components/AgeVerificationGuard";
import SEOHead from "@/components/SEOHead";
import AdSpace from "@/components/AdSpace";

const Categoria = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [adminFilter, setAdminFilter] = useState("all");
  const [popularGroups, setPopularGroups] = useState<GroupWithStats[]>([]);
  const [regularGroups, setRegularGroups] = useState<GroupWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { preloadImagesInBackground } = useImagePreloader();
  
  const category = getCategoryById(categoryId || "");

  // Memoize all image URLs for preloading
  const allImageUrls = useMemo(() => {
    const popularImages = popularGroups
      .filter(group => group.imageUrl && isGroupImageReal(group.imageUrl))
      .map(group => group.imageUrl!);
    
    const regularImages = regularGroups
      .filter(group => group.imageUrl && isGroupImageReal(group.imageUrl))
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
      const aHasValidImage = !!(a.imageUrl && isGroupImageReal(a.imageUrl));
      const bHasValidImage = !!(b.imageUrl && isGroupImageReal(b.imageUrl));
      
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
    
    console.log(`📸 CATEGORIA FILTER - Grupos com foto válida: ${filtered.filter(g => !!(g.imageUrl && isGroupImageReal(g.imageUrl))).length}/${filtered.length}`);
    
    
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
      if (width < 640) return 6; // Mobile pequeno: 3 linhas de 2
      if (width < 768) return 8; // Mobile: 4 linhas de 2
      if (width < 1024) return 10; // Tablet: 3 linhas de 3 + 1 linha de 1  
      return 15; // Desktop: 3 linhas de 4 + 1 linha de 3
    }
    return 8;
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

  // SEO data for category page
  const categoryTitle = `Grupos do Telegram de ${category.name} | TopGrupos`;
  const categoryDescription = `Descubra os melhores grupos do Telegram de ${category.name}. ${category.description}. Conecte-se com comunidades ativas e verificadas.`;
  const categoryKeywords = `grupos telegram ${category.name.toLowerCase()}, telegram ${category.name.toLowerCase()}, grupos ${category.name.toLowerCase()}, comunidades ${category.name.toLowerCase()}, telegram brasil`;
  const categoryUrl = `https://topgrupostele.com.br/categoria/${category.id}`;

  // Structured data for category page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Grupos do Telegram - ${category.name}`,
    "description": categoryDescription,
    "url": categoryUrl,
    "mainEntity": {
      "@type": "ItemList",
      "name": `Grupos de ${category.name}`,
      "numberOfItems": totalFilteredGroups,
      "itemListElement": [...filteredPopularGroups, ...filteredRegularGroups.slice(0, 10)].map((group, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "SocialMediaPosting",
          "name": group.name,
          "description": group.description,
          "url": `https://topgrupostele.com.br/grupo/${group.id}`,
          "author": {
            "@type": "Organization",
            "name": "TopGrupos"
          }
        }
      }))
    }
  };
  return (
    <AgeVerificationGuard categoryId={categoryId}>
      <div className="min-h-screen bg-background">
      <SEOHead
        title={categoryTitle}
        description={categoryDescription}
        keywords={categoryKeywords}
        url={categoryUrl}
        canonical={categoryUrl}
        structuredData={structuredData}
      />
      
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 lg:py-12">
        {/* Header da Categoria */}
        <section className="mb-6 sm:mb-8">
          <Button 
            variant="ghost" 
            asChild 
            className="mb-3 sm:mb-4 hover:bg-muted/50 transition-colors duration-200 px-2 sm:px-3"
            size="sm"
          >
            <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground text-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}>
              <CategoryIcon iconData={category.icon} size={20} className="sm:w-6 sm:h-6" color="white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground font-heading">
                Grupos do Telegram de {category.name}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {category.description} • {totalFilteredGroups} grupos ativos
              </p>
            </div>
          </div>
        </section>

        {/* Filtros e Busca */}
        <section className="mb-6 sm:mb-8">
          <div className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
                <Input
                  type="text"
                  placeholder="Buscar grupos..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleFilterChange();
                  }}
                  className="pl-9 sm:pl-12 h-10 sm:h-12 bg-background/50 border-border/50 rounded-lg sm:rounded-xl font-inter placeholder:text-muted-foreground/70 focus:bg-background focus:border-primary/50 transition-all duration-300 text-sm sm:text-base"
                  aria-label="Buscar grupos"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      handleFilterChange();
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Filtro de ordenação (mobile: botão para abrir drawer) */}
                <div className="block sm:hidden">
                  <Button
                    variant="outline"
                    onClick={() => setIsFiltersOpen(true)}
                    className="w-full h-10 justify-start gap-2 rounded-lg"
                  >
                    <Filter className="w-4 h-4" />
                    Ordenar
                  </Button>
                </div>

                {/* Filtro de ordenação (desktop) */}
                <div className="hidden sm:block flex-1">
                  <Select value={sortBy} onValueChange={(value) => { setSortBy(value); handleFilterChange(); }}>
                    <SelectTrigger className="h-10 sm:h-12 rounded-lg sm:rounded-xl text-sm sm:text-base">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Mais recentes</SelectItem>
                      <SelectItem value="popular">Mais populares</SelectItem>
                      <SelectItem value="name">Ordem alfabética</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Add Group Button */}
                <Button 
                  variant="hero" 
                  asChild 
                  className="h-10 sm:h-12 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                >
                  <Link to="/cadastrar">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    Cadastrar
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Drawer de filtros para mobile */}
        {isFiltersOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 sm:hidden" onClick={() => setIsFiltersOpen(false)}>
            <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-bold text-lg">Filtrar e ordenar</h3>
                <button onClick={() => setIsFiltersOpen(false)}>
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Ordenar por</h4>
                  <div className="space-y-2">
                    <button 
                      className={`w-full text-left p-3 rounded-lg ${sortBy === 'recent' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                      onClick={() => { setSortBy('recent'); setIsFiltersOpen(false); handleFilterChange(); }}
                    >
                      Mais recentes
                    </button>
                    <button 
                      className={`w-full text-left p-3 rounded-lg ${sortBy === 'popular' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                      onClick={() => { setSortBy('popular'); setIsFiltersOpen(false); handleFilterChange(); }}
                    >
                      Mais populares
                    </button>
                    <button 
                      className={`w-full text-left p-3 rounded-lg ${sortBy === 'name' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                      onClick={() => { setSortBy('name'); setIsFiltersOpen(false); handleFilterChange(); }}
                    >
                      Ordem alfabética
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Espaço Publicitário */}
        <AdSpace />

        {/* Lista de Grupos */}
        <section className="mb-8 sm:mb-12">
          {loading ? (
            <GroupSkeleton count={8} />
          ) : totalFilteredGroups > 0 ? (
            <>
              {/* Seção Mais Populares */}
              {filteredPopularGroups.length > 0 && (
                <div className="mb-10 sm:mb-16">
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground font-heading">
                        Mais Populares
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Os grupos aprovados com maior engajamento
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                    {filteredPopularGroups.map((group, index) => (
                      <div 
                        key={group.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <GroupCard 
                          group={group}
                          onGroupUpdate={handleGroupUpdate}
                          compact={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seção Outros Grupos */}
              {filteredRegularGroups.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground font-heading">
                        Outros Grupos
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {filteredRegularGroups.length} grupos aprovados • Página {pagination.currentPage} de {pagination.totalPages}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                    {pagination.paginatedItems.map((group, index) => (
                      <div 
                        key={group.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <GroupCard 
                          group={group}
                          onGroupUpdate={handleGroupUpdate}
                          compact={true}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {pagination.totalPages > 1 && (
                    <div className="mt-8 sm:mt-12">
                      <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={pagination.goToPage}
                        hasNextPage={pagination.hasNextPage}
                        hasPreviousPage={pagination.hasPreviousPage}
                        compact={true}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 sm:py-20">
              <div className="max-w-md mx-auto px-4">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                  <CategoryIcon iconData={category.icon} size={24} className="sm:w-10 sm:h-10" color="hsl(var(--muted-foreground))" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3 font-heading">
                  Nenhum grupo encontrado
                </h3>
                <p className="text-muted-foreground mb-6 sm:mb-8 font-inter leading-relaxed text-sm sm:text-base">
                  {searchTerm 
                    ? `Não encontramos grupos com "${searchTerm}". Tente ajustar sua busca.`
                    : "Ainda não há grupos aprovados nesta categoria. Que tal ser o primeiro?"
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Button 
                    variant="hero" 
                    asChild 
                    className="h-10 sm:h-12 px-4 sm:px-8 rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    <Link to="/cadastrar">
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                      Cadastrar Grupo
                    </Link>
                  </Button>
                  {searchTerm && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm("");
                        handleFilterChange();
                      }}
                      className="h-10 sm:h-12 px-4 sm:px-6 rounded-lg sm:rounded-xl text-sm sm:text-base"
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
    </AgeVerificationGuard>
  );
};

export default Categoria;