import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Calendar, AlertTriangle, CheckCircle, ArrowLeft } from "lucide-react";

const AgeVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isConfirming, setIsConfirming] = useState(false);
  
  const redirectTo = searchParams.get('redirect') || '/categoria/adulto';

  const handleConfirmAge = () => {
    setIsConfirming(true);
    
    // Salvar confirmação no localStorage
    localStorage.setItem('age_verified', 'true');
    localStorage.setItem('age_verified_date', new Date().toISOString());
    
    // Pequeno delay para feedback visual
    setTimeout(() => {
      navigate(redirectTo);
    }, 1000);
  };

  const handleDeny = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Início
        </Button>

        <Card className="shadow-2xl border-border/50 bg-card/95 backdrop-blur-sm">
          <div className="p-8 text-center space-y-6">
            {/* Icon */}
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <div className="space-y-3">
              <Badge variant="outline" className="px-4 py-2 text-sm border-amber-500/30 text-amber-700 dark:text-amber-300">
                🔞 Verificação de Idade
              </Badge>
              
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Conteúdo para Maiores de 18 Anos
              </h1>
              
              <p className="text-muted-foreground leading-relaxed">
                Esta categoria contém conteúdo destinado exclusivamente para pessoas maiores de 18 anos.
              </p>
            </div>

            {/* Warning */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200 text-left">
                  <p className="font-semibold mb-2">⚠️ Aviso Legal</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Conteúdo restrito para maiores de 18 anos</li>
                    <li>• Ao prosseguir, você confirma ter idade legal</li>
                    <li>• Esta verificação é obrigatória por lei</li>
                    <li>• Menores de idade devem sair desta página</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Age Question */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Você tem 18 anos ou mais?</span>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Esta verificação será solicitada apenas uma vez
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={handleConfirmAge}
                disabled={isConfirming}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isConfirming ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Sim, tenho 18 anos ou mais
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleDeny}
                variant="outline"
                disabled={isConfirming}
                className="w-full h-12 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-semibold"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Não, sou menor de 18 anos
              </Button>
            </div>

            {/* Legal Notice */}
            <div className="pt-4 border-t border-border/30">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ao confirmar sua idade, você declara estar ciente de que o conteúdo pode incluir 
                material adulto e assume total responsabilidade pelo acesso. Esta plataforma 
                não se responsabiliza pelo conteúdo dos grupos listados.
              </p>
            </div>
          </div>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            TopGrupos • Verificação de idade conforme legislação brasileira
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgeVerification;