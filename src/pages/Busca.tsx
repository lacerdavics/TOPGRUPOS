import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GroupCard, { Group } from "@/components/GroupCard";

import { Pagination } from "@/components/Pagination";
import { categories } from "@/data/categories";
import { searchGroups } from "@/services/groupService";
import { usePagination } from "@/hooks/usePagination";
import { ArrowLeft, Search, Filter, Plus } from "lucide-react";
import { decodeHtmlEntities } from "@/lib/utils";
import SEOHead from "@/components/SEOHead";

const Busca = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGroupClick = (group: Group) => {
    // Store group data in localStorage for the page
    localStorage.setItem(`group_${group.id}`, JSON.stringify(group));
    
    // Navigate to group details page
    navigate(`/grupo/${group.id}`);
  };

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  // Load groups when search term or category changes
  useEffect(() => {
    handleSearch();
  }, [searchTerm, selectedCategory]);

  // Filtrar e ordenar grupos
  const filteredGroups = useMemo(() => {
    let filtered = [...groups];
    
    // Ordenação
    filtered.sort((a, b) => {
      if (sortBy === "recent") {
        return b.createdAt.getTime() - a.createdAt.getTime();
      } else if (sortBy === "popular") {
        return (b.membersCount || 0) - (a.membersCount || 0);
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
    
    return filtered;
  }, [groups, sortBy]);

  // Paginação responsiva
  const getItemsPerPage = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) return 8; // Mobile: 4 linhas de 2
      if (width < 1024) return 9; // Tablet: 3 linhas de 3
      return 12; // Desktop: 3 linhas de 4
    }
    return 8;
  };

  const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage());
  const pagination = usePagination(filteredGroups, { itemsPerPage });

  // Atualizar itemsPerPage quando a tela redimensionar
  useEffect(() => {
    const handleResize = () => {
      const newItemsPerPage = getItemsPerPage();
      if (newItemsPerPage !== itemsPerPage) {
        setItemsPerPage(newItemsPerPage);
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [itemsPerPage]);

  // Reset pagination when filters change
  const handleFilterChange = () => {
    pagination.resetPage();
  };

  // SEO data for search page
  const searchTitle = searchTerm 
    ? `Busca: "${searchTerm}" | Grupos do Telegram | TopGrupos`
    : "Buscar Grupos do Telegram | TopGrupos";
  const searchDescription = searchTerm
    ? `Resultados da busca por "${searchTerm}" em grupos do Telegram. Encontre comunidades ativas e verificadas.`
    : "Busque grupos do Telegram por categoria, nome ou interesse. Mais de 500 grupos ativos organizados e verificados.";
  const searchUrl = `https://topgrupostele.com.br/busca${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ''}`;
  const handleSearch = async () => {
    setLoading(true);
    try {
      const groupsData = await searchGroups(searchTerm, selectedCategory);
      setGroups(groupsData);
      handleFilterChange(); // Reset to first page when new search
    } catch (error) {
      console.error("Error searching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    handleFilterChange();
  };

  // Structured data for search page
  const searchStructuredData = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "headline": searchTerm ? `Busca: "${searchTerm}"` : "Buscar Grupos do Telegram",
    "name": searchTerm ? `Resultados para "${searchTerm}"` : "Busca de Grupos",
    "description": searchDescription,
    "url": searchUrl,
    "datePublished": "2024-01-01T00:00:00Z",
    "dateModified": new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "TopGrupos",
      "url": "https://topgrupostele.com.br"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TopGrupos",
      "url": "https://topgrupostele.com.br"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": searchUrl
    },
    "discussionUrl": `${searchUrl}#resultados`,
    "about": {
      "@type": "Thing",
      "name": searchTerm || "Busca de Grupos",
      "description": "Busca por grupos do Telegram"
    },
    "hasPart": filteredGroups.slice(0, 10).map((group, index) => ({
      "@type": "DiscussionForumPosting",
      "headline": group.name,
      "description": group.description,
      "url": `https://topgrupostele.com.br/grupo/${group.id}`,
      "datePublished": group.createdAt?.toISOString() || "2024-01-01T00:00:00Z",
      "author": {
        "@type": "Organization",
        "name": "TopGrupos",
        "url": "https://topgrupostele.com.br"
      },
      "discussionUrl": `https://topgrupostele.com.br/grupo/${group.id}`
    }))
  };

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      <SEOHead
        title={searchTitle}
        description="Busque grupos do Telegram por categoria, nome ou interesse. Milhares de grupos ativos organizados e verificados."
        url={searchUrl}
        canonical={searchUrl}
        noindex={!searchTerm} // Only index search pages with actual search terms
        structuredData={searchStructuredData}
      />
      
      <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button variant="ghost" asChild className="mb-3 sm:mb-4">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Link>
          </Button>
          
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            {searchTerm ? `Busca: "${searchTerm}"` : "Buscar Grupos do Telegram"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {searchTerm ? `${filteredGroups.length} resultados encontrados` : "Encontre grupos do Telegram do seu interesse"}
          </p>
        </div>

        {/* Filtros e Busca */}
        <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          {/* Barra de busca principal */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Busque por nome, descrição ou termos relacionados..."
              value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value.trim()) {
                setSearchParams({ q: e.target.value.trim() });
              } else {
                setSearchParams({});
              }
              handleFilterChange();
            }}
              className="pl-10 bg-muted/50 text-base sm:text-lg h-11 sm:h-12"
            />
          </div>
          
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full sm:w-64 bg-background border-border hover:bg-accent focus:bg-background h-11 sm:h-12">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border shadow-lg z-50">
                <SelectItem value="all" className="hover:bg-accent focus:bg-accent">Todas as Categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id} className="hover:bg-accent focus:bg-accent">
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value) => { setSortBy(value); handleFilterChange(); }}>
              <SelectTrigger className="w-full sm:w-48 bg-background border-border hover:bg-accent focus:bg-background h-11 sm:h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border shadow-lg z-50">
                <SelectItem value="recent" className="hover:bg-accent focus:bg-accent">Mais Recentes</SelectItem>
                <SelectItem value="popular" className="hover:bg-accent focus:bg-accent">Mais Populares</SelectItem>
                <SelectItem value="name" className="hover:bg-accent focus:bg-accent">Nome (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="hero" asChild className="sm:ml-auto h-11 sm:h-12">
              <Link to="/cadastrar">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Cadastrar Grupo</span>
                <span className="sm:hidden">Cadastrar</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-card/50 rounded-lg border border-border/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Página {pagination.currentPage} de {pagination.totalPages} • {filteredGroups.length} grupo{filteredGroups.length !== 1 ? 's' : ''} aprovado{filteredGroups.length !== 1 ? 's' : ''} encontrado{filteredGroups.length !== 1 ? 's' : ''}
              </p>
            </div>
            {filteredGroups.length > 0 && (
              <div className="text-xs sm:text-sm text-muted-foreground">
                Total de membros: {filteredGroups.reduce((acc, group) => acc + (group.membersCount || 0), 0).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Resultados */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-card rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 sm:h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-2 sm:h-3 bg-muted rounded w-full"></div>
                      <div className="h-2 sm:h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="h-8 sm:h-10 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredGroups.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {pagination.paginatedItems.map((group, index) => (
                <div 
                  key={group.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <GroupCard
                    group={group}
                    onGroupUpdate={handleSearch}
                  />
                </div>
              ))}
            </div>
            
            <div className="mt-8 sm:mt-12">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={pagination.goToPage}
                hasNextPage={pagination.hasNextPage}
                hasPreviousPage={pagination.hasPreviousPage}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="sm:size-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Nenhum grupo encontrado</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              {searchTerm 
                ? `Não encontramos grupos com o termo "${searchTerm}".`
                : "Tente usar palavras-chave diferentes ou explore nossas categorias."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link to="/">
                  Explorar Categorias
                </Link>
              </Button>
              <Button variant="hero" asChild>
                <Link to="/cadastrar">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Cadastrar Grupo</span>
                  <span className="sm:hidden">Cadastrar</span>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Busca;