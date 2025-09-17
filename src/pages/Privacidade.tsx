import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Eye, Cookie, Database, Lock, UserCheck, Home } from "lucide-react";

const Privacidade = () => {
  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm">
              🔒 Política de Privacidade
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 font-heading">
              Política de 
              <span className="bg-gradient-to-r from-primary via-accent to-primary-light bg-clip-text text-transparent block mt-2">
                Privacidade
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Última atualização: {new Date('2025-01-15').toLocaleDateString('pt-BR')}
            </p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <Card className="p-8">
              <div className="flex items-start space-x-4 mb-6">
                <Shield className="w-8 h-8 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-4 font-heading">1. Introdução</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    No TopGrupos, levamos sua privacidade a sério. Esta política explica como coletamos, 
                    usamos, armazenamos e protegemos suas informações pessoais quando você usa nossa plataforma. 
                    Estamos comprometidos em ser transparentes sobre nossas práticas de dados.
                  </p>
                </div>
              </div>
            </Card>

            {/* Information We Collect */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading flex items-center">
                <Database className="w-6 h-6 mr-3 text-primary" />
                2. Informações que Coletamos
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">2.1 Informações Fornecidas por Você</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Nome e informações de contato quando você cadastra um grupo</li>
                    <li>Descrições e links de grupos que você submete</li>
                    <li>Mensagens enviadas através de nossos formulários de contato</li>
                    <li>Relatórios de conteúdo inadequado</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">2.2 Informações Coletadas Automaticamente</h3>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                    <li>Endereço IP e localização aproximada</li>
                    <li>Tipo de navegador e dispositivo</li>
                    <li>Páginas visitadas e tempo de permanência</li>
                    <li>Referências de sites (como você chegou até nós)</li>
                    <li>Dados de uso e navegação</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* How We Use Information */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading flex items-center">
                <Eye className="w-6 h-6 mr-3 text-primary" />
                3. Como Usamos suas Informações
              </h2>
              
              <div className="space-y-4">
                <p className="text-muted-foreground">Utilizamos suas informações para:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Fornecer e melhorar nossos serviços</li>
                  <li>Processar cadastros de grupos e verificar sua autenticidade</li>
                  <li>Responder a suas perguntas e solicitações de suporte</li>
                  <li>Analisar o uso da plataforma e identificar tendências</li>
                  <li>Detectar e prevenir atividades fraudulentas ou abusivas</li>
                  <li>Cumprir obrigações legais e regulamentares</li>
                  <li>Enviar notificações importantes sobre nossos serviços</li>
                </ul>
              </div>
            </Card>

            {/* Cookies */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading flex items-center">
                <Cookie className="w-6 h-6 mr-3 text-primary" />
                4. Cookies e Tecnologias Similares
              </h2>
              
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Cookies Essenciais</h4>
                    <p className="text-sm">Necessários para o funcionamento básico do site</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Cookies de Analytics</h4>
                    <p className="text-sm">Nos ajudam a entender como você usa nosso site</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Cookies de Preferências</h4>
                    <p className="text-sm">Lembram suas configurações e preferências</p>
                  </div>
                </div>
                
                <p>
                  Você pode controlar o uso de cookies através das configurações do seu navegador.
                </p>
              </div>
            </Card>

            {/* Information Sharing */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading">5. Compartilhamento de Informações</h2>
              
              <div className="space-y-4 text-muted-foreground">
                <p><strong className="text-foreground">Não vendemos seus dados pessoais.</strong></p>
                
                <p>Podemos compartilhar informações limitadas nas seguintes situações:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Com prestadores de serviços que nos ajudam a operar a plataforma</li>
                  <li>Quando exigido por lei ou autoridades competentes</li>
                  <li>Para proteger nossos direitos, propriedade ou segurança</li>
                  <li>Em caso de fusão, aquisição ou venda de ativos (com aviso prévio)</li>
                </ul>
              </div>
            </Card>

            {/* Data Security */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading flex items-center">
                <Lock className="w-6 h-6 mr-3 text-primary" />
                6. Segurança dos Dados
              </h2>
              
              <div className="space-y-4 text-muted-foreground">
                <p>Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Criptografia de dados em trânsito e em repouso</li>
                  <li>Controle de acesso restrito a informações pessoais</li>
                  <li>Monitoramento regular de atividades suspeitas</li>
                  <li>Backup seguro e redundância de dados</li>
                  <li>Treinamento regular da equipe sobre segurança</li>
                </ul>
                
                <p>
                  Embora nos esforcemos para proteger suas informações, nenhum sistema é 100% seguro. 
                  Recomendamos que você também tome precauções ao usar a internet.
                </p>
              </div>
            </Card>

            {/* Your Rights */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading flex items-center">
                <UserCheck className="w-6 h-6 mr-3 text-primary" />
                7. Seus Direitos
              </h2>
              
              <div className="space-y-4 text-muted-foreground">
                <p>Você tem os seguintes direitos em relação aos seus dados pessoais:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-foreground">Acesso:</strong> Solicitar uma cópia dos dados que temos sobre você</li>
                  <li><strong className="text-foreground">Retificação:</strong> Corrigir informações imprecisas ou incompletas</li>
                  <li><strong className="text-foreground">Exclusão:</strong> Solicitar a remoção de seus dados pessoais</li>
                  <li><strong className="text-foreground">Portabilidade:</strong> Receber seus dados em formato estruturado</li>
                  <li><strong className="text-foreground">Oposição:</strong> Opor-se ao processamento de seus dados</li>
                  <li><strong className="text-foreground">Limitação:</strong> Restringir o processamento em certas circunstâncias</li>
                </ul>
                
                <p>
                  Para exercer qualquer um desses direitos, entre em contato conosco através dos 
                  canais disponíveis em nossa página de contato.
                </p>
              </div>
            </Card>

            {/* Data Retention */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading">8. Retenção de Dados</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>Mantemos suas informações pessoais apenas pelo tempo necessário para:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Cumprir os propósitos para os quais foram coletadas</li>
                  <li>Atender a requisitos legais e regulamentares</li>
                  <li>Resolver disputas e fazer cumprir nossos termos</li>
                </ul>
                <p>
                  Quando não precisarmos mais de suas informações, elas serão excluídas 
                  de forma segura de nossos sistemas.
                </p>
              </div>
            </Card>

            {/* International Transfers */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading">9. Transferências Internacionais</h2>
              <p className="text-muted-foreground">
                Seus dados são processados principalmente no Brasil. Se houver necessidade de 
                transferir dados para outros países, garantiremos que existam salvaguardas 
                adequadas para proteger suas informações pessoais.
              </p>
            </Card>

            {/* Children's Privacy */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading">10. Privacidade de Menores</h2>
              <p className="text-muted-foreground">
                Nosso serviço não é direcionado a menores de 13 anos. Não coletamos 
                intencionalmente informações pessoais de crianças. Se tomarmos conhecimento 
                de que coletamos dados de uma criança, tomaremos medidas para excluir 
                essas informações imediatamente.
              </p>
            </Card>

            {/* Changes to Policy */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading">11. Alterações nesta Política</h2>
              <p className="text-muted-foreground">
                Podemos atualizar esta política periodicamente. Quando fizermos alterações 
                significativas, notificaremos você através de nossa plataforma ou por e-mail. 
                Recomendamos que você revise esta política regularmente.
              </p>
            </Card>

            {/* Contact */}
            <Card className="p-8 bg-gradient-to-r from-primary/10 via-accent/10 to-primary-light/10">
              <h2 className="text-2xl font-bold mb-6 font-heading">12. Contato</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Se você tiver dúvidas sobre esta política de privacidade ou quiser exercer 
                  seus direitos, entre em contato conosco:
                </p>
                <div className="space-y-2 text-sm">
                  <p>E-mail: privacidade@topgrupostele.com.br</p>
                  <p>WhatsApp: <Link to="/contato" className="text-primary hover:underline">(31) 99148-2323</Link></p>
                  <p>Página de contato: <Link to="/contato" className="text-primary hover:underline">topgrupostele.com.br/contato</Link></p>
                </div>
              </div>
            </Card>
          </div>

          {/* Back to Home Button */}
          <div className="text-center mt-12">
            <Button asChild variant="outline" size="lg">
              <Link to="/">
                <Home className="w-5 h-5 mr-2" />
                Voltar ao Início
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Privacidade;