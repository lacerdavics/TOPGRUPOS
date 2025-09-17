import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Eye, 
  EyeOff, 
  Trash2, 
  Upload,
  BarChart3,
  Clock
} from 'lucide-react';
import { useBannerManagement } from '@/hooks/useBannerManagement';
import { deactivateBanner, deleteBanner } from '@/services/bannerService';
import { toast } from 'sonner';

const BannerManagementPanel: React.FC = () => {
  const { activeBanner, allBanners, stats, loading, refreshData } = useBannerManagement();

  const handleDeactivate = async (bannerId: string) => {
    try {
      await deactivateBanner(bannerId);
      toast.success('Banner desativado com sucesso');
      refreshData();
    } catch (error) {
      toast.error('Erro ao desativar banner');
    }
  };

  const handleDelete = async (bannerId: string, imageUrl: string, fileName: string) => {
    if (!confirm(`Tem certeza que deseja deletar permanentemente o banner "${fileName}"?`)) {
      return;
    }

    try {
      await deleteBanner(bannerId, imageUrl);
      toast.success('Banner deletado permanentemente');
      refreshData();
    } catch (error) {
      toast.error('Erro ao deletar banner');
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRemainingTime = (endDate: Date): string => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return 'Expirado';
    if (days === 1) return '1 dia';
    return `${days} dias`;
  };

  const getBannerStatus = (banner: Banner): { status: string; color: string } => {
    const now = new Date();
    
    if (!banner.isActive) {
      return { status: 'Desativado', color: 'bg-gray-500' };
    }
    
    if (banner.endDate <= now) {
      return { status: 'Expirado', color: 'bg-red-500' };
    }
    
    return { status: 'Ativo', color: 'bg-green-500' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalBanners}</p>
                <p className="text-sm text-muted-foreground">Total de Banners</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeBanners}</p>
                <p className="text-sm text-muted-foreground">Banners Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.expiredBanners}</p>
                <p className="text-sm text-muted-foreground">Banners Expirados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Banner */}
      {activeBanner && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-600" />
                Banner Ativo
              </span>
              <Badge className="bg-green-600 text-white">
                {getRemainingTime(activeBanner.endDate)} restantes
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="w-full max-w-md mx-auto">
              <img
                src={activeBanner.imageUrl}
                alt="Banner ativo"
                className="w-full h-auto rounded-lg border"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Arquivo:</strong> {activeBanner.fileName}
              </div>
              <div>
                <strong>Tamanho:</strong> {Math.round(activeBanner.fileSize / 1024)} KB
              </div>
              <div>
                <strong>Início:</strong> {formatDate(activeBanner.startDate)}
              </div>
              <div>
                <strong>Fim:</strong> {formatDate(activeBanner.endDate)}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => activeBanner.id && handleDeactivate(activeBanner.id)}
                className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Desativar
              </Button>
              
              <Button
                variant="outline"
                onClick={() => activeBanner.id && handleDelete(activeBanner.id, activeBanner.imageUrl, activeBanner.fileName)}
                className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Banners History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Histórico de Banners</span>
            <Button onClick={refreshData} variant="outline" size="sm">
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allBanners.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum banner encontrado</h3>
              <p className="text-muted-foreground">Faça o upload do primeiro banner publicitário.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allBanners.map((banner) => {
                const { status, color } = getBannerStatus(banner);
                
                return (
                  <div key={banner.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={banner.imageUrl}
                        alt={banner.fileName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{banner.fileName}</h4>
                        <div className={`w-2 h-2 rounded-full ${color}`}></div>
                        <Badge variant="outline" className="text-xs">
                          {status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Criado: {formatDate(banner.createdAt)}</div>
                        <div>Duração: {banner.durationDays} dias</div>
                        {banner.isActive && banner.endDate > new Date() && (
                          <div className="text-green-600 font-medium">
                            {getRemainingTime(banner.endDate)} restantes
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {banner.isActive && banner.endDate > new Date() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => banner.id && handleDeactivate(banner.id)}
                          className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          <EyeOff className="w-3 h-3 mr-1" />
                          Desativar
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => banner.id && handleDelete(banner.id, banner.imageUrl, banner.fileName)}
                        className="border-red-500 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Deletar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BannerManagementPanel;