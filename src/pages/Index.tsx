import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { memo } from "react";
import { useOptimizedPopularGroups } from "@/hooks/useOptimizedPopularGroups";
import { useUltraFastGroups } from "@/hooks/useUltraFastGroups";
import GroupCard from "@/components/GroupCard";
import usePageAnalytics from "@/hooks/usePageAnalytics";
import Pagination from "@/components/Pagination";
import { useState } from "react";
import { ExpiredLinkNotifications } from "@/components/ExpiredLinkNotifications";

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

  // Grupos em alta (10 grupos)
  const {
    groups: popularGroups,
    loading: loadingPopular,
    refetch: refetchPopular
  } = useOptimizedPopularGroups('all', 10);

  // Outros grupos - 30 grupos aleatórios de outras categorias
  const {
    groups: otherGroups,
    loading: loadingOthers,
    refetch: refetchOthers
  } = useOptimizedPopularGroups('all', 30);

  console.log(`🔍 Index: Grupos populares:`, popularGroups.length, `Outros grupos:`, otherGroups.length);
  return <div className="min-h-screen bg-background">
      
      {/* Hero Banner - Clean Modern Design */}
      <section className="py-8 sm:py-12 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative">
        {/* Elegant Sidebar Indicator */}
        <div className="absolute top-6 left-6 group cursor-pointer">
          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-all duration-300">
            <span className="text-2xl animate-finger-jump">👆🏻</span>
            
          </div>
        </div>
        
        <div className="container-fluid">
          <div className="text-center max-w-5xl mx-auto space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <img src={logo} alt="TopGrupos" className="h-24 w-auto sm:h-32 drop-shadow-lg" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight font-heading">
              Descubra os <span className="text-transparent bg-gradient-to-r from-primary via-primary to-accent bg-clip-text">Melhores Grupos</span> do Telegram
            </h1>
            
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

      {/* Popular Groups Section - Modern Clean */}
      <section className="py-6 sm:py-8 bg-gradient-to-b from-muted/10 to-background">
        <div className="container-fluid">
          <div className="text-center mb-8 space-y-4">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-heading flex items-center justify-center gap-3">
              🔥 Grupos em <span className="text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text">Alta</span>
            </h2>
          </div>

          <div className="max-w-7xl mx-auto">
            {loadingPopular ? <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                {Array.from({
              length: 10
            }).map((_, index) => <div key={index} className="animate-pulse">
                    <div className="aspect-square bg-muted rounded-3xl"></div>
                  </div>)}
              </div> : popularGroups.length === 0 ? <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Nenhum grupo encontrado no momento</p>
                <p className="text-sm text-muted-foreground mt-2">Cadastre o primeiro grupo!</p>
              </div> : <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                {popularGroups.map((group, index) => <div key={group.id} className="animate-fade-in" style={{
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
              📋 Outros <span className="text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text">Grupos</span>
            </h2>
          </div>

          <div className="max-w-7xl mx-auto">
            {loadingOthers ? <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                {Array.from({
              length: 30
            }).map((_, index) => <div key={index} className="animate-pulse">
                    <div className="aspect-square bg-muted rounded-3xl"></div>
                  </div>)}
              </div> : otherGroups.length === 0 ? <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Nenhum outro grupo encontrado</p>
              </div> : <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                  {otherGroups.map((group, index) => <div key={group.id} className="animate-fade-in" style={{
                animationDelay: `${index * 0.05}s`
              }}>
                      <GroupCard group={group} onGroupUpdate={refetchOthers} />
                    </div>)}
                </div>}
          </div>
        </div>
      </section>

      {/* Community Stats Section */}
      <section className="py-8 sm:py-12 bg-gradient-to-br from-muted/20 to-background relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r sm:bg-gradient-to-r bg-gradient-to-b from-primary/5 via-transparent to-accent/5"></div>
        <div className="absolute bottom-10 right-10 w-16 h-16 sm:w-24 sm:h-24 bg-accent/5 sm:bg-accent/10 rounded-full blur-lg sm:blur-2xl"></div>
        
        <div className="container-fluid max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12 space-y-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 text-primary px-6 py-3 rounded-full text-sm font-semibold border border-primary/20 backdrop-blur-sm shadow-lg shadow-primary/10">
              <span className="text-lg">⚡</span>
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">Por que escolher o TopGrupos?</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading">
              A maior <span className="text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text">plataforma</span> de grupos do Brasil
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Stat 1 */}
            <div className="bg-gradient-to-br from-background/80 to-muted/20 backdrop-blur-sm rounded-3xl p-8 border border-border/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center text-3xl">
                  🚀
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text">1000+</h3>
                  <p className="text-muted-foreground font-medium">Grupos Ativos</p>
                </div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-gradient-to-br from-background/80 to-muted/20 backdrop-blur-sm rounded-3xl p-8 border border-border/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center text-3xl">
                  👥
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text">50K+</h3>
                  <p className="text-muted-foreground font-medium">Usuários Conectados</p>
                </div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-gradient-to-br from-background/80 to-muted/20 backdrop-blur-sm rounded-3xl p-8 border border-border/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center text-3xl">
                  ⭐
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text">98%</h3>
                  <p className="text-muted-foreground font-medium">Satisfação</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center space-y-6">
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Junte-se à maior comunidade de grupos do Telegram no Brasil. Descubra conteúdos incríveis, conecte-se com pessoas que compartilham seus interesses e expanda sua rede.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/cadastrar">
                  🎯 Cadastrar Meu Grupo
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/busca">
                  🔍 Explorar Grupos
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>


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
              © 2024 TopGrupos. Conectando você aos melhores grupos do Telegram.
            </p>
          </div>
        </div>
      </footer>
      
      
      

      
    </div>;
});
Index.displayName = 'Index';
export default Index;