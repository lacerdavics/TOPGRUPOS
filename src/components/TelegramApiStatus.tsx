/**
 * Component to monitor Telegram API status and cache health
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { telegramApiIntegration } from '@/services/telegramApiIntegration';
import { 
  Activity, 
  Database, 
  Server, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  XCircle 
} from 'lucide-react';

interface ServiceStatus {
  api: {
    healthy: boolean;
    upstash: boolean;
    lastCheck: Date;
  };
  cache: {
    totalKeys: number;
    memoryUsage: string;
  };
  processing: {
    totalProcessed: number;
    cacheHitRate: number;
    lastProcessed?: Date;
  };
}

export const TelegramApiStatus: React.FC = () => {
  const [status, setStatus] = useState<ServiceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      try {
        const serviceStatus = await telegramApiIntegration.getServiceStatus();
        setStatus(serviceStatus);
        setLastUpdate(new Date());
        console.log('✅ Service status loaded:', serviceStatus);
      } catch (statusError) {
        console.error('❌ Failed to load service status:', statusError);
        // Set default offline status
        setStatus({
          api: {
            healthy: false,
            upstash: false,
            lastCheck: new Date()
          },
          cache: {
            totalKeys: 0,
            memoryUsage: '0 MB'
          },
          processing: {
            totalProcessed: 0,
            cacheHitRate: 0
          }
        });
        throw statusError;
      }
    } catch (err) {
      console.error('❌ Service status error:', err);
      setError('Erro ao carregar dados do Telegram. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(loadStatus, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (healthy: boolean) => {
    if (healthy) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusBadge = (healthy: boolean, label: string) => {
    return (
      <Badge variant={healthy ? "default" : "destructive"} className="text-xs">
        {healthy ? `${label} OK` : `${label} Error`}
      </Badge>
    );
  };

  if (loading && !status) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 animate-spin" />
            Carregando status da API...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <AlertTriangle className="w-5 h-5" />
            Erro no Status da API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">{error}</p>
          <Button onClick={loadStatus} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Status da API Telegram
          </CardTitle>
          <Button onClick={loadStatus} variant="ghost" size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* API Health Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Server className="w-4 h-4" />
              Status da API
            </h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.api.healthy)}
                  <span className="text-sm">Serviço Principal</span>
                </div>
                {getStatusBadge(status.api.healthy, 'API')}
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status.api.upstash)}
                  <span className="text-sm">Cache Upstash</span>
                </div>
                {getStatusBadge(status.api.upstash, 'Cache')}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Database className="w-4 h-4" />
              Estatísticas do Cache
            </h4>
            
            <div className="space-y-2">
              <div className="flex justify-between p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">Total de Chaves</span>
                <span className="font-medium">{status.cache.totalKeys.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between p-3 border rounded-lg">
                <span className="text-sm text-muted-foreground">Uso de Memória</span>
                <span className="font-medium">{status.cache.memoryUsage}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Statistics */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Estatísticas de Processamento</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-primary">{status.processing.totalProcessed}</div>
              <div className="text-xs text-muted-foreground">Grupos Processados</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {status.processing.cacheHitRate.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Taxa de Cache Hit</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-sm font-medium">
                {status.processing.lastProcessed 
                  ? status.processing.lastProcessed.toLocaleString('pt-BR')
                  : 'Nunca'
                }
              </div>
              <div className="text-xs text-muted-foreground">Último Processamento</div>
            </div>
          </div>
        </div>

        {/* Last Update Info */}
        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
        </div>
      </CardContent>
    </Card>
  );
};