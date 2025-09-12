import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Users, Target, Shield, Heart, Home } from "lucide-react";

const logo = "/lovable-uploads/b0f3f9b9-09e8-4981-b31b-28d97801c974.png";

const Sobre = () => {
  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-primary/20 shadow-lg">
                <img src={logo} alt="TopGrupos Logo" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm">
              🚀 Sobre Nós
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 font-heading">
              Conectando Pessoas através do 
              <span className="bg-gradient-to-r from-primary via-accent to-primary-light bg-clip-text text-transparent block mt-2">
                Telegram
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              O TopGrupos é a maior plataforma para descobrir e conectar-se com comunidades incríveis no Telegram.
            </p>
          </div>

          {/* Mission Section */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="p-8 border-primary/20">
              <Target className="w-12 h-12 text-primary mb-6" />
              <h3 className="text-2xl font-bold mb-4 font-heading">Nossa Missão</h3>
              <p className="text-muted-foreground leading-relaxed">
                Facilitar a descoberta de grupos e comunidades relevantes no Telegram, 
                conectando pessoas com interesses similares e promovendo a formação de 
                redes sociais significativas.
              </p>
            </Card>

            <Card className="p-8 border-accent/20">
              <Heart className="w-12 h-12 text-accent mb-6" />
              <h3 className="text-2xl font-bold mb-4 font-heading">Nossa Visão</h3>
              <p className="text-muted-foreground leading-relaxed">
                Ser a principal referência na descoberta de comunidades digitais, 
                criando um ecossistema onde cada pessoa encontre seu lugar e 
                construa conexões duradouras.
              </p>
            </Card>
          </div>

          {/* Features */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12 font-heading">
              O que fazemos
            </h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Users className="w-10 h-10 text-primary mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Curadoria de Grupos</h4>
                <p className="text-sm text-muted-foreground">
                  Selecionamos e organizamos os melhores grupos por categoria
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Verificação de Qualidade</h4>
                <p className="text-sm text-muted-foreground">
                  Garantimos que todos os grupos sejam ativos e relevantes
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                <Target className="w-10 h-10 text-primary mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Busca Inteligente</h4>
                <p className="text-sm text-muted-foreground">
                  Sistema avançado para encontrar exatamente o que você procura
                </p>
              </Card>
            </div>
          </div>

          {/* Stats */}
          <div className="text-center bg-gradient-to-r from-primary/10 via-accent/10 to-primary-light/10 rounded-2xl p-8 mb-16">
            <h3 className="text-2xl font-bold mb-8 font-heading">Nossos Números</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">500+</div>
                <p className="text-muted-foreground">Grupos Ativos</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">19</div>
                <p className="text-muted-foreground">Categorias</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">1M+</div>
                <p className="text-muted-foreground">Membros Conectados</p>
              </div>
            </div>
          </div>

          {/* Team or Contact */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 font-heading">
              Tem alguma dúvida?
            </h3>
            <p className="text-muted-foreground mb-6">
              Nossa equipe está sempre pronta para ajudar você a encontrar a comunidade perfeita.
            </p>
            <Link 
              to="/contato" 
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
            >
              Entre em Contato
            </Link>
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

export default Sobre;