import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Users, 
  Shield, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Zap,
  Target,
  Rocket,
  Heart,
  Star
} from "lucide-react";
import { useResponsiveBreakpoints } from "@/hooks/useResponsiveBreakpoints";
import PromotionFlow from "@/components/PromotionFlow";
import SEOHead from "@/components/SEOHead";

const Promover = () => {
  const { isMobile } = useResponsiveBreakpoints();


  const handlePromoteNow = () => {
    // Scroll para seção de promoção
    const promotionSection = document.getElementById('promotion-section');
    if (promotionSection) {
      promotionSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const benefits = [
    {
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
      title: "Crescimento Garantido",
      description: "Seu grupo será visto por milhares de usuários ativos diariamente"
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Milhares de Usuários",
      description: "Exposição para nossa base ativa de usuários em busca de novos grupos"
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Fácil e Seguro",
      description: "Processo simples, pagamento seguro e resultados imediatos"
    },
    {
      icon: <Clock className="w-8 h-8 text-primary" />,
      title: "Planos Flexíveis",
      description: "Escolha entre promoção semanal ou mensal conforme sua necessidade"
    }
  ];

  const testimonials = [
    {
      name: "Pedro Silva",
      avatar: "👤",
      text: "Em apenas 3 dias meu grupo cresceu 500 membros! Recomendo muito!",
      rating: 5
    },
    {
      name: "Ana Costa", 
      avatar: "👩",
      text: "A melhor plataforma para divulgar grupos. Resultados rápidos e eficazes.",
      rating: 5
    },
    {
      name: "João Santos",
      avatar: "🧑",
      text: "Investimento que vale a pena. Meu grupo nunca cresceu tão rápido.",
      rating: 5
    }
  ];

  const steps = [
    {
      number: "1",
      icon: <Target className="w-6 h-6" />,
      title: "Escolha seu Grupo",
      description: "Selecione qual grupo você deseja promover"
    },
    {
      number: "2", 
      icon: <Shield className="w-6 h-6" />,
      title: "Escolha o Plano",
      description: "Selecione o plano ideal e pague com PIX"
    },
    {
      number: "3",
      icon: <Rocket className="w-6 h-6" />,
      title: "Promoção Imediata",
      description: "Seu grupo é promovido instantaneamente"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background pb-safe overflow-x-hidden mobile-responsive">
      <SEOHead
        title="Promover Grupo do Telegram | Turbine seu Crescimento | TopGrupos"
        description="🚀 Promova seu grupo do Telegram e ganhe milhares de membros! Planos a partir de R$ 30. Resultados garantidos, pagamento seguro via PIX."
        keywords="promover grupo telegram, divulgar grupo telegram, marketing telegram, crescer grupo telegram, membros telegram, publicidade telegram, impulsionar grupo telegram"
        url="https://topgrupostele.com.br/promover"
        canonical="https://topgrupostele.com.br/promover"
        robots="index, follow, max-image-preview:large"
      />
      
      <div>
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-success/10 opacity-50"></div>
        <div className="relative max-w-6xl mx-auto">
          <Badge className="mb-6 bg-success/20 text-success-foreground border-success/30 hover:bg-success/30 transition-colors">
            <Zap className="w-4 h-4 mr-1" />
            Promoção Turbinada
          </Badge>
          
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-heading font-bold mb-6 bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent leading-tight px-2">
            Promova seu Grupo do Telegram e Ganhe Milhares de Membros!
          </h1>
          
          <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed px-2">
            Divulgue seu grupo para <strong className="text-primary">milhares de pessoas ativas</strong> e cresça rápido de forma orgânica e segura. Planos a partir de R$ 30!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-2">
            <Button 
              size="lg"
              onClick={handlePromoteNow}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-dark text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Promover Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <div className="flex items-center gap-2 text-muted-foreground flex-wrap justify-center">
              <div className="flex -space-x-2">
                <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-medium">👥</div>
                <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs sm:text-sm font-medium">📈</div>
                <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-success text-success-foreground flex items-center justify-center text-xs sm:text-sm font-medium">⚡</div>
              </div>
              <span className="text-xs sm:text-sm text-center">+15.000 grupos promovidos</span>
            </div>
          </div>
          
          {/* Mockup visual */}
          <div className="relative max-w-xs sm:max-w-sm mx-auto px-2">
            <div className="bg-gradient-to-br from-card to-muted p-4 sm:p-6 rounded-3xl shadow-2xl border border-border/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-destructive"></div>
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <div className="w-3 h-3 rounded-full bg-success"></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm sm:text-base">🚀</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-primary text-sm sm:text-base truncate">SEU GRUPO</div>
                    <div className="text-xs text-muted-foreground">⭐ DESTACADO ⭐</div>
                  </div>
                  <Badge className="ml-auto bg-success text-success-foreground text-xs">NOVO</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 md:py-20 px-4 bg-gradient-to-r from-card/30 to-muted/20">
        <div className="max-w-6xl mx-auto px-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-center mb-8 sm:mb-12 px-2">
            Por que escolher nossa plataforma?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-all duration-300 hover:scale-105 border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="mb-4 flex justify-center">{benefit.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Promotion Flow Section */}
      <section id="promotion-section" className="py-12 md:py-20 px-4 bg-background">
        <PromotionFlow />
      </section>


      {/* How it Works Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-4xl mx-auto px-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-center mb-8 sm:mb-12 px-2">
            Como funciona?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                {index < steps.length - 1 && !isMobile && (
                  <ArrowRight className="absolute top-8 -right-4 w-8 h-8 text-muted-foreground/30 z-0" />
                )}
                
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    {step.number}
                  </div>
                  
                  <div className="mb-4 flex justify-center text-primary">
                    {step.icon}
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 md:py-20 px-4 pb-20 md:pb-12 bg-gradient-to-r from-primary/5 via-accent/5 to-success/5">
        <div className="max-w-4xl mx-auto text-center px-2">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-heading font-bold mb-6 px-2">
            Pronto para <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">crescer seu grupo</span>?
          </h2>
          
          <p className="text-base sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto px-2">
            Junte-se a milhares de administradores que já turbinaram seus grupos com nossa plataforma.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-2">
            <Button 
              size="lg"
              onClick={handlePromoteNow}
              className="w-full sm:w-auto bg-gradient-to-r from-primary via-accent to-success hover:from-primary-dark hover:via-accent-dark hover:to-success text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 px-6 sm:px-8 py-4 text-base sm:text-lg font-semibold"
            >
              <Heart className="w-5 sm:w-6 h-5 sm:h-6 mr-2" />
              Promover Meu Grupo Agora
              <ArrowRight className="w-5 sm:w-6 h-5 sm:h-6 ml-2" />
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 lg:gap-6 mt-8 text-xs sm:text-sm text-muted-foreground px-2 max-w-full">
            <div className="flex items-center justify-center gap-1 flex-shrink-0">
              <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-success flex-shrink-0" />
              <span className="whitespace-nowrap">Pagamento 100% seguro</span>
            </div>
            <div className="flex items-center justify-center gap-1 flex-shrink-0">
              <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-success flex-shrink-0" />
              <span className="whitespace-nowrap">Resultados imediatos</span>
            </div>
            <div className="flex items-center justify-center gap-1 flex-shrink-0">
              <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 text-success flex-shrink-0" />
              <span className="whitespace-nowrap">Suporte especializado</span>
            </div>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
};

export default Promover;