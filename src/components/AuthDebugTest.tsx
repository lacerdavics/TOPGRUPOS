import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useMobileToast } from "@/hooks/useMobileToast";

const AuthDebugTest = () => {
  const [testing, setTesting] = useState(false);
  const { register, login } = useAuth();
  const { toast } = useMobileToast();

  const testEmail = "test@example.com";
  const testPassword = "123456";

  const runAuthTest = async () => {
    setTesting(true);
    
    try {
      console.log('🧪 Starting auth test...');
      
      // First, try to create a test account
      console.log('🧪 Attempting to create test account...');
      await register(testEmail, testPassword);
      console.log('🟢 Test account created successfully');
      
      toast({
        title: "Teste de Autenticação",
        description: "Conta de teste criada com sucesso! A autenticação está funcionando.",
      });
      
    } catch (error: any) {
      console.error('🔴 Auth test error:', error);
      
      if (error.code === "auth/email-already-in-use") {
        // If account exists, try to login
        console.log('🧪 Account exists, trying login...');
        try {
          await login(testEmail, testPassword);
          console.log('🟢 Test login successful');
          
          toast({
            title: "Teste de Autenticação",
            description: "Login de teste realizado com sucesso! A autenticação está funcionando.",
          });
        } catch (loginError: any) {
          console.error('🔴 Test login failed:', loginError);
          toast({
            title: "Erro no Teste",
            description: `Falha no login de teste: ${loginError.message}`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Erro no Teste",
          description: `Falha na criação de conta: ${error.message}`,
          variant: "destructive",
        });
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-sm">🔧 Debug de Autenticação</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-4">
          Este teste verifica se a autenticação Firebase está funcionando corretamente.
        </p>
        <Button 
          onClick={runAuthTest}
          disabled={testing}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {testing ? "Testando..." : "Executar Teste de Auth"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AuthDebugTest;