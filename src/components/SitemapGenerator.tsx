import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Globe, Calendar } from 'lucide-react';
import { categories } from '@/data/categories';
import { seoOptimizedBlogPosts } from '@/components/BlogSEO';

export const SitemapGenerator: React.FC = () => {
  const [generating, setGenerating] = useState(false);

  const generateSitemap = () => {
    setGenerating(true);
    
    const currentDate = new Date().toISOString().split('T')[0];
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Homepage -->
  <url>
    <loc>https://topgrupostele.com.br/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
`;

    // Add categories
    categories.forEach(category => {
      sitemap += `  <url>
    <loc>https://topgrupostele.com.br/categoria/${category.id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  
`;
    });

    // Add static pages
    const staticPages = [
      { path: '/cadastrar', priority: '0.8', changefreq: 'monthly' },
      { path: '/promover', priority: '0.7', changefreq: 'monthly' },
      { path: '/busca', priority: '0.7', changefreq: 'weekly' },
      { path: '/sobre', priority: '0.5', changefreq: 'monthly' },
      { path: '/contato', priority: '0.5', changefreq: 'monthly' },
      { path: '/termos', priority: '0.3', changefreq: 'yearly' },
      { path: '/privacidade', priority: '0.3', changefreq: 'yearly' },
      { path: '/blog', priority: '0.7', changefreq: 'weekly' }
    ];

    staticPages.forEach(page => {
      sitemap += `  <url>
    <loc>https://topgrupostele.com.br${page.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
  
`;
    });

    // Add blog posts
    seoOptimizedBlogPosts.forEach(post => {
      const postDate = post.publishedAt.toISOString().split('T')[0];
      sitemap += `  <url>
    <loc>https://topgrupostele.com.br/blog/${post.slug}</loc>
    <lastmod>${postDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
`;
    });

    sitemap += `</urlset>`;

    // Download the sitemap
    const blob = new Blob([sitemap], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setGenerating(false);
  };

  const totalUrls = 1 + categories.length + 8 + seoOptimizedBlogPosts.length;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Gerador de Sitemap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalUrls}</div>
            <div className="text-muted-foreground">URLs Totais</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{categories.length}</div>
            <div className="text-muted-foreground">Categorias</div>
          </div>
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className="w-full justify-center">
            <FileText className="w-3 h-3 mr-1" />
            Sitemap XML Atualizado
          </Badge>
          <Badge variant="outline" className="w-full justify-center">
            <Calendar className="w-3 h-3 mr-1" />
            Data: {new Date().toLocaleDateString('pt-BR')}
          </Badge>
        </div>

        <Button 
          onClick={generateSitemap}
          disabled={generating}
          className="w-full"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
              Gerando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Gerar Sitemap
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};