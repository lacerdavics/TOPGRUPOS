import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeProvider";

import { AppHeader } from "@/components/AppHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useResponsiveBreakpoints } from "@/hooks/useResponsiveBreakpoints";
import ScrollToTop from "@/components/ScrollToTop";

// Pages
import Index from "./pages/Index";
import CadastrarGrupo from "./pages/CadastrarGrupo";
import EditarGrupo from "./pages/EditarGrupo";
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
import RecategorizeGroup from "./pages/RecategorizeGroup";
import AdminPanel from "./pages/AdminPanel";
import UploadBanner from "./pages/UploadBanner";
import AgeVerification from "./pages/AgeVerification";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isMobile, isTablet } = useResponsiveBreakpoints();

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      <AppHeader />
      
      <main className="flex-1 pt-14 sm:pt-16">
        <ScrollToTop />
        <Routes>
          {/* Páginas públicas */}
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

          {/* Rotas de grupos */}
          <Route path="/cadastrar" element={<CadastrarGrupo />} />
          <Route path="/editar-grupo/:groupId" element={<EditarGrupo />} />
          <Route path="/grupo/:groupId" element={<GroupDetails />} />
          <Route path="/grupo/:groupId/descricao" element={<GroupDescription />} />
          <Route path="/grupo/:groupId/apagar" element={<DeleteGroup />} />
          <Route path="/grupo/:groupId/suspender" element={<SuspendGroup />} />
          <Route path="/grupo/:groupId/denunciar" element={<ReportGroup />} />
          <Route path="/grupo/:groupId/recategorizar" element={<RecategorizeGroup />} />
          <Route path="/report/:groupId" element={<Report />} />
          <Route path="/promover" element={<Promover />} />
          <Route path="/meus-grupos" element={<MeusGrupos />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/upload-banner" element={<UploadBanner />} />

          {/* Blog */}
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />

          {/* Verificação de idade */}
          <Route path="/verificacao-idade" element={<AgeVerification />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="topgrupos-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
