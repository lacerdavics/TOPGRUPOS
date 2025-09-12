import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getMemoryUsage, getCacheSize, getNetworkSpeed } from '@/utils/performanceUtils';
import { enhancedImageCacheService } from '@/services/enhancedImageCacheService';
import { Activity, HardDrive, Wifi, Image, RefreshCw } from 'lucide-react';

const PerformanceMonitor: React.FC = () => {
  const [memoryUsage, setMemoryUsage] = useState<any>(null);
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [networkSpeed, setNetworkSpeed] = useState<string>('unknown');
  const [imageCacheStats, setImageCacheStats] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  const updateStats = async () => {
    setMemoryUsage(getMemoryUsage());
    setCacheSize(await getCacheSize());
    setNetworkSpeed(getNetworkSpeed());
    setImageCacheStats(enhancedImageCacheService.getCacheStats());
  };

  useEffect(() => {
    updateStats();
    
    // Update stats every 10 seconds when visible
    let interval: NodeJS.Timeout;
    if (isVisible) {
      interval = setInterval(updateStats, 10000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible]);

  // Show only in development or for admin users
  if (process.env.NODE_ENV !== 'development' && !isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100"
      >
        <Activity className="w-4 h-4" />
      </Button>
    );
  }

  const getPerformanceBadgeColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 max-h-96 overflow-y-auto">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Performance Monitor
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={updateStats}
              className="p-1 h-6 w-6"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="p-1 h-6 w-6"
            >
              ×
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 text-xs">
        {/* Memory Usage */}
        {memoryUsage && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                Memória JS
              </span>
              <Badge 
                variant="secondary" 
                className={`text-xs ${getPerformanceBadgeColor(parseFloat(memoryUsage.percentageUsed))}`}
              >
                {memoryUsage.percentageUsed}%
              </Badge>
            </div>
            <div className="text-muted-foreground">
              {(memoryUsage.usedJSMemorySize / 1024 / 1024).toFixed(1)} MB / 
              {(memoryUsage.jsMemoryLimit / 1024 / 1024).toFixed(1)} MB
            </div>
          </div>
        )}

        {/* Network Speed */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              Conexão
            </span>
            <Badge variant="outline" className="text-xs">
              {networkSpeed.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Image Cache */}
        {imageCacheStats && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Image className="w-3 h-3" />
                Cache Imagens
              </span>
              <Badge variant="secondary" className="text-xs">
                {imageCacheStats.size} items
              </Badge>
            </div>
            <div className="text-muted-foreground">
              {imageCacheStats.memoryUsage} • Mais antigo: {imageCacheStats.oldestEntry}
            </div>
          </div>
        )}

        {/* Browser Cache */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              Cache Browser
            </span>
            <Badge variant="outline" className="text-xs">
              {(cacheSize / 1024 / 1024).toFixed(1)} MB
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              enhancedImageCacheService.clearCache();
              updateStats();
            }}
            className="w-full h-7 text-xs"
          >
            Limpar Cache de Imagens
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;