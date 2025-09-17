/**
 * Component for monitoring API integration health and cache status
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { telegramApiIntegration } from '@/services/telegramApiIntegration';
import { TelegramApiStatus } from '@/components/TelegramApiStatus';
import { 
  Activity, 
  Database, 
  RefreshCw, 
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface MonitorData {
  apiHealth: boolean;
  cacheHealth: boolean;
  totalKeys: number;
  memoryUsage: string;
  cacheHitRate: number;
  lastProcessed?: Date;
  upstashConnected: boolean;
}

export const ApiIntegrationMonitor: React.FC = () => {
  const [monitorData, setMonitorData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadMonitorData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const status = await telegramApiIntegration.getServiceStatus();
      try {
        const status = await telegramApiIntegration.getServiceStatus();
        setMonitorData({
          apiHealth: status.api.healthy,
          cacheHealth: status.api.upstash,
          totalKeys: status.cache.totalKeys,
          memoryUsage: status.cache.memoryUsage,
          cacheHitRate: status.processing.cacheHitRate,
          lastProcessed: status.processing.lastProcessed,
          upstashConnected: status.api.upstash
        });
      } catch (statusError) {
        console.error('❌ Failed to get service status:', statusError);
        // Set default values when Flask backend is unavailable
        setMonitorData({
          apiHealth: false,
          cacheHealth: false,
          totalKeys: 0,
          memoryUsage: '0 MB',
          cacheHitRate: 0,
          upstashConnected: false
        });
        throw new Error('Erro ao carregar dados do Telegram. Tente novamente.');
      }
      
    } catch (err) {
      console.error('❌ Failed to load monitor data:', err);
      setError('Erro ao carregar dados do Telegram. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitorData();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadMonitorData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getHealthIcon = (healthy: boolean) => {
    return healthy ? (
      <CheckCircle2 className="w-4 h-4 text-green-600" />
    ) : (
      <AlertCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getHealthBadge = (healthy: boolean) => {
    return (
      <Badge variant={healthy ? "default" : "destructive"} className="text-xs">
        {healthy ? "Saudável" : "Problema"}
      </Badge>
    );
  };

  if (loading && !monitorData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 animate-spin" />
            Carregando monitor da API...
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
            <AlertCircle className="w-5 h-5" />
            Erro no Monitor da API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700 dark:text-red-300 mb-4">{error}</p>
          <Button onClick={loadMonitorData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!monitorData) return null;

  return (
    <div className="space-y-6">
      {/* Main Status Overview */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Monitor de Integração da API
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? "text-green-600" : "text-muted-foreground"}
              >
                <Activity className={`w-4 h-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
              </Button>
              <Button onClick={loadMonitorData} variant="ghost" size="sm" disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Health Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Status dos Serviços
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getHealthIcon(monitorData.apiHealth)}
                    <span className="text-sm">API Principal</span>
                  </div>
                  {getHealthBadge(monitorData.apiHealth)}
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getHealthIcon(monitorData.upstashConnected)}
                    <span className="text-sm">Cache Upstash</span>
                  </div>
                  {getHealthBadge(monitorData.upstashConnected)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                Cache Eterno
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between p-3 border rounded-lg">
                  <span className="text-sm text-muted-foreground">Total de Chaves</span>
                  <span className="font-medium">{monitorData.totalKeys.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between p-3 border rounded-lg">
                  <span className="text-sm text-muted-foreground">Uso de Memória</span>
                  <span className="font-medium">{monitorData.memoryUsage}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Performance do Cache
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Taxa de Cache Hit</span>
                  <span className="font-medium">{monitorData.cacheHitRate.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={monitorData.cacheHitRate} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {monitorData.cacheHitRate >= 80 ? 
                    '✅ Excelente eficiência de cache' : 
                    monitorData.cacheHitRate >= 60 ? 
                    '⚠️ Cache moderadamente eficiente' : 
                    '❌ Cache pouco eficiente'
                  }
                </p>
              </div>
              
              {monitorData.lastProcessed && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    Último processamento: {monitorData.lastProcessed.toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cache Rules Reminder */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Regras de Cache Ativas
            </h5>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Cache eterno (sem TTL) para todos os dados</li>
              <li>• Reprocessamento apenas se content_hash ou image_hash mudaram</li>
              <li>• Validação de imagens respeitando is_generic e is_valid</li>
              <li>• URLs completas sempre enviadas para a API</li>
              <li>• Confiança total no from_cache = true</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Detailed API Status */}
      <TelegramApiStatus />
    </div>
  );
};