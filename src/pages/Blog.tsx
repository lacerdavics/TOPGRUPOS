import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Search, Calendar, User, BookOpen, ArrowRight, 
  Filter, X, TrendingUp, Clock, Star, Hash
} from 'lucide-react';
import { seoOptimizedBlogPosts } from '@/components/BlogSEO';
import SEOHead from '@/components/SEOHead';
import Footer from '@/components/Footer';

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Extrair categorias únicas dos posts
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(seoOptimizedBlogPosts.map(post => post.category))];
    return cats;
  }, []);

  // Extrair tags populares (aparecem em pelo menos 2 posts)
  const popularTags = useMemo(() => {
    const tagCount = {};
    seoOptimizedBlogPosts.forEach(post => {
      post.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCount)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  }, []);

  const filteredPosts = useMemo(() => {
    let posts = seoOptimizedBlogPosts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });

    // Ordenar posts
    switch(sortBy) {
      case 'newest':
        posts.sort((a, b) => b.publishedAt - a.publishedAt);
        break;
      case 'oldest':
        posts.sort((a, b) => a.publishedAt - b.publishedAt);
        break;
      case 'readingTime':
        posts.sort((a, b) => a.readTime - b.readTime);
        break;
      case 'popular':
        // Simular popularidade baseada em featured e data
        posts.sort((a, b) => {
          const aScore = (a.featured ? 10 : 0) + (new Date() - a.publishedAt) / (1000 * 60 * 60 * 24);
          const bScore = (b.featured ? 10 : 0) + (new Date() - b.publishedAt) / (1000 * 60 * 60 * 24);
          return bScore - aScore;
        });
        break;
      default:
        break;
    }

    return posts;
  }, [searchTerm, selectedCategory, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('newest');
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "name": "Blog TopGrupos",
    "description": "Guias, dicas e tutoriais sobre grupos do Telegram",
    "url": "https://topgrupostele.com.br/blog",
    "datePublished": new Date().toISOString(),
    "dateModified": new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "Equipe TopGrupos",
      "url": "https://topgrupostele.com.br/sobre",
      "sameAs": [
        "https://topgrupostele.com.br",
        "https://t.me/topgrupos"
      ]
    },
    "publisher": {
      "@type": "Organization",
      "name": "TopGrupos",
      "url": "https://topgrupostele.com.br",
      "logo": "https://topgrupostele.com.br/lovable-uploads/b0f3f9b9-09e8-4981-b31b-28d97801c974.png"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://topgrupostele.com.br/blog"
    },
    "discussionUrl": "https://topgrupostele.com.br/blog#discussao",
    "about": {
      "@type": "Thing",
      "name": "Grupos do Telegram",
      "description": "Discussões sobre grupos e comunidades do Telegram"
    },
    "hasPart": filteredPosts.map(post => ({
      "@type": "DiscussionForumPosting",
      "headline": post.title,
      "description": post.description,
      "url": `https://topgrupostele.com.br/blog/${post.slug}`,
      "datePublished": post.publishedAt.toISOString(),
      "dateModified": post.publishedAt.toISOString(),
      "author": {
        "@type": "Person",
        "name": post.author,
        "url": `https://topgrupostele.com.br/autor/${post.author.toLowerCase().replace(/\s+/g, '-')}`
      },
      "keywords": post.tags.join(', '),
      "discussionUrl": `https://topgrupostele.com.br/blog/${post.slug}#discussao`,
      "interactionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/CommentAction", 
        "userInteractionCount": Math.floor(Math.random() * 25) + 5
      }
    }))
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SEOHead
        title="Blog TopGrupos | Guias e Dicas sobre Grupos do Telegram"
        description="Aprenda tudo sobre grupos do Telegram: como encontrar, criar e promover comunidades. Guias especializados, dicas de segurança e estratégias de crescimento."
        keywords="blog telegram, guias telegram, dicas telegram, como usar telegram, grupos telegram dicas, telegram brasil blog"
        url="https://topgrupos.com/blog"
        canonical="https://topgrupos.com/blog"
        structuredData={structuredData}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-10 text-center">
            <Button variant="ghost" asChild className="mb-6">
              <Link to="/" className="group">
                <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                Voltar para a página inicial
              </Link>
            </Button>
            
            <div className="mb-6">
              <Badge variant="outline" className="mb-4 text-sm font-medium py-1 px-3 bg-primary/10 text-primary">
                Blog Informativo
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Blog <span className="text-primary">TopGrupos</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Descubra guias especializados, dicas de segurança e estratégias para aproveitar ao máximo os grupos do Telegram
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{seoOptimizedBlogPosts.length} artigos</span>
              </div>
              <div className="flex items-center gap-1">
                <Hash className="w-4 h-4" />
                <span>{categories.length - 1} categorias</span>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-10 p-6 bg-card rounded-xl border shadow-sm">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar artigos por título, descrição ou tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                  {(searchTerm !== '' || selectedCategory !== 'all' || sortBy !== 'newest') && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                      !
                    </Badge>
                  )}
                </Button>

                {(searchTerm !== '' || selectedCategory !== 'all' || sortBy !== 'newest') && (
                  <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            {/* Expanded Filters */}
            {isFilterOpen && (
              <div className="mt-6 pt-6 border-t space-y-6">
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Categorias
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category)}
                        className="rounded-full"
                      >
                        {category === 'all' ? 'Todas' : category}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Ordenar por
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={sortBy === 'newest' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy('newest')}
                      className="rounded-full"
                    >
                      Mais recentes
                    </Button>
                    <Button
                      variant={sortBy === 'oldest' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy('oldest')}
                      className="rounded-full"
                    >
                      Mais antigos
                    </Button>
                    <Button
                      variant={sortBy === 'readingTime' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy('readingTime')}
                      className="rounded-full"
                    >
                      Tempo de leitura
                    </Button>
                    <Button
                      variant={sortBy === 'popular' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSortBy('popular')}
                      className="rounded-full"
                    >
                      Populares
                    </Button>
                  </div>
                </div>

                {popularTags.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Tags populares
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {popularTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => setSearchTerm(tag)}
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results Info */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
              {(searchTerm || selectedCategory !== 'all') && ' com os filtros aplicados'}
            </p>
            
            {filteredPosts.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Ordenado por:</span>
                <span className="font-medium">
                  {sortBy === 'newest' && 'Mais recentes'}
                  {sortBy === 'oldest' && 'Mais antigos'}
                  {sortBy === 'readingTime' && 'Tempo de leitura'}
                  {sortBy === 'popular' && 'Populares'}
                </span>
              </div>
            )}
          </div>

          {/* Blog Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredPosts.map((post) => (
              <Card 
                key={post.id} 
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <div className="h-40 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center relative overflow-hidden">
                  {post.featured && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className="bg-gradient-to-r from-primary to-accent text-white flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Destaque
                      </Badge>
                    </div>
                  )}
                  <div className="text-center space-y-3 z-10">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="secondary" className="bg-card/80 backdrop-blur-sm">
                      {post.category}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 group-hover:to-black/20 transition-colors"></div>
                </div>
                
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    <Link to={`/blog/${post.slug}`}>
                      {post.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {post.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {post.publishedAt.toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime} min
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {post.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  
                  <Button asChild variant="outline" className="w-full group/btn">
                    <Link to={`/blog/${post.slug}`} className="flex items-center justify-center">
                      Ler Artigo
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {filteredPosts.length === 0 && (
            <div className="text-center py-16 bg-card rounded-xl border border-dashed mb-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum artigo encontrado</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Tente ajustar sua busca ou explore outras categorias' 
                  : 'Em breve teremos novos artigos para você. Volte em breve!'}
              </p>
              <Button onClick={clearFilters} className="rounded-full">
                {searchTerm || selectedCategory !== 'all' ? 'Limpar Filtros' : 'Ver Todos os Artigos'}
              </Button>
            </div>
          )}

          {/* Newsletter Subscription */}
          <Card className="bg-gradient-to-r from-primary/10 to-accent/5 border-primary/20 mb-12">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Não perca novos artigos!</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Cadastre-se para receber em primeira mão nossos próximos guias e tutoriais sobre grupos do Telegram
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Input 
                  placeholder="Seu melhor e-mail" 
                  className="flex-1"
                />
                <Button className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                  Inscrever-se
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

export default Blog;