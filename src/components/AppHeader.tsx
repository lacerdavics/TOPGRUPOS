import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  User, 
  LogOut, 
  Settings,
  Menu,
  Home
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { checkIsAdmin } from "@/services/userService";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const logo = "https://firebasestorage.googleapis.com/v0/b/utm-propria.firebasestorage.app/o/logo%2FGenerated_Image_September_11__2025_-_12_49AM-removebg-preview.png?alt=media&token=0117896e-f785-4f74-a895-6b182e8f741f";

export function AppHeader() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser?.uid) {
        const adminStatus = await checkIsAdmin(currentUser.uid);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [currentUser?.uid]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/busca?q=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm("");
    }
  };

  const UserDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-full">
          <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
            <AvatarFallback>
              {currentUser?.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 sm:w-56" align="end">
        <DropdownMenuItem>
          <div className="flex flex-col">
            <p className="text-xs sm:text-sm font-medium truncate max-w-[150px] sm:max-w-none">{currentUser?.email}</p>
            <p className="text-xs text-muted-foreground">Usuário</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link to="/meus-grupos" className="w-full">
            <User className="mr-2 w-3 h-3 sm:w-4 sm:h-4" />
            Meus Grupos
          </Link>
        </DropdownMenuItem>
        
        {isAdmin && (
          <>
            <DropdownMenuItem asChild>
              <Link to="/admin" className="w-full">
                <Settings className="mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                Painel Admin
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/upload-banner" className="w-full">
                <Plus className="mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                Upload Banner
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 w-3 h-3 sm:w-4 sm:h-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const MobileMenu = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="lg:hidden h-8 w-8 p-0">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 sm:w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <img src={logo} alt="TopGrupos" className="h-6 sm:h-8 w-auto" />
            TopGrupos
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-2">
          <Button asChild variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
            <Link to="/">
              <Home className="mr-3 h-4 w-4" />
              Início
            </Link>
          </Button>
          
          <Button asChild variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
            <Link to="/cadastrar">
              <Plus className="mr-3 h-4 w-4" />
              Cadastrar Grupo
            </Link>
          </Button>
          
          <Button asChild variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
            <Link to="/promover">
              <span className="mr-3">🚀</span>
              Promover Grupo
            </Link>
          </Button>

          {currentUser ? (
            <>
              <Button asChild variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                <Link to="/meus-grupos">
                  <User className="mr-3 h-4 w-4" />
                  Meus Grupos
                </Link>
              </Button>
              
              {isAdmin && (
                <>
                  <Button asChild variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                    <Link to="/admin">
                      <Settings className="mr-3 h-4 w-4" />
                      Painel Admin
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                    <Link to="/upload-banner">
                      <Plus className="mr-3 h-4 w-4" />
                      Upload Banner
                    </Link>
                  </Button>
                </>
              )}
              
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-3 h-4 w-4" />
                Sair
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
              <Link to="/auth">
                <LogOut className="mr-3 h-4 w-4" />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 sm:h-16 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-3 sm:px-4 h-full flex items-center justify-between">
        {/* Logo e Menu Mobile */}
        <div className="flex items-center gap-2 sm:gap-4">
          <MobileMenu />
          
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2">
            <img src={logo} alt="TopGrupos" className="h-6 sm:h-8 w-auto" />
            <span className="font-bold text-lg sm:text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:block">
              TopGrupos
            </span>
          </Link>
        </div>

        {/* Busca Central */}
        <div className="hidden lg:flex flex-1 max-w-md mx-4 xl:mx-8">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar grupos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-muted/50 h-9"
              />
            </div>
          </form>
        </div>

        {/* Ações do Header */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Busca Mobile - Expandível */}
          <div className="lg:hidden">
            {!mobileSearchOpen ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setMobileSearchOpen(true)}
                className="h-8 w-8 p-0"
              >
                <Search className="h-4 w-4" />
              </Button>
            ) : (
              <div className="fixed top-14 sm:top-16 left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-border/50 p-3 sm:p-4 z-40">
                <form onSubmit={(e) => {
                  handleSearch(e);
                  setMobileSearchOpen(false);
                }} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Buscar grupos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-muted/50 h-10"
                      autoFocus
                    />
                  </div>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    onClick={() => setMobileSearchOpen(false)}
                    className="h-10 px-3"
                  >
                    Fechar
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* Busca Mobile */}
          <Button asChild variant="ghost" size="sm" className="lg:hidden hidden">
            <Link to="/busca">
              <Search className="h-4 w-4" />
            </Link>
          </Button>

          {/* Cadastrar Grupo */}
          <Button asChild variant="outline" size="sm" className="hidden md:flex text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9">
            <Link to="/cadastrar">
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden lg:inline">Cadastrar</span>
              <span className="lg:hidden">+</span>
            </Link>
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          {currentUser ? (
            <UserDropdown />
          ) : (
            <Button asChild variant="default" size="sm" className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm">
              <Link to="/auth">
                <span className="hidden sm:inline">Entrar</span>
                <span className="sm:hidden">Login</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}