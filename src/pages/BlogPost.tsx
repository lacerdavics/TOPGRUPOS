import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Calendar, User, BookOpen, Share2, ArrowRight, Clock, Tag } from 'lucide-react';
import { seoOptimizedBlogPosts } from '@/components/BlogSEO';
import SEOHead from '@/components/SEOHead';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

// Componente para renderizar imagens nos posts
const BlogImage = ({ src, alt, caption }) => {
  return (
    <figure className="my-8">
      <img 
        src={src} 
        alt={alt} 
        className="rounded-xl shadow-lg w-full object-cover max-h-96"
      />
      {caption && (
        <figcaption className="text-center text-sm text-muted-foreground mt-2 italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

// Componente para metadados do post
const PostMetadata = ({ post }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mb-8 bg-card/50 backdrop-blur-sm rounded-xl px-6 py-4 border border-border/30 shadow-sm">
      <span className="flex items-center gap-2">
        <User className="w-4 h-4" />
        {post.author}
      </span>
      <span className="flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        {post.publishedAt.toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </span>
      <span className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        {post.readTime} min de leitura
      </span>
    </div>
  );
};

// Componente para tags
const PostTags = ({ tags }) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {tags.map((tag) => (
        <Badge key={tag} variant="outline" className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors cursor-default">
          <Tag className="w-3 h-3 mr-1" />
          {tag}
        </Badge>
      ))}
    </div>
  );
};

// Função para formatar o conteúdo do post
const formatPostContent = (content) => {
  // Dividir o conteúdo em linhas
  const lines = content.split('\n');
  let html = '';
  let inList = false;

  lines.forEach(line => {
    // Títulos
    if (line.startsWith('# ')) {
      html += `<h1 class="text-3xl font-bold mt-12 mb-6 text-primary">${line.substring(2)}</h1>`;
    } 
    else if (line.startsWith('## ')) {
      html += `<h2 class="text-2xl font-bold mt-10 mb-5 text-primary">${line.substring(3)}</h2>`;
    } 
    else if (line.startsWith('### ')) {
      html += `<h3 class="text-xl font-semibold mt-8 mb-4 text-accent">${line.substring(4)}</h3>`;
    } 
    // Listas
    else if (line.startsWith('- ')) {
      if (!inList) {
        html += '<ul class="mb-6 space-y-2 pl-5 list-disc">';
        inList = true;
      }
      html += `<li class="text-base leading-relaxed">${line.substring(2)}</li>`;
    } 
    // Blocos de código
    else if (line.startsWith('```')) {
      html += '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-6"><code class="text-sm font-mono">';
    } 
    else if (line === '```') {
      html += '</code></pre>';
    }
    // Imagens com sintaxe personalizada [img:url|alt|caption]
    else if (line.startsWith('[img:')) {
      const match = line.match(/\[img:(.*?)\|(.*?)(?:\|(.*?))?\]/);
      if (match) {
        const [, src, alt, caption] = match;
        // Usaremos um placeholder para a imagem que será substituído pelo componente React
        html += `<div class="blog-image" data-src="${src}" data-alt="${alt}" data-caption="${caption || ''}"></div>`;
      } else {
        html += `<p class="mb-6 text-base leading-relaxed">${line}</p>`;
      }
    }
    // Parágrafos normais
    else if (line.trim() === '') {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += '<br/>';
    } 
    else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      
      // Aplicar formatação básica ao texto
      let formattedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-muted px-2 py-1 rounded text-sm font-mono">$1</code>');
      
      html += `<p class="mb-6 text-base leading-relaxed">${formattedLine}</p>`;
    }
  });

  if (inList) {
    html += '</ul>';
  }

  return html;
};

// Componente para renderizar o conteúdo formatado
const FormattedContent = ({ content }) => {
  const formattedHtml = formatPostContent(content);
  const divRef = React.useRef(null);

  React.useEffect(() => {
    if (divRef.current) {
      // Substituir placeholders de imagem por componentes React
      const imagePlaceholders = divRef.current.querySelectorAll('.blog-image');
      imagePlaceholders.forEach(placeholder => {
        const src = placeholder.getAttribute('data-src');
        const alt = placeholder.getAttribute('data-alt');
        const caption = placeholder.getAttribute('data-caption');
        
        const container = document.createElement('div');
        // Renderizar o componente de imagem usando ReactDOM.render ou criar elemento manualmente
        // Como alternativa, podemos usar uma abordagem diferente para imagens
        container.innerHTML = `
          <figure class="my-8">
            <img src="${src}" alt="${alt}" class="rounded-xl shadow-lg w-full object-cover max-h-96" />
            ${caption ? `<figcaption class="text-center text-sm text-muted-foreground mt-2 italic">${caption}</figcaption>` : ''}
          </figure>
        `;
        
        placeholder.replaceWith(container.firstChild);
      });
    }
  }, [content]);

  return (
    <div 
      ref={divRef}
      className="prose prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  );
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const post = seoOptimizedBlogPosts.find(p => p.slug === slug);
  
  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
          <Button onClick={() => navigate('/blog')}>
            Voltar ao Blog
          </Button>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    const url = `https://topgrupostele.com.br/blog/${post.slug}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: url
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência!');
      } catch (error) {
        toast.error('Erro ao copiar link');
      }
    }
  };

  const relatedPosts = seoOptimizedBlogPosts
    .filter(p => p.id !== post.id && (
      p.category === post.category || 
      p.tags.some(tag => post.tags.includes(tag))
    ))
    .slice(0, 3);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.description,
    "image": post.image || "https://topgrupostele.com.br/lovable-uploads/b0f3f9b9-09e8-4981-b31b-28d97801c974.png",
    "author": {
      "@type": "Organization",
      "name": post.author,
      "url": "https://topgrupostele.com.br"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TopGrupos",
      "logo": {
        "@type": "ImageObject",
        "url": "https://topgrupostele.com.br/lovable-uploads/b0f3f9b9-09e8-4981-b31b-28d97801c974.png"
      }
    },
    "datePublished": post.publishedAt.toISOString(),
    "dateModified": post.publishedAt.toISOString(),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://topgrupostele.com.br/blog/${post.slug}`
    },
    "keywords": post.tags.join(', '),
    "wordCount": post.content.split(' ').length,
    "timeRequired": `PT${post.readTime}M`
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <SEOHead
        title={`${post.title} | Blog TopGrupos`}
        description={post.description}
        keywords={post.tags.join(', ')}
        url={`https://topgrupostele.com.br/blog/${post.slug}`}
        canonical={`https://topgrupostele.com.br/blog/${post.slug}`}
        type="article"
        structuredData={structuredData}
      />

      <main className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Navigation */}
          <div className="mb-8 sm:mb-12">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/blog">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Blog
              </Link>
            </Button>
            
            {/* Breadcrumb */}
            <nav className="text-sm text-muted-foreground mb-6 bg-card/30 backdrop-blur-sm rounded-lg px-4 py-2 border border-border/50">
              <Link to="/" className="hover:text-primary">Início</Link>
              <span className="mx-2">›</span>
              <Link to="/blog" className="hover:text-primary">Blog</Link>
              <span className="mx-2">›</span>
              <span className="text-foreground">{post.title}</span>
            </nav>
          </div>

          {/* Article Header */}
          <article className="mb-12 sm:mb-16">
            <header className="mb-8 sm:mb-12 text-center">
              {/* Hero Image */}
              {post.image ? (
                <BlogImage 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-64 sm:h-80 rounded-3xl mb-8 object-cover border border-border/20 shadow-lg"
                />
              ) : (
                <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 rounded-3xl mb-8 flex items-center justify-center border border-border/20 shadow-lg">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                      <BookOpen className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-primary font-semibold">Artigo TopGrupos</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-4 justify-center">
                <Badge variant="secondary">{post.category}</Badge>
                {post.featured && (
                  <Badge className="bg-gradient-to-r from-primary to-accent text-white shadow-lg">
                    Artigo em Destaque
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                {post.title}
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
                {post.description}
              </p>
              
              <PostMetadata post={post} />
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <PostTags tags={post.tags} />
                
                <Button variant="outline" size="sm" onClick={handleShare} className="hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </div>
            </header>

            {/* Article Content */}
            <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-6 sm:p-8 md:p-12 border border-border/30 shadow-xl mb-12">
              <FormattedContent content={post.content} />
            </div>
          </article>

          {/* Call to Action */}
          <Card className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border-primary/20 mb-12 sm:mb-16 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <ArrowRight className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Pronto para Encontrar sua Comunidade?
              </h3>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
                Explore nossa plataforma e descubra grupos incríveis do Telegram organizados por categoria
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-dark text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Link to="/">
                    Explorar Grupos
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105">
                  <Link to="/cadastrar">
                    Cadastrar Meu Grupo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mb-16">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Artigos Relacionados
                </h2>
                <p className="text-muted-foreground">Continue aprendendo com nossos outros guias</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {relatedPosts.map((relatedPost) => (
                  <Card key={relatedPost.id} className="group hover:shadow-2xl transition-all duration-500 hover:scale-105 border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
                    <div className="h-40 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                      {relatedPost.image ? (
                        <img 
                          src={relatedPost.image} 
                          alt={relatedPost.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10 text-center">
                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                              <BookOpen className="w-6 h-6 text-primary" />
                            </div>
                            <Badge variant="secondary" className="bg-card/80 backdrop-blur-sm">
                              {relatedPost.category}
                            </Badge>
                          </div>
                        </>
                      )}
                    </div>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        <Link 
                          to={`/blog/${relatedPost.slug}`}
                          className="hover:text-primary transition-colors"
                        >
                          {relatedPost.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-3 text-sm leading-relaxed">
                        {relatedPost.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 bg-muted/30 rounded-lg px-3 py-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {relatedPost.publishedAt.toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {relatedPost.readTime} min
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {relatedPost.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <Button asChild variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <Link to={`/blog/${relatedPost.slug}`}>
                          Ler Artigo
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Newsletter Signup */}
          <Card className="bg-gradient-to-br from-accent/10 via-primary/5 to-accent/10 border-accent/20 mb-12 shadow-xl">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <BookOpen className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                Gostou do Artigo?
              </h3>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
                Explore mais conteúdo sobre grupos do Telegram e descubra dicas exclusivas para crescer sua comunidade
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-accent to-primary hover:from-accent-dark hover:to-primary-dark text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Link to="/blog">
                    Ver Mais Artigos
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-accent hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover:scale-105">
                  <Link to="/">
                    Explorar Grupos
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;