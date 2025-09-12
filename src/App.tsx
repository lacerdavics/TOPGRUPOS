import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeProvider";

import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useResponsiveBreakpoints } from "@/hooks/useResponsiveBreakpoints";
import ScrollToTop from "@/components/ScrollToTop";

// Pages
import Index from "./pages/Index";
import CadastrarGrupo from "./pages/CadastrarGrupo";
import EditarGrupo from "./pages/EditarGrupo"; // Novo
import Categoria from "./pages/Categoria";
import Busca from "./pages/Busca";
import Sobre from "./pages/Sobre";
import Contato from "./pages/Contato";
import Termos from "./pages/Termos";
import Privacidade from "./pages/Privacidade";
import NotFound from "./pages/NotFound";
import GroupDetails from "./pages/GroupDetails";
import GroupDescription from "./pages/GroupDescription";
import Auth from "./pages/Auth";
import MeusGrupos from "./pages/MeusGrupos";
import ResetPassword from "./pages/ResetPassword";
import Report from "./pages/Report";
import Confirmation from "./pages/Confirmation";
import Promover from "./pages/Promover";
import DeleteGroup from "./pages/DeleteGroup";
import SuspendGroup from "./pages/SuspendGroup";
import ReportGroup from "./pages/ReportGroup";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isMobile, isTablet } = useResponsiveBreakpoints();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Header for mobile and tablet */}
        {(isMobile || isTablet) && (
          <header className="fixed top-0 left-0 right-0 z-[60] h-16 flex items-center justify-between px-4 bg-background/95 backdrop-blur-sm border-b border-border/50">
            <SidebarTrigger className="h-10 w-10 p-2 hover:bg-accent/50 rounded-lg transition-colors" />
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              TopGrupos
            </span>
            <ThemeToggle />
          </header>
        )}

        <AppSidebar />

        <main className={`flex-1 ${(isMobile || isTablet) ? 'pt-16' : 'ml-60'}`}>
          <ScrollToTop />
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<Index />} />
            <Route path="/categoria/:categoryId" element={<Categoria />} />
            <Route path="/busca" element={<Busca />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/contato" element={<Contato />} />
            <Route path="/termos" element={<Termos />} />
            <Route path="/privacidade" element={<Privacidade />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/confirmation" element={<Confirmation />} />

            {/* Group Routes */}
            <Route path="/cadastrar" element={<CadastrarGrupo />} />
            <Route path="/editar-grupo/:groupId" element={<EditarGrupo />} /> {/* Novo */}
            <Route path="/grupo/:groupId" element={<GroupDetails />} />
            <Route path="/grupo/:groupId/descricao" element={<GroupDescription />} />
            <Route path="/grupo/:groupId/apagar" element={<DeleteGroup />} />
            <Route path="/grupo/:groupId/suspender" element={<SuspendGroup />} />
            <Route path="/grupo/:groupId/denunciar" element={<ReportGroup />} />
            <Route path="/report/:groupId" element={<Report />} />
            <Route path="/promover" element={<Promover />} />
            <Route path="/meus-grupos" element={<MeusGrupos />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="topgrupos-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
