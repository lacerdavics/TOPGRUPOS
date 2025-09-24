import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, UserPlus, LogIn, ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const { login, register, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const handleSubmit = async (isLogin: boolean) => {
    if (!email || !password) {
      toast.error("Campos obrigatórios", {
        description: "Por favor, preencha email e senha."
      });
      return;
    }

    setIsLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
        toast.success("✅ Login realizado com sucesso!", {
          description: "Bem-vindo de volta! Redirecionando..."
        });
      } else {
        await register(email, password);
        toast.success("✅ Conta criada e login automático!", {
          description: "Sua conta foi criada e você já está logado!"
        });
      }
      
      setEmail("");
      setPassword("");
      navigate(redirectTo);
    } catch (error: any) {
      console.log('📢 Toast: Erro capturado, vai mostrar toast...');
      let errorMessage = "Tente novamente em alguns instantes.";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "❌ Este email já está em uso! Tente fazer login ou use outro email.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "❌ Senha muito fraca! Use pelo menos 6 caracteres.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "❌ Email inválido! Verifique o formato do email.";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "❌ Conta não encontrada! Você precisa criar uma conta primeiro.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "❌ Senha incorreta! Verifique sua senha e tente novamente.";
      } else if (error.code === "auth/invalid-login-credentials" || error.code === "auth/invalid-credential") {
        errorMessage = "❌ Email ou senha incorretos! Se não tem conta, crie uma na aba 'Criar Conta'.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "⏱️ Limite de tentativas atingido. Aguarde alguns minutos ou redefina sua senha para acesso imediato.";
      }
      
      toast.error("❌ Erro na autenticação", {
        description: errorMessage
      });
      console.log('📢 Toast: Toast chamado com:', errorMessage);
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
      toast.success("✅ Email enviado com sucesso!", {
        description: "Verifique sua caixa de entrada para redefinir sua senha."
      });
      setResetEmail("");
      setIsResetMode(false);
    } catch (error: any) {
      let errorMessage = "Tente novamente em alguns instantes.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "❌ Conta não encontrada! Verifique o email digitado.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "❌ Email inválido! Verifique o formato do email.";
      }
      
      toast.error("Erro ao enviar email", {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isResetMode) {
    return (
      <div className="min-h-screen bg-background">
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            {/* Back Button */}
            <Button 
              onClick={() => setIsResetMode(false)} 
              variant="ghost" 
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            {/* Reset Password Card */}
            <div className="bg-card rounded-2xl p-8 shadow-lg border">
              <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-bold">
                  Recuperar <span className="text-primary">Senha</span>
                </h1>
                <p className="text-muted-foreground">
                  Digite seu email para receber um link de recuperação de senha
                </p>
              </div>
              
              <div className="space-y-6">
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
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => setIsResetMode(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleResetPassword}
                    className="flex-1"
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
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-8 mt-16">
        <div className="max-w-md mx-auto">
          {/* Back Button */}
          <Button 
            onClick={() => {
              const redirect = searchParams.get('redirect');
              if (redirect) {
                navigate('/');
              } else {
                navigate('/');
              }
            }} 
            variant="ghost" 
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {/* Auth Card */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border">
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-3xl font-bold">
                Acesse sua <span className="text-primary">Conta</span>
              </h1>
              <p className="text-muted-foreground">
                Entre com sua conta ou crie uma nova para cadastrar grupos
              </p>
            </div>
          
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Criar Conta
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-6">
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
                      className="pl-10"
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
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleSubmit(true)}
                  className="w-full"
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
              
              <TabsContent value="register" className="space-y-4 mt-6">
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
                      className="pl-10"
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
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A senha deve ter pelo menos 6 caracteres
                  </p>
                </div>
                
                <Button 
                  onClick={() => handleSubmit(false)}
                  className="w-full"
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
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;