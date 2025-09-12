import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCloudflareStatus } from '@/hooks/useCloudflareOptimization';
import { Zap, Shield, Globe, Settings } from 'lucide-react';

export const CloudflareStatus: React.FC = () => {
  const { enabled, configured, proxies, configure } = useCloudflareStatus();
  const [showConfig, setShowConfig] = React.useState(false);
  const [config, setConfig] = React.useState({
    apiToken: '',
    zoneId: '',
    imageDeliveryUrl: '',
    enableOptimization: enabled
  });

  const handleSave = () => {
    configure(config);
    setShowConfig(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Cloudflare Integration Status
          </CardTitle>
          <CardDescription>
            Monitor and configure Cloudflare optimization services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Optimization</span>
              </div>
              <Badge variant={enabled ? "default" : "secondary"}>
                {enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">API Config</span>
              </div>
              <Badge variant={configured ? "default" : "outline"}>
                {configured ? "Configured" : "Basic"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">Proxies</span>
              </div>
              <Badge variant="outline">
                {proxies} Available
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => configure({ enableOptimization: !enabled })}
            >
              {enabled ? "Disable" : "Enable"} Optimization
            </Button>
          </div>

          {showConfig && (
            <div className="mt-4 p-4 border rounded-lg space-y-4">
              <h4 className="font-medium">Cloudflare Configuration</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiToken">API Token (Optional)</Label>
                  <Input
                    id="apiToken"
                    type="password"
                    placeholder="Your Cloudflare API token"
                    value={config.apiToken}
                    onChange={(e) => setConfig({...config, apiToken: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zoneId">Zone ID (Optional)</Label>
                  <Input
                    id="zoneId"
                    placeholder="Your Cloudflare Zone ID"
                    value={config.zoneId}
                    onChange={(e) => setConfig({...config, zoneId: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="imageDeliveryUrl">Image Delivery URL (Optional)</Label>
                  <Input
                    id="imageDeliveryUrl"
                    placeholder="https://imagedelivery.net or your custom URL"
                    value={config.imageDeliveryUrl}
                    onChange={(e) => setConfig({...config, imageDeliveryUrl: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">
                  Save Configuration
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfig(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};