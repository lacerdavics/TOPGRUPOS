import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  category?: string;
}

const faqs: FAQ[] = [
  {
    question: "Como encontrar grupos do Telegram seguros?",
    answer: "Use plataformas confiáveis como o TopGrupos que verificam os grupos. Evite grupos que pedem dados pessoais ou dinheiro imediatamente. Verifique se há moderadores ativos e regras claras.",
    category: "Segurança"
  },
  {
    question: "Posso cadastrar meu grupo do Telegram gratuitamente?",
    answer: "Sim! O cadastro no TopGrupos é 100% gratuito. Basta acessar a página 'Cadastrar Grupo', inserir o link do seu grupo e preencher as informações. Aprovamos grupos automaticamente.",
    category: "Cadastro"
  },
  {
    question: "Qual a diferença entre grupos e canais do Telegram?",
    answer: "Grupos permitem que todos os membros enviem mensagens e interajam. Canais são para transmissão unidirecional, onde apenas administradores podem postar. Ambos podem ser encontrados no TopGrupos.",
    category: "Telegram"
  },
  {
    question: "Como promover meu grupo do Telegram?",
    answer: "Oferecemos planos de promoção. Seu grupo aparece em destaque na página inicial e nas buscas, garantindo mais visibilidade e novos membros.",
    category: "Promoção"
  },
  {
    question: "Quantos grupos posso cadastrar?",
    answer: "Não há limite! Você pode cadastrar quantos grupos quiser, desde que sejam ativos, tenham conteúdo relevante e sigam nossas diretrizes de qualidade.",
    category: "Cadastro"
  },
  {
    question: "Como denunciar um grupo inadequado?",
    answer: "Cada grupo tem um botão 'Denunciar'. Clique nele, escolha o motivo e descreva o problema. Nossa equipe analisa todas as denúncias em até 24 horas.",
    category: "Segurança"
  },
  {
    question: "Grupos do Telegram são seguros para crianças?",
    answer: "Recomendamos supervisão parental. Temos uma categoria específica para conteúdo adulto (+18) com verificação de idade. Grupos educacionais são geralmente seguros para adolescentes.",
    category: "Segurança"
  },
  {
    question: "Como funciona a busca de grupos?",
    answer: "Nossa busca inteligente procura por nome, descrição e palavras-chave. Use filtros por categoria para resultados mais precisos. Também temos busca por cidade e interesse específico.",
    category: "Busca"
  },
  {
    question: "Posso editar as informações do meu grupo?",
    answer: "Sim! Acesse 'Meus Grupos' no menu, encontre seu grupo e clique em 'Editar'. Você pode atualizar nome, descrição e categoria a qualquer momento.",
    category: "Gerenciamento"
  },
  {
    question: "O que fazer se meu grupo foi removido?",
    answer: "Entre em contato conosco via WhatsApp (31) 99148-2323 ou email. Explicaremos o motivo da remoção e como resolver. Grupos podem ser reativados se corrigirem os problemas.",
    category: "Suporte"
  }
];

interface FAQSectionProps {
  category?: string;
  limit?: number;
  showTitle?: boolean;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ 
  category, 
  limit, 
  showTitle = true 
}) => {
  let displayFaqs = faqs;
  
  if (category) {
    displayFaqs = faqs.filter(faq => faq.category === category);
  }
  
  if (limit) {
    displayFaqs = displayFaqs.slice(0, limit);
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": displayFaqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section className="py-12 bg-gradient-to-br from-muted/20 to-background">
      <div className="container mx-auto px-4">
        {showTitle && (
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <HelpCircle className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold">
                Perguntas <span className="text-primary">Frequentes</span>
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tire suas dúvidas sobre grupos do Telegram e nossa plataforma
            </p>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {displayFaqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-none">
                <Card className="hover:shadow-md transition-shadow">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-start gap-3 text-left">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-primary font-bold text-sm">{index + 1}</span>
                      </div>
                      <h3 className="font-semibold text-base sm:text-lg">
                        {faq.question}
                      </h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="ml-9">
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                      {faq.category && (
                        <div className="mt-3">
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {faq.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Structured Data */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </section>
  );
};

export default FAQSection;