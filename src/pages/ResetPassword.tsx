import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth } from "@/lib/firebase";
import { toast } from "@/components/ui/sonner";
import { Lock, ArrowLeft, CheckCircle } from "lucide-react";
import Footer from "@/components/Footer";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  useEffect(() => {
    const validateResetCode = async () => {
      if (!oobCode || mode !== 'resetPassword') {
        toast({
          title: "❌ Link inválido",
          description: "Este link de redefinição de senha é inválido ou expirou.",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      try {
        setIsValidating(true);
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setIsValidCode(true);
      } catch (error: any) {
        console.error('Reset code validation error:', error);
        let errorMessage = "Este link expirou ou é inválido.";
        
        if (error.code === 'auth/expired-action-code') {
          errorMessage = "Este link expirou. Solicite um novo link de redefinição.";
        } else if (error.code === 'auth/invalid-action-code') {
          errorMessage = "Este link é inválido. Verifique se você acessou o link correto.";
        }
        
        toast.error("❌ Link inválido", {
          description: errorMessage
        });
        navigate('/auth');
      } finally {
        setIsValidating(false);
      }
    };

    validateResetCode();
  }, [oobCode, mode, navigate, toast]);

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Senha inválida", {
        description: "A senha deve ter pelo menos 6 caracteres."
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Senhas não coincidem", {
        description: "A confirmação de senha deve ser igual à nova senha."
      });
      return;
    }

    if (!oobCode) return;

    setIsLoading(true);
    
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setIsSuccess(true);
      toast.success("✅ Senha alterada com sucesso!", {
        description: "Sua senha foi redefinida. Você já pode fazer login."
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      let errorMessage = "Erro ao redefinir senha. Tente novamente.";
      
      if (error.code === 'auth/weak-password') {
        errorMessage = "Senha muito fraca. Use uma senha mais forte.";
      } else if (error.code === 'auth/expired-action-code') {
        errorMessage = "Este link expirou. Solicite um novo link de redefinição.";
      }
      
      toast.error("Erro ao redefinir senha", {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Validando link de redefinição...</p>
        </div>
      </div>
    );
  }

  if (!isValidCode) {
    return null; // Will redirect in useEffect
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-card rounded-2xl p-8 shadow-lg border text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-4">
                Senha <span className="text-primary">Redefinida!</span>
              </h1>
              <p className="text-muted-foreground mb-6">
                Sua senha foi alterada com sucesso. Você já pode fazer login com sua nova senha.
              </p>
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full"
              >
                Fazer Login
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Back Button */}
          <Button 
            onClick={() => navigate('/auth')} 
            variant="ghost" 
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Login
          </Button>

          {/* Reset Password Card */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border">
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-3xl font-bold">
                Nova <span className="text-primary">Senha</span>
              </h1>
              <p className="text-muted-foreground">
                Defina uma nova senha para <strong>{email}</strong>
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-sm font-medium">
                  Nova senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  A senha deve ter pelo menos 6 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirmar nova senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleResetPassword}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                    Redefinindo...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Redefinir Senha
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPassword;