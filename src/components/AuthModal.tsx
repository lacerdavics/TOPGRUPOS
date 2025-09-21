import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, UserPlus, LogIn } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AuthModal = ({ open, onOpenChange, onSuccess }: AuthModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const { login, register, resetPassword } = useAuth();

  const handleSubmit = async (isLogin: boolean) => {
    if (!email || !password) {
      toast.error("Campos obrigatórios", {
        description: "Por favor, preencha email e senha."
      });
      return;
    }

    setIsLoading(true);
    
    console.log('🔵 AuthModal: Attempting', isLogin ? 'login' : 'register', 'with email:', email);
    console.log('🔵 AuthModal: Password length:', password.length);
    
    try {
      if (isLogin) {
        console.log('🔵 AuthModal: Calling login function...');
        await login(email, password);
        console.log('🟢 AuthModal: Login successful');
        toast.success("Login realizado com sucesso!", {
          description: "Bem-vindo de volta!"
        });
      } else {
        console.log('🔵 AuthModal: Calling register function...');
        await register(email, password);
        console.log('🟢 AuthModal: Register successful');
        toast.success("Conta criada com sucesso!", {
          description: "Você já pode cadastrar seus grupos!"
        });
      }
      
      setEmail("");
      setPassword("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('🔴 AuthModal: Authentication error:', error);
      console.error('🔴 AuthModal: Error code:', error.code);
      console.error('🔴 AuthModal: Error message:', error.message);
      
      let errorMessage = "Tente novamente em alguns instantes.";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email já está em uso.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "A senha deve ter pelo menos 6 caracteres.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido.";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "Usuário não encontrado. Tente criar uma conta.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Senha incorreta.";
      } else if (error.code === "auth/invalid-login-credentials" || error.code === "auth/invalid-credential") {
        errorMessage = "Email ou senha incorretos. Verifique suas credenciais ou crie uma conta.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "⏱️ Limite de tentativas atingido. Aguarde alguns minutos ou redefina sua senha para acesso imediato.";
      }
      
      toast.error("Erro na autenticação", {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast.error("Email obrigatório", {
        description: "Por favor, informe seu email para recuperar a senha."
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await resetPassword(resetEmail);
      toast.success("Email enviado!", {
        description: "Verifique sua caixa de entrada para redefinir sua senha."
      });
      setResetEmail("");
      setIsResetMode(false);
    } catch (error: any) {
      console.error('🔴 AuthModal: Reset password error:', error);
      
      let errorMessage = "Tente novamente em alguns instantes.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "Não encontramos uma conta com este email.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Email inválido.";
      }
      
      toast.error("Erro ao enviar email", {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-md lg:max-w-lg mx-auto">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-xl sm:text-2xl">
              Acesse sua <span className="text-primary">Conta</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Entre com sua conta ou crie uma nova para cadastrar grupos
            </DialogDescription>
          </DialogHeader>
        
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-10 sm:h-11">
              <TabsTrigger value="login" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Entrar</span>
                <span className="sm:hidden">Login</span>
              </TabsTrigger>
              <TabsTrigger value="register" className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Criar Conta</span>
                <span className="sm:hidden">Registro</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 sm:h-11"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10 sm:h-11"
                  />
                </div>
              </div>
              
              <Button 
                onClick={() => handleSubmit(true)}
                className="w-full h-10 sm:h-11 text-sm sm:text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsResetMode(true)}
                  className="text-sm text-primary hover:underline transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 sm:h-11"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10 sm:h-11"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  A senha deve ter pelo menos 6 caracteres
                </p>
              </div>
              
              <Button 
                onClick={() => handleSubmit(false)}
                className="w-full h-10 sm:h-11 text-sm sm:text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Criar Conta
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modal de Recuperação de Senha */}
      <Dialog open={isResetMode} onOpenChange={setIsResetMode}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-md lg:max-w-lg mx-auto">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-xl sm:text-2xl">
              Recuperar <span className="text-primary">Senha</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Digite seu email para receber um link de recuperação de senha
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-10 h-10 sm:h-11"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                variant="outline"
                onClick={() => setIsResetMode(false)}
                className="w-full sm:flex-1 order-2 sm:order-1 h-10 sm:h-11 text-sm sm:text-base"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleResetPassword}
                className="w-full sm:flex-1 order-1 sm:order-2 h-10 sm:h-11 text-sm sm:text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthModal;