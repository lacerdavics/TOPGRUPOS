import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Users, CheckCircle } from "lucide-react";
import { Group } from "@/components/GroupCard";
import { useToast } from "@/hooks/use-toast";
import { usePromotionPlans } from "@/hooks/usePromotionPlans";

interface PaymentDisplayProps {
  selectedGroup: Group;
  selectedPlanId: string;
  onBack: () => void;
  qrCode?: string;
  pixCode?: string;
  onPaymentGenerated?: (qrCode: string, pixCode: string) => void;
}

const PaymentDisplay = ({ 
  selectedGroup, 
  selectedPlanId, 
  onBack, 
  qrCode: initialQrCode, 
  pixCode: initialPixCode,
  onPaymentGenerated 
}: PaymentDisplayProps) => {
  const { toast } = useToast();
  const { promoteGroup, plans } = usePromotionPlans();
  const [qrCode, setQrCode] = useState(initialQrCode || '');
  const [pixCode, setPixCode] = useState(initialPixCode || '');
  const [loading, setLoading] = useState(false);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  useEffect(() => {
    if (!qrCode && !pixCode) {
      generatePayment();
    }
  }, []);

  const generatePayment = async () => {
    setLoading(true);
    try {
      const result = await promoteGroup(selectedPlanId, selectedGroup);
      
      if (result.success && result.qrCode && result.pixCode) {
        setQrCode(result.qrCode);
        setPixCode(result.pixCode);
        onPaymentGenerated?.(result.qrCode, result.pixCode);
        toast({
          title: "QR Code gerado com sucesso!",
          description: `Plano ${selectedPlan?.name} selecionado para o grupo "${selectedGroup.name}".`,
        });
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao processar promoção. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (pixCode) {
      try {
        await navigator.clipboard.writeText(pixCode);
        toast({
          title: "Código copiado!",
          description: "O código PIX foi copiado para a área de transferência.",
        });
      } catch (error) {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o código PIX. Tente novamente.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar aos planos
        </Button>
        
        <h1 className="text-3xl font-bold mb-4">Pagamento PIX - {selectedPlan?.name}</h1>
        
        {/* Selected Group Display */}
        <div className="bg-card p-4 rounded-xl border border-border/50 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
              {selectedGroup.profileImage ? (
                <img 
                  src={selectedGroup.profileImage} 
                  alt={selectedGroup.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{selectedGroup.name}</h3>
                <Badge variant="secondary">{selectedGroup.category}</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Grupo selecionado para promoção
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      <div className="max-w-md mx-auto">
        <div className="bg-card p-8 rounded-2xl border border-border shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-foreground text-center">Pague com PIX</h3>
          
          {/* QR Code Image */}
          <div className="bg-white p-4 rounded-xl mb-6 text-center">
            {loading ? (
              <div className="w-48 h-48 mx-auto flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
              </div>
            ) : qrCode ? (
              <img 
                src={qrCode} 
                alt="QR Code PIX" 
                className="w-48 h-48 mx-auto"
                onLoad={() => console.log('QR Code image loaded successfully')}
                onError={(e) => console.error('QR Code image failed to load:', e)}
              />
            ) : (
              <div className="w-48 h-48 mx-auto flex items-center justify-center text-muted-foreground">
                Gerando QR Code...
              </div>
            )}
          </div>
          
          {/* Instructions */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-4 text-center">
              <strong>Como pagar:</strong>
            </p>
            <div className="text-left text-sm text-muted-foreground space-y-2 bg-muted/50 p-4 rounded-lg">
              <p><strong>Opção 1:</strong> Escaneie o QR Code com o app do seu banco</p>
              <p><strong>Opção 2:</strong> Copie e cole o código PIX abaixo</p>
            </div>
          </div>

          {/* PIX Code Copy Section */}
          {pixCode && (
            <div className="mb-6">
              <div className="bg-muted/30 p-3 rounded-lg border">
                <p className="text-xs font-mono break-all text-left select-all">
                  {pixCode}
                </p>
              </div>
              <Button 
                onClick={copyPixCode}
                className="mt-3 w-full"
                variant="default"
              >
                📋 Copiar Código PIX
              </Button>
            </div>
          )}

          {/* Success Instructions */}
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-success mb-1">Após o pagamento:</p>
                <p className="text-muted-foreground">
                  Seu grupo será automaticamente promovido e ficará em destaque na categoria "{selectedGroup.category}" 
                  e na página inicial da plataforma.
                </p>
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            onClick={onBack}
            className="w-full"
            disabled={loading}
          >
            Voltar à seleção de grupos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDisplay;