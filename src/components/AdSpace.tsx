import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { checkIsAdmin } from '@/services/userService';
import { 
  getActiveBanner, 
  deactivateBanner, 
  deleteBanner,
  type Banner 
} from '@/services/bannerService';
import { Upload, Trash2, Eye, EyeOff, Rocket, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const AdSpace: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Initialize isAdmin from sessionStorage for immediate display
  const [isAdmin, setIsAdmin] = useState(() => {
    const savedAdminStatus = sessionStorage.getItem('isAdmin');
    return savedAdminStatus === 'true';
  });
  
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState<Banner | null>(null);
  const [bannerLoading, setBannerLoading] = useState(true);

  // Check admin status and update sessionStorage
  useEffect(() => {
    const checkAdminStatus = async () => {
      setAdminCheckLoading(true);
      if (currentUser?.uid) {
        const adminStatus = await checkIsAdmin(currentUser.uid);
        setIsAdmin(adminStatus);
        sessionStorage.setItem('isAdmin', adminStatus.toString());
        console.log('🔐 Admin status checked:', adminStatus, 'for user:', currentUser.uid);
      } else {
        setIsAdmin(false);
        sessionStorage.removeItem('isAdmin');
      }
      setAdminCheckLoading(false);
    };
    checkAdminStatus();
  }, [currentUser?.uid]);

  // Load active banner
  useEffect(() => {
    loadActiveBanner();
  }, []);

  const loadActiveBanner = async () => {
    try {
      setBannerLoading(true);
      const banner = await getActiveBanner();
      setActiveBanner(banner);
    } catch (error) {
      console.error('Erro ao carregar banner ativo:', error);
    } finally {
      setBannerLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!activeBanner?.id) return;

    try {
      await deactivateBanner(activeBanner.id);
      toast.success('Banner desativado com sucesso');
      await loadActiveBanner();
    } catch (error) {
      toast.error('Erro ao desativar banner');
    }
  };

  const handleDelete = async () => {
    if (!activeBanner?.id) return;

    if (!confirm(`Tem certeza que deseja deletar permanentemente este banner?`)) {
      return;
    }

    try {
      await deleteBanner(activeBanner.id, activeBanner.imageUrl);
      toast.success('Banner deletado permanentemente');
      await loadActiveBanner();
    } catch (error) {
      toast.error('Erro ao deletar banner');
    }
  };

  const handleUploadClick = () => {
    navigate('/upload-banner');
  };

  // Calculate remaining time
  const getRemainingTime = (endDate: Date): string => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return 'Expirado';
    if (days === 1) return '1 dia restante';
    return `${days} dias restantes`;
  };

  // Combined loading state - wait for both admin check and banner loading
  const isLoading = adminCheckLoading || bannerLoading;

  // Don't render anything while loading
  if (isLoading) {
    return null;
  }

  // Hide section for unauthenticated users when no active banner
  if (!activeBanner && !currentUser) {
    return null;
  }

  // Always render the section container
  return (
    <section className="py-6 sm:py-8 bg-gradient-to-r from-amber-50/50 via-orange-50/30 to-yellow-50/50 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-yellow-950/20 border-y border-amber-200/30 dark:border-amber-800/30">
      <div className="container-fluid">
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold font-heading flex items-center justify-center gap-3">
            📢 Espaço <span className="text-transparent bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text">Publicitário</span>
          </h2>
          {isAdmin && (
            <p className="text-sm text-muted-foreground mt-2">
              Área administrativa para gerenciar banners publicitários
            </p>
          )}
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Conditional content rendering */}
          {activeBanner ? (
            // Show active banner
            <div className="relative">
              <div className="w-full max-w-4xl mx-auto">
                <div className="relative rounded-2xl overflow-hidden shadow-lg border border-amber-200/50 dark:border-amber-800/50">
                  <img
                    src={activeBanner.imageUrl}
                    alt="Banner publicitário"
                    className="w-full h-auto max-h-[400px] object-contain"
                    loading="lazy"
                  />
                  
                  {/* Banner info overlay for admin */}
                  {isAdmin && (
                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-3 h-3" />
                        <span>Banner Ativo</span>
                      </div>
                      <div>{getRemainingTime(activeBanner.endDate)}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin controls for active banner */}
              {isAdmin && (
                <div className="flex justify-center gap-3 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUploadClick}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Novo Banner
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeactivate}
                    className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <EyeOff className="w-4 h-4" />
                    Desativar
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="gap-2 border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Deletar
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // No active banner - conditional content based on user status
            <>
              {isAdmin ? (
                // Admin user - show placeholder cards with upload button
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="w-full h-[300px] border-2 border-dashed border-amber-300/50 dark:border-amber-700/50 bg-amber-50/30 dark:bg-amber-950/10 flex flex-col items-center justify-center text-center p-6">
                      <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                        <span className="text-2xl">📢</span>
                      </div>
                      <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                        Espaço Publicitário
                      </h3>
                      <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
                        {index === 1 ? 'Área reservada para anúncios' : 'Disponível para publicidade'}
                      </p>
                      {index === 1 && (
                        <Badge variant="outline" className="mb-3 border-amber-400 text-amber-700">
                          300x300px
                        </Badge>
                      )}
                      
                      <Button
                        onClick={handleUploadClick}
                        size="sm"
                        className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
                      >
                        <Upload className="w-4 h-4" />
                        Fazer Upload
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : currentUser ? (
                // Authenticated non-admin user - show promotion message
                <div className="max-w-2xl mx-auto text-center">
                  <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 p-8">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <TrendingUp className="w-10 h-10 text-primary" />
                    </div>
                    
                    <h3 className="text-xl font-bold mb-4">
                      Destaque seu <span className="text-primary">Grupo</span>
                    </h3>
                    
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Quer que seu banner publicitário apareça aqui em destaque? Promova seu grupo e 
                      alcance milhares de novos membros todos os dias!
                    </p>
                    
                    <div className="space-y-4">
                      <Button 
                        asChild
                        size="lg"
                        className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-dark text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Link to="/promover">
                          <Rocket className="w-5 h-5 mr-2" />
                          Promover Meu Grupo
                        </Link>
                      </Button>
                      
                      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span>Resultados garantidos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>Pagamento seguro</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                          <span>Suporte dedicado</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : null /* Unauthenticated users see nothing when no banner is active - this section is now hidden by the early return above */}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdSpace;