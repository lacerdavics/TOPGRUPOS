import { Link, useLocation, useNavigate } from "react-router-dom";
import { categories } from "@/data/categories";
import { useResponsiveBreakpoints } from "@/hooks/useResponsiveBreakpoints";
import CategoryIcon from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Plus, LogOut, Home, User, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { resetSidebarState } from "@/utils/sidebarUtils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { checkIsAdmin } from "@/services/userService";
import { requiresAgeVerification, isAgeVerified } from "@/utils/ageVerification";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogTitle } from "@radix-ui/react-dialog";

const logo = "https://firebasestorage.googleapis.com/v0/b/utm-propria.firebasestorage.app/o/logo%2FGenerated_Image_September_11__2025_-_12_49AM-removebg-preview.png?alt=media&token=0117896e-f785-4f74-a895-6b182e8f741f";

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const { isMobile, isTablet, width } = useResponsiveBreakpoints();
  const location = useLocation();
  const currentPath = location.pathname;
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  // Check admin status quando o usuário muda
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser?.uid) {
        setCheckingAdmin(true);
        try {
          const adminStatus = await checkIsAdmin(currentUser.uid);
          setIsAdmin(adminStatus);
          // Armazena no sessionStorage para persistir durante a sessão
          sessionStorage.setItem('isAdmin', adminStatus.toString());
        } catch (error) {
          console.error("Erro ao verificar status de admin:", error);
          setIsAdmin(false);
          sessionStorage.removeItem('isAdmin');
        } finally {
          setCheckingAdmin(false);
        }
      } else {
        setIsAdmin(false);
        sessionStorage.removeItem('isAdmin');
      }
    };

    checkAdminStatus();
  }, [currentUser?.uid]);

  // Recupera o status de admin do sessionStorage no carregamento inicial
  useEffect(() => {
    const savedAdminStatus = sessionStorage.getItem('isAdmin');
    if (savedAdminStatus) {
      setIsAdmin(savedAdminStatus === 'true');
    }
  }, []);

  // Reset sidebar state when breakpoint changes
  useEffect(() => {
    resetSidebarState();
  }, [isMobile, isTablet, width]);

  const handleLogout = async () => {
    try {
      await logout();
      sessionStorage.removeItem('isAdmin');
      navigate("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleAdminClick = () => {
    navigate("/admin");
    setDropdownOpen(false);
  };

  // Função para verificar admin status quando o dropdown é aberto
  const handleDropdownOpen = async (open: boolean) => {
    setDropdownOpen(open);
    
    if (open && currentUser?.uid && !checkingAdmin) {
      try {
        const adminStatus = await checkIsAdmin(currentUser.uid);
        setIsAdmin(adminStatus);
        sessionStorage.setItem('isAdmin', adminStatus.toString());
      } catch (error) {
        console.error("Erro ao verificar admin status:", error);
      }
    }
  };

  const isActive = (categoryId: string) => currentPath === `/categoria/${categoryId}`;

  const getIconColor = (categoryId: string, isActiveState: boolean) => {
    const colorMap: Record<string, string> = {
      adulto: isActiveState ? "text-slate-600" : "text-slate-500 group-hover:text-slate-600",
      amizade: isActiveState ? "text-blue-600" : "text-blue-500 group-hover:text-blue-600",
      namoro: isActiveState ? "text-pink-600" : "text-pink-500 group-hover:text-pink-600",
      "filmes-series": isActiveState ? "text-purple-600" : "text-purple-500 group-hover:text-purple-600",
      cidades: isActiveState ? "text-green-600" : "text-green-500 group-hover:text-green-600",
      cursos: isActiveState ? "text-orange-600" : "text-orange-500 group-hover:text-orange-600",
      "compra-venda": isActiveState ? "text-teal-600" : "text-teal-500 group-hover:text-teal-600",
      "ofertas-cupons": isActiveState ? "text-red-600" : "text-red-500 group-hover:text-red-600",
      "ganhar-dinheiro": isActiveState ? "text-yellow-600" : "text-yellow-500 group-hover:text-yellow-600",
      criptomoedas: isActiveState ? "text-amber-600" : "text-amber-500 group-hover:text-amber-600",
      "culinaria-receitas": isActiveState ? "text-lime-600" : "text-lime-500 group-hover:text-lime-600",
      concursos: isActiveState ? "text-violet-600" : "text-violet-500 group-hover:text-violet-600",
      "desenhos-animes": isActiveState ? "text-sky-600" : "text-sky-500 group-hover:text-sky-600",
      divulgacao: isActiveState ? "text-indigo-600" : "text-indigo-500 group-hover:text-indigo-600",
      empreendedorismo: isActiveState ? "text-gray-600" : "text-gray-500 group-hover:text-gray-600",
      educacao: isActiveState ? "text-emerald-600" : "text-emerald-500 group-hover:text-emerald-600",
      esportes: isActiveState ? "text-indigo-700" : "text-indigo-600 group-hover:text-indigo-700",
      futebol: isActiveState ? "text-green-700" : "text-green-600 group-hover:text-green-700",
      "sorteios-premiacoes": isActiveState ? "text-rose-600" : "text-rose-500 group-hover:text-rose-600",
    };
    return colorMap[categoryId] || (isActiveState ? "text-primary" : "text-muted-foreground group-hover:text-primary");
  };

  const isCollapsed = state === "collapsed" && !isMobile && !isTablet;

  const getCardCls = (active: boolean) =>
    active
      ? "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 text-primary shadow-lg scale-105 ring-1 ring-primary/20"
      : "bg-gradient-to-br from-card via-muted/20 to-card hover:from-primary/5 hover:to-accent/5 hover:shadow-elegant hover:scale-105 hover:ring-1 hover:ring-primary/10 transition-all duration-300 border-border/50";

  // Componente para o dropdown do usuário
  const UserDropdown = () => (
    <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {currentUser?.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuItem>
          <div className="flex flex-col">
            <p className="text-sm font-medium">{currentUser?.email}</p>
            <p className="text-xs text-muted-foreground">Usuário</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Opção do Painel Admin no dropdown */}
        {isAdmin && (
          <>
            <DropdownMenuItem onClick={handleAdminClick}>
              <Settings className="mr-2 w-4 h-4" />
              Painel Admin
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 w-4 h-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // ---- MOBILE / TABLET ----
  if (isMobile || isTablet) {
    return (
      <Sidebar
        collapsible="offcanvas"
        className="fixed inset-0 z-50 h-screen w-full max-w-xs bg-[#292723]"
      >
        <VisuallyHidden>
          <DialogTitle>Menu de navegação</DialogTitle>
        </VisuallyHidden>

        <div className="flex flex-col h-screen">
          <SidebarHeader className="flex-shrink-0 p-2 border-b border-border/30">
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="flex items-center space-x-2 group"
                onClick={() => setOpenMobile(false)}
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden group-hover:scale-105 transition-all duration-300 shadow-sm ring-1 ring-primary/15 group-hover:ring-primary/30">
                  <img src={logo} alt="TopGrupos Logo" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-base font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  TopGrupos
                </h1>
              </Link>
              <div className="flex items-center gap-2">
                {currentUser && <UserDropdown />}
              </div>
            </div>
          </SidebarHeader>

          <div className="flex-shrink-0 p-3 border-b border-border/30">
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setOpenMobile(false)}
                className={`${getCardCls(currentPath === "/")} flex items-center gap-2 p-2 rounded-xl`}
              >
                <Home className="w-5 h-5" />
                <span className="text-xs font-semibold">Início</span>
              </Link>
              <Link
                to="/cadastrar"
                onClick={() => setOpenMobile(false)}
                className={`${getCardCls(currentPath === "/cadastrar")} flex items-center gap-2 p-2 rounded-xl`}
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs font-semibold">Cadastrar Grupo</span>
              </Link>
              <Link
                to="/promover"
                onClick={() => setOpenMobile(false)}
                className={`${getCardCls(currentPath === "/promover")} flex items-center gap-2 p-2 rounded-xl`}
              >
                <span className="text-lg">🚀</span>
                <span className="text-xs font-semibold">Promover Grupo</span>
              </Link>

              {currentUser ? (
                <Link
                  to="/meus-grupos"
                  onClick={() => setOpenMobile(false)}
                  className={`${getCardCls(currentPath === "/meus-grupos")} flex items-center gap-2 p-2 rounded-xl`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-xs font-semibold">Meus Grupos</span>
                </Link>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setOpenMobile(false)}
                  className={`${getCardCls(currentPath === "/auth")} flex items-center gap-2 p-2 rounded-xl`}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-xs font-semibold">Entrar</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-3" style={{ 
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}>
              <div className="mb-4">
                <h3 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary mb-2">
                  📂 Categorias
                </h3>
              </div>
              
              <div className="flex flex-col gap-2 pb-4">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={
                      requiresAgeVerification(cat.id) && !isAgeVerified()
                        ? `/verificacao-idade?redirect=${encodeURIComponent(`/categoria/${cat.id}`)}`
                        : `/categoria/${cat.id}`
                    }
                    onClick={() => setOpenMobile(false)}
                    className={`${getCardCls(isActive(cat.id))} flex items-center gap-2 p-2 rounded-xl`}
                  >
                    <CategoryIcon
                      iconData={cat.icon}
                      size={20}
                      className={getIconColor(cat.id, isActive(cat.id))}
                    />
                    <span className="text-xs font-semibold">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 p-3 border-t border-border/30 text-center text-xs text-muted-foreground">
            © 2024 TopGrupos
          </div>
        </div>
      </Sidebar>
    );
  }
  
  // === DESKTOP SIDEBAR ===
  return (
    <Sidebar className={`h-full ${isCollapsed ? "w-12 bg-[#292723]" : "w-60 bg-[#292723]"} transition-all duration-300 ease-in-out border-r border-border/30 flex flex-col`} collapsible="icon">
      <SidebarHeader className="p-2 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden group-hover:scale-105 transition-all duration-300 shadow-sm ring-1 ring-primary/15 group-hover:ring-primary/30">
              <img src={logo} alt="TopGrupos Logo" className="w-full h-full object-cover" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <h1 className="text-base font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">TopGrupos</h1>
              </div>
            )}
          </Link>

          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              {currentUser && <UserDropdown />}
              <ThemeToggle />
            </div>
          )}
        </div>
      </SidebarHeader>

      {!isCollapsed && (
        <div className="flex-shrink-0 p-3 border-b border-border/30">
          <nav className="flex flex-col space-y-2">
            <Link
              to="/"
              className={`${getCardCls(currentPath === "/")} flex items-center gap-2 p-2 rounded-xl`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs font-semibold">Início</span>
            </Link>
            <Link
              to="/cadastrar"
              className={`${getCardCls(currentPath === "/cadastrar")} flex items-center gap-2 p-2 rounded-xl`}
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs font-semibold">Cadastrar Grupo</span>
            </Link>
            <Link
              to="/promover"
              className={`${getCardCls(currentPath === "/promover")} flex items-center gap-2 p-2 rounded-xl`}
            >
              <span className="text-lg">🚀</span>
              <span className="text-xs font-semibold">Promover Grupo</span>
            </Link>

            {currentUser ? (
              <Link
                to="/meus-grupos"
                className={`${getCardCls(currentPath === "/meus-grupos")} flex items-center gap-2 p-2 rounded-xl`}
              >
                <User className="w-5 h-5" />
                <span className="text-xs font-semibold">Meus Grupos</span>
              </Link>
            ) : (
              <Link
                to="/auth"
                className={`${getCardCls(currentPath === "/auth")} flex items-center gap-2 p-2 rounded-xl`}
              >
                <LogOut className="w-5 h-5" />
                <span className="text-xs font-semibold">Entrar</span>
              </Link>
            )}
          </nav>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {!isCollapsed && (
          <>
            <div className="flex-shrink-0 p-3 pb-2">
              <h3 className="text-sm font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent px-2 py-1">📂 Categorias</h3>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ 
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
            }}>
              <div className="grid gap-2 grid-cols-1">
                {categories.map((category) => (
                  <Link 
                    key={category.id} 
                    to={
                      requiresAgeVerification(category.id) && !isAgeVerified()
                        ? `/verificacao-idade?redirect=${encodeURIComponent(`/categoria/${category.id}`)}`
                        : `/categoria/${category.id}`
                    }
                    className={`${getCardCls(isActive(category.id))} rounded-xl border backdrop-blur-sm flex flex-col items-center text-center justify-center group relative overflow-hidden transition-all duration-300 p-1.5 min-h-[60px]`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/2 to-accent/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10 flex-shrink-0">
                      <CategoryIcon 
                        iconData={category.icon} 
                        size={20} 
                        className={`transition-all duration-300 group-hover:scale-110 ${getIconColor(category.id, isActive(category.id))}`} 
                      />
                    </div>
                    <div className="relative z-10">
                      <span className="font-semibold leading-tight block group-hover:text-primary transition-colors duration-300 text-xs">{category.name}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex-shrink-0 p-3 border-t border-border/20 text-center">
          <p className="text-xs text-muted-foreground">© 2025 TopGrupos</p>
        </div>
      </div>
    </Sidebar>
  );
}