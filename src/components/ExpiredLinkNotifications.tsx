import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserNotifications, markNotificationAsSent, type ExpiredLinkNotification } from '@/services/expiredLinkNotificationService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, X, Clock } from 'lucide-react';
import { toast } from 'sonner';

export const ExpiredLinkNotifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<ExpiredLinkNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.uid) {
      loadNotifications();
    }
  }, [currentUser?.uid]);

  const loadNotifications = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      const userNotifications = await getUserNotifications(currentUser.uid);
      // Mostrar apenas notificações não lidas dos últimos 30 dias
      const recentNotifications = userNotifications.filter(notif => {
        const daysDiff = (Date.now() - notif.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return !notif.notified && daysDiff <= 30;
      });
      setNotifications(recentNotifications);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    if (!notificationId) return;
    
    try {
      setDismissing(notificationId);
      await markNotificationAsSent(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notificação marcada como lida');
    } catch (error) {
      console.error('Erro ao dispensar notificação:', error);
      toast.error('Erro ao dispensar notificação');
    } finally {
      setDismissing(null);
    }
  };

  if (loading || notifications.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        Links Expirados Detectados
      </h3>
      
      {notifications.map((notification) => (
        <Card key={notification.id} className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-base">Aviso do Sistema Anterior</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => notification.id && dismissNotification(notification.id)}
                disabled={dismissing === notification.id}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="mb-3">
              O grupo <strong>"{notification.groupName}"</strong> foi sinalizado pelo sistema anterior 
              de verificação que era muito restritivo. <strong>Esta verificação foi desabilitada</strong> 
              e não afeta mais novos cadastros.
            </CardDescription>
            
            <div className="bg-card/80 rounded-lg p-3 mb-3 border border-border/50">
              <p className="text-sm text-muted-foreground mb-1">Link que foi sinalizado:</p>
              <code className="text-xs bg-muted px-2 py-1 rounded break-all border border-border/50">
                {notification.telegramUrl}
              </code>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Sinalizado em {notification.createdAt.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            <Alert className="mt-3 border-green-200 bg-green-50 dark:bg-green-950/20">
              <AlertDescription className="text-sm">
                <strong>✅ Sistema Corrigido:</strong> A verificação excessivamente restritiva foi removida. 
                Novos grupos não receberão mais estes avisos desnecessários. Você pode dispensar esta notificação.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
