import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MessageCircle, Mail, MapPin, Clock, Phone, Home } from "lucide-react";

const Contato = () => {
  const whatsappNumber = "5531991482323";
  const whatsappMessage = "Olá! Vim através do TopGrupos e gostaria de mais informações.";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-16">
            <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm">
              📞 Contato
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 font-heading">
              Entre em 
              <span className="bg-gradient-to-r from-primary via-accent to-primary-light bg-clip-text text-transparent block mt-2">
                Contato
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Estamos aqui para ajudar! Entre em contato conosco através dos canais abaixo.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6 font-heading">
                  Fale Conosco
                </h2>
                <p className="text-muted-foreground mb-8">
                  Escolha a forma mais conveniente para entrar em contato. 
                  Respondemos rapidamente em todos os canais!
                </p>
              </div>

              <div className="space-y-6">
                {/* WhatsApp */}
                <Card className="p-6 border-green-200 dark:border-green-800">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">WhatsApp</h3>
                      <p className="text-muted-foreground mb-4">
                        Fale conosco diretamente no WhatsApp para suporte rápido
                      </p>
                      <Button asChild className="bg-green-600 hover:bg-green-700">
                        <a 
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chamar no WhatsApp
                        </a>
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Email */}
                <Card className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">E-mail</h3>
                      <p className="text-muted-foreground mb-2">
                        contato@topgrupostele.com.br
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Resposta em até 24 horas
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Business Hours */}
                <Card className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Horário de Atendimento</h3>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Segunda a Sexta: 9h às 18h</p>
                        <p>Sábado: 9h às 14h</p>
                        <p>Domingo: Fechado</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <h2 className="text-2xl font-bold mb-6 font-heading">
                Perguntas Frequentes
              </h2>
              
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-3">Como cadastrar meu grupo?</h3>
                  <p className="text-muted-foreground text-sm">
                    Acesse a página "Cadastrar Grupo" em nosso site e preencha 
                    as informações solicitadas. Nosso time irá revisar e aprovar 
                    em até 48 horas.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-3">É gratuito?</h3>
                  <p className="text-muted-foreground text-sm">
                    Sim! O cadastro de grupos e a navegação em nosso site são 
                    completamente gratuitos.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-3">Como reportar um grupo inadequado?</h3>
                  <p className="text-muted-foreground text-sm">
                    Cada grupo possui um botão de "Reportar". Clique nele e 
                    descreva o motivo. Nossa equipe investigará imediatamente.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-3">Vocês têm aplicativo mobile?</h3>
                  <p className="text-muted-foreground text-sm">
                    Nosso site é totalmente responsivo e funciona perfeitamente 
                    em dispositivos móveis. Um app nativo está em desenvolvimento.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-3">Como entrar em contato para parcerias?</h3>
                  <p className="text-muted-foreground text-sm">
                    Entre em contato através do WhatsApp ou e-mail mencionando 
                    "Parceria" no assunto. Teremos prazer em conversar!
                  </p>
                </Card>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16 p-8 bg-gradient-to-r from-primary/10 via-accent/10 to-primary-light/10 rounded-2xl">
            <h3 className="text-2xl font-bold mb-4 font-heading">
              Ainda tem dúvidas?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Nossa equipe está sempre pronta para ajudar você. 
              Não hesite em entrar em contato!
            </p>
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Falar no WhatsApp
              </a>
            </Button>
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

export default Contato;