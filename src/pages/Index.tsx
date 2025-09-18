import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { memo, useMemo } from "react";
import SEOHead from "@/components/SEOHead";
import { useOptimizedPopularGroups } from "@/hooks/useOptimizedPopularGroups";
import { useOptimizedGroupsExcluding } from "@/hooks/useOptimizedPopularGroups";
import { useUltraFastGroups } from "@/hooks/useUltraFastGroups";
import { filterAdultGroups, isAgeVerified } from "@/utils/ageVerification";
import GroupCard from "@/components/GroupCard";
import usePageAnalytics from "@/hooks/usePageAnalytics";
import { Pagination } from "@/components/Pagination"
import { useState } from "react";
import { ExpiredLinkNotifications } from "@/components/ExpiredLinkNotifications";
import { BlogSEO } from "@/components/BlogSEO";
import { FAQSection } from "@/components/FAQSection";
import AdSpace from "@/components/AdSpace";

// Temporarily removed problematic imports
// import { incrementOptimizedGroupViews } from "@/services/optimizedPopularGroupsService";
// import { trackVisit } from "@/services/analyticsService";

const logo = "/lovable-uploads/b0f3f9b9-09e8-4981-b31b-28d97801c974.png";

const Index = memo(() => {
  usePageAnalytics();
  
  // Estado para paginação dos outros grupos
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 30; // Mostra todos os 30 grupos de uma vez

  // Force cache refresh - ensuring all age verification code is removed
  console.log('Index page loaded - age verification removed');

  // Check if adult content should be included
  const includeAdultContent = isAgeVerified();

  // Grupos em alta (10 grupos)
  const {
    groups: popularGroups,
    loading: loadingPopular,
    refetch: refetchPopular
  } = useOptimizedPopularGroups('all', 10);

  // Debug: Log popular groups
  console.log('🔍 DEBUG INDEX: Popular Groups loaded:', popularGroups.length);
  console.log('🔍 DEBUG INDEX: Popular Group IDs:', popularGroups.map(g => g.id));
  console.log('🔍 DEBUG INDEX: Popular Group Names:', popularGroups.map(g => g.name));
  
  // Memoize popularGroupIds to prevent infinite re-renders
  const popularGroupIds = useMemo(() => {
    return popularGroups.map(g => g.id);
  }, [popularGroups]);
  
  // Outros grupos - 30 grupos aleatórios EXCLUINDO os que estão em alta
  const {
    groups: otherGroups,
    loading: loadingOthers,
    refetch: refetchOthers
  } = useOptimizedGroupsExcluding('all', 30, popularGroupIds);

  // Filter out adult groups if age not verified
  const filteredPopularGroups = filterAdultGroups(popularGroups, includeAdultContent);
  const filteredOtherGroups = filterAdultGroups(otherGroups, includeAdultContent);

  // Debug: Log other groups
  console.log('🔍 DEBUG INDEX: Other Groups loaded:', filteredOtherGroups.length);
  console.log('🔍 DEBUG INDEX: Other Group IDs:', filteredOtherGroups.map(g => g.id));
  console.log('🔍 DEBUG INDEX: Other Group Names:', filteredOtherGroups.map(g => g.name));
  console.log('🔍 DEBUG INDEX: Exclude IDs passed to service:', popularGroupIds);
  console.log(`🔍 Index: Grupos populares:`, filteredPopularGroups.length, `Outros grupos:`, filteredOtherGroups.length);
  console.log(`🚫 Evitando duplicação: ${popularGroupIds.length} IDs excluídos da seção "Outros Grupos"`);
  console.log(`📸 Primeiros 3 grupos populares:`, filteredPopularGroups.slice(0, 3).map(g => ({ 
    name: g.name, 
    profileImage: g.profileImage || g.imageUrl,
    hasImage: !!(g.profileImage || g.imageUrl)
  })));

  // Structured data for homepage
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "name": "TopGrupos",
    "headline": "Descubra os Melhores Grupos do Telegram no Brasil",
    "description": "A maior plataforma para descobrir grupos do Telegram no Brasil",
    "url": "https://topgrupostele.com.br",
    "datePublished": "2024-01-01T00:00:00Z",
    "dateModified": new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "TopGrupos",
      "url": "https://topgrupostele.com.br/sobre",
      "sameAs": [
        "https://t.me/topgrupos"
      ]
    },
    "publisher": {
      "@type": "Organization",
      "name": "TopGrupos",
      "url": "https://topgrupostele.com.br",
      "logo": {
        "@type": "ImageObject",
        "url": "https://topgrupostele.com.br/lovable-uploads/b0f3f9b9-09e8-4981-b31b-28d97801c974.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://topgrupostele.com.br"
    },
    "discussionUrl": "https://topgrupostele.com.br#grupos-discussao",
    "about": {
      "@type": "Thing",
      "name": "Grupos do Telegram",
      "description": "Comunidades e grupos do Telegram organizados por categoria"
    },
    "image": {
      "@type": "ImageObject",
      "url": "https://topgrupostele.com.br/lovable-uploads/b0f3f9b9-09e8-4981-b31b-28d97801c974.png",
      "width": 1200,
      "height": 630
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://topgrupostele.com.br/busca?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "hasPart": {
      "@type": "ItemList",
      "name": "Grupos Populares do Telegram",
      "numberOfItems": filteredPopularGroups.length,
      "itemListElement": filteredPopularGroups.slice(0, 10).map((group, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "DiscussionForumPosting",
          "name": group.name,
          "headline": group.name,
          "description": group.description,
          "url": `https://topgrupostele.com.br/grupo/${group.id}`,
          "datePublished": group.createdAt?.toISOString() || "2024-01-01T00:00:00Z",
          "dateModified": group.createdAt?.toISOString() || "2024-01-01T00:00:00Z",
          "author": {
            "@type": "Organization",
            "name": "TopGrupos",
            "url": "https://topgrupostele.com.br"
          },
          "discussionUrl": `https://topgrupostele.com.br/grupo/${group.id}`,
          "about": {
            "@type": "Thing",
            "name": group.category || "Telegram",
            "description": group.description
          }
        }
      }))
    }
  };

  return <div className="min-h-screen bg-background">
      <SEOHead
        title="TopGrupos - Descubra os Melhores Grupos do Telegram | +500 Grupos Ativos"
        description="🚀 Encontre grupos do Telegram organizados por categoria: amizade, namoro, filmes, educação, criptomoedas e mais. +500 grupos ativos verificados. Cadastre seu grupo grátis!"
        keywords="grupos telegram, telegram grupos, grupos do telegram, comunidades telegram, grupos telegram brasil, telegram channels, grupos telegram amizade, grupos telegram namoro, grupos telegram filmes, grupos telegram educação, grupos telegram criptomoedas, cadastrar grupo telegram, promover grupo telegram"
        url="https://topgrupostele.com.br"
        structuredData={structuredData}
      />
      
      {/* Hero Banner - Clean Modern Design */}
      <section className="py-8 sm:py-12 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative">
        {/* Elegant Sidebar Indicator */}
        <div className="absolute top-6 left-6 group cursor-pointer">
          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-all duration-300">
            
          </div>
        </div>
        
        <div className="container-fluid">
          <div className="text-center max-w-5xl mx-auto space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <img src={logo} alt="TopGrupos" className="h-24 w-auto sm:h-32 drop-shadow-lg" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight font-heading">
              Descubra os <span className="text-transparent bg-gradient-to-r from-primary via-primary to-accent bg-clip-text">Melhores Grupos do Telegram</span> no Brasil
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Mais de <strong className="text-primary">milhares de grupos ativos</strong> organizados por categoria. 
              Conecte-se com comunidades de <strong>amizade</strong>, <strong>namoro</strong>, <strong>filmes</strong>, 
              <strong>educação</strong>, <strong>criptomoedas</strong> e muito mais!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto sm:max-w-none">
              <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                <Link to="/cadastrar">
                  ➕ Cadastrar Grupo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Notificações de Links Expirados */}
      <div className="container mx-auto px-4 pt-2">
        <ExpiredLinkNotifications />
      </div>

      {/* Espaço Publicitário */}
      <AdSpace />

      {/* Popular Groups Section - Modern Clean */}
      <section className="py-6 sm:py-8 bg-gradient-to-b from-muted/10 to-background">
        <div className="container-fluid">
          <div className="text-center mb-8 space-y-4">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-heading flex items-center justify-center gap-3">
              🔥 Grupos do Telegram em <span className="text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text">Alta</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Os grupos mais populares e ativos da nossa plataforma, atualizados diariamente
            </p>
          </div>

          <div className="max-w-7xl mx-auto">
            {loadingPopular ? <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                {Array.from({
              length: 10
            }).map((_, index) => <div key={index} className="animate-pulse">
                    <div className="aspect-square bg-muted rounded-3xl"></div>
                  </div>)}
              </div> : filteredPopularGroups.length === 0 ? <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Nenhum grupo encontrado no momento</p>
                <p className="text-sm text-muted-foreground mt-2">Cadastre o primeiro grupo aprovado!</p>
              </div> : <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                {filteredPopularGroups.map((group, index) => <div key={group.id} className="animate-fade-in" style={{
              animationDelay: `${index * 0.05}s`
            }}>
                    <GroupCard group={group} onGroupUpdate={refetchPopular} />
                  </div>)}
              </div>}
          </div>
        </div>
      </section>

      {/* Outros Grupos Section */}
      <section className="py-6 sm:py-8 bg-gradient-to-b from-background to-muted/10">
        <div className="container-fluid">
          <div className="text-center mb-8 space-y-4">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-heading flex items-center justify-center gap-3">
              📋 Mais Grupos do <span className="text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text">Telegram</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore nossa coleção completa de grupos verificados em todas as categorias
            </p>
          </div>

          <div className="max-w-7xl mx-auto">
            {loadingOthers ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando grupos...</p>
              </div>
            ) : otherGroups.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                {filteredOtherGroups.map((group, index) => (
                  <div key={group.id} className="animate-fade-in" style={{
                animationDelay: `${index * 0.05}s`
                  }}>
                      <GroupCard group={group} onGroupUpdate={refetchOthers} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl sm:text-3xl">📋</span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">Não há mais grupos disponíveis</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto">
                  Todos os grupos aprovados já estão sendo exibidos na seção "Grupos em Alta" acima.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                  <Button variant="outline" asChild>
                    <Link to="/busca">
                      🔍 Explorar Categorias
                    </Link>
                  </Button>
                  <Button variant="hero" asChild>
                    <Link to="/cadastrar">
                      ➕ Cadastrar Grupo
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection limit={6} />

      {/* Blog Section - Movida para o final da página */}
      <BlogSEO featured={true} />

      {/* Modern Clean Footer */}
      <footer className="py-6 sm:py-8 border-t border-border/30 bg-muted/5">
        <div className="container-fluid">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-accent/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <img src={logo} alt="TopGrupos Logo" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent text-lg">
                  TopGrupos
                </span>
                <span className="text-xs text-muted-foreground font-semibold tracking-wider">
                  TELEGRAM
                </span>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link to="/sobre" className="hover:text-foreground transition-colors font-medium hover:underline">Sobre</Link>
              <Link to="/contato" className="hover:text-foreground transition-colors font-medium hover:underline">Contato</Link>
              <Link to="/termos" className="hover:text-foreground transition-colors font-medium hover:underline">Termos</Link>
              <Link to="/privacidade" className="hover:text-foreground transition-colors font-medium hover:underline">Privacidade</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border/20 text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 TopGrupos. Conectando você aos melhores grupos do Telegram.
            </p>
          </div>
        </div>
      </footer>
    </div>;
});
Index.displayName = 'Index';
export default Index;