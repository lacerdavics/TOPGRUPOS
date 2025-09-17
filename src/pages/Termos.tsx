import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ScrollText, Shield, AlertTriangle, Info, Home } from "lucide-react";

const Termos = () => {
  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm">
              📋 Termos de Uso
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 font-heading">
              Termos de 
              <span className="bg-gradient-to-r from-primary via-accent to-primary-light bg-clip-text text-transparent block mt-2">
                Uso
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
                <ScrollText className="w-8 h-8 text-primary mt-1" />
                <div>
                  <h2 className="text-2xl font-bold mb-4 font-heading">1. Introdução</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Bem-vindo ao TopGrupos! Estes termos de uso governam seu acesso e uso de nossa plataforma. 
                    Ao acessar ou usar nosso serviço, você concorda em estar vinculado a estes termos. 
                    Se você não concordar com alguma parte destes termos, não poderá acessar o serviço.
                  </p>
                </div>
              </div>
            </Card>

            {/* Definitions */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading flex items-center">
                <Info className="w-6 h-6 mr-3 text-primary" />
                2. Definições
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <strong className="text-foreground">Plataforma:</strong> O website TopGrupos e todos os seus serviços relacionados.
                </div>
                <div>
                  <strong className="text-foreground">Usuário:</strong> Qualquer pessoa que acessa ou usa nossa plataforma.
                </div>
                <div>
                  <strong className="text-foreground">Conteúdo:</strong> Informações, textos, imagens, links e outros materiais disponíveis na plataforma.
                </div>
                <div>
                  <strong className="text-foreground">Grupos:</strong> Comunidades do Telegram listadas em nossa plataforma.
                </div>
              </div>
            </Card>

            {/* Usage Rules */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading flex items-center">
                <Shield className="w-6 h-6 mr-3 text-primary" />
                3. Uso Permitido
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">Você pode usar nossa plataforma para:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Descobrir e explorar grupos do Telegram</li>
                  <li>Cadastrar grupos legítimos e ativos</li>
                  <li>Buscar comunidades por categoria ou interesse</li>
                  <li>Compartilhar nossa plataforma com outros usuários</li>
                  <li>Reportar conteúdo inadequado ou grupos inativos</li>
                </ul>
              </div>
            </Card>

            {/* Prohibited Uses */}
            <Card className="p-8 border-destructive/20">
              <h2 className="text-2xl font-bold mb-6 font-heading flex items-center">
                <AlertTriangle className="w-6 h-6 mr-3 text-destructive" />
                4. Uso Proibido
              </h2>
              <div className="space-y-4">
                <p className="text-muted-foreground">É estritamente proibido:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong className="text-destructive">Pornografia infantil ou qualquer conteúdo envolvendo menores</strong> - Crime previsto no Art. 241-A do ECA (Lei 8.069/90)</li>
                  <li><strong className="text-destructive">Grupos de golpes, fraudes ou esquemas pirâmides</strong> - Condutas tipificadas no Código Penal Brasileiro</li>
                  <li><strong className="text-destructive">Conteúdo que lese, prejudique ou cause danos a outros usuários</strong></li>
                  <li>Cadastrar grupos com conteúdo ilegal, ofensivo ou inadequado</li>
                  <li>Fazer spam ou enviar informações falsas</li>
                  <li>Tentar hackear, comprometer ou danificar nossa plataforma</li>
                  <li>Usar bots ou scripts automatizados sem autorização</li>
                  <li>Violar direitos autorais ou propriedade intelectual</li>
                  <li>Cadastrar grupos inativos ou com links quebrados</li>
                  <li>Usar a plataforma para atividades comerciais não autorizadas</li>
                </ul>
                <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-foreground font-semibold mb-2">⚠️ Denuncie Violações:</p>
                  <p className="text-sm text-muted-foreground">
                    Qualquer grupo que viole estes termos deve ser denunciado através do botão "Denunciar" 
                    disponível em cada grupo. Sua denúncia nos ajuda a manter a plataforma segura para todos.
                  </p>
                </div>
              </div>
            </Card>

            {/* Content Responsibility */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading">5. Responsabilidade pelo Conteúdo</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  O TopGrupos atua como uma plataforma de descoberta de grupos do Telegram. 
                  Não somos responsáveis pelo conteúdo, atividades ou políticas dos grupos listados.
                </p>
                <p>
                  Cada usuário é responsável por verificar a adequação e legalidade dos 
                  grupos antes de participar. Recomendamos cautela ao compartilhar 
                  informações pessoais em qualquer grupo.
                </p>
                <p>
                  Reservamo-nos o direito de remover qualquer grupo que viole nossas 
                  diretrizes ou receba relatórios de usuários.
                </p>
              </div>
            </Card>

            {/* Privacy */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading">6. Privacidade</h2>
              <p className="text-muted-foreground">
                 Sua privacidade é importante para nós. Consulte nossa 
                <Link to="/privacidade" className="text-primary hover:underline ml-1">
                  Política de Privacidade
                </Link> para entender como coletamos, usamos e protegemos suas informações.
              </p>
            </Card>

            {/* Modifications */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading">7. Modificações</h2>
              <p className="text-muted-foreground">
                Reservamos o direito de modificar estes termos a qualquer momento. 
                As alterações entrarão em vigor imediatamente após a publicação. 
                É sua responsabilidade revisar estes termos periodicamente.
              </p>
            </Card>

            {/* Termination */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading">8. Encerramento</h2>
              <p className="text-muted-foreground">
                Podemos suspender ou encerrar seu acesso à plataforma a qualquer momento, 
                sem aviso prévio, se você violar estes termos ou se considerarmos 
                necessário para proteger nossos usuários ou serviços.
              </p>
            </Card>

            {/* Disclaimer */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading">9. Isenção de Responsabilidade</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  A plataforma é fornecida "como está" sem garantias de qualquer tipo. 
                  Não garantimos que o serviço será ininterrupto, seguro ou livre de erros.
                </p>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                    ⚠️ Importante - Responsabilidade Limitada:
                  </p>
                  <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
                    <li>• <strong>Não nos responsabilizamos por danos financeiros</strong> decorrentes de participação em grupos</li>
                    <li>• <strong>Não nos responsabilizamos por danos morais</strong> causados por interações em grupos</li>
                    <li>• <strong>A responsabilidade é exclusiva dos administradores e membros de cada grupo</strong></li>
                    <li>• Não somos responsáveis por golpes, fraudes ou prejuízos financeiros</li>
                    <li>• Cada usuário deve exercer seu próprio julgamento ao participar de grupos</li>
                  </ul>
                </div>
                <p>
                  Não somos responsáveis por danos diretos, indiretos, incidentais ou 
                  consequenciais resultantes do uso de nossa plataforma ou da participação 
                  em grupos listados.
                </p>
              </div>
            </Card>

            {/* Governing Law */}
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6 font-heading">10. Lei Aplicável</h2>
              <p className="text-muted-foreground">
                Estes termos são regidos pelas leis brasileiras. Qualquer disputa 
                será resolvida nos tribunais competentes do Brasil.
              </p>
            </Card>

            {/* Contact */}
            <Card className="p-8 bg-gradient-to-r from-primary/10 via-accent/10 to-primary-light/10">
              <h2 className="text-2xl font-bold mb-6 font-heading">11. Contato</h2>
              <p className="text-muted-foreground mb-4">
                Se você tiver dúvidas sobre estes termos, entre em contato conosco:
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>E-mail: contato@topgrupos.com</p>
                <p>WhatsApp: <Link to="/contato" className="text-primary hover:underline">(31) 99148-2323</Link></p>
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

export default Termos;