import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
const logo = "/lovable-uploads/b0f3f9b9-09e8-4981-b31b-28d97801c974.png";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-muted/50 to-background border-t border-border/50 py-12 sm:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="TopGrupos" className="h-10 w-auto" />
              <span className="text-xl font-bold">TopGrupos</span>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-6 max-w-md">
              A maior plataforma de descoberta de grupos do Telegram no Brasil. 
              Conecte-se com comunidades incríveis e encontre pessoas que compartilham seus interesses.
            </p>
            <Button asChild className="btn-modern">
              <Link to="/cadastrar">
                🚀 Cadastrar Grupo Grátis
              </Link>
            </Button>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Navegação</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Início</Link></li>
              <li><Link to="/busca" className="text-muted-foreground hover:text-primary transition-colors">Buscar Grupos</Link></li>
              <li><Link to="/cadastrar" className="text-muted-foreground hover:text-primary transition-colors">Cadastrar Grupo</Link></li>
              <li><Link to="/sobre" className="text-muted-foreground hover:text-primary transition-colors">Sobre Nós</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/termos" className="text-muted-foreground hover:text-primary transition-colors">Termos de Uso</Link></li>
              <li><Link to="/privacidade" className="text-muted-foreground hover:text-primary transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/contato" className="text-muted-foreground hover:text-primary transition-colors">Contato</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 text-center">
          <p className="text-muted-foreground">
            © 2024 TopGrupos. Todos os direitos reservados. 
            <span className="mx-2">•</span>
            Feito com ❤️ para a comunidade Telegram
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;