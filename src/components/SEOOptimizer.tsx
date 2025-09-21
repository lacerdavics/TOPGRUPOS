import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Globe, 
  Image,
  FileText,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react';

interface SEOIssue {
  type: 'error' | 'warning' | 'success';
  category: string;
  message: string;
  fix?: string;
}

export const SEOOptimizer: React.FC = () => {
  const [issues, setIssues] = useState<SEOIssue[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [score, setScore] = useState(0);

  const analyzeSEO = async () => {
    setAnalyzing(true);
    const foundIssues: SEOIssue[] = [];
    let currentScore = 100;

    // Check meta tags
    const title = document.querySelector('title')?.textContent;
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content');
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    const robots = document.querySelector('meta[name="robots"]')?.getAttribute('content');

    if (!title || title.length < 30) {
      foundIssues.push({
        type: 'error',
        category: 'Meta Tags',
        message: 'Título muito curto ou ausente',
        fix: 'Adicione um título descritivo com 30-60 caracteres'
      });
      currentScore -= 15;
    }

    if (!description || description.length < 120) {
      foundIssues.push({
        type: 'error',
        category: 'Meta Tags',
        message: 'Meta description muito curta ou ausente',
        fix: 'Adicione uma descrição com 120-160 caracteres'
      });
      currentScore -= 15;
    }

    if (!canonical) {
      foundIssues.push({
        type: 'warning',
        category: 'URLs',
        message: 'URL canônica ausente',
        fix: 'Adicione tag canonical para evitar conteúdo duplicado'
      });
      currentScore -= 5;
    }

    if (!robots || !robots.includes('index')) {
      foundIssues.push({
        type: 'warning',
        category: 'Indexação',
        message: 'Diretiva robots não otimizada',
        fix: 'Configure robots meta tag adequadamente'
      });
      currentScore -= 5;
    }

    // Check images
    const images = document.querySelectorAll('img');
    let imagesWithoutAlt = 0;
    images.forEach(img => {
      if (!img.alt || img.alt.trim() === '') {
        imagesWithoutAlt++;
      }
    });

    if (imagesWithoutAlt > 0) {
      foundIssues.push({
        type: 'warning',
        category: 'Acessibilidade',
        message: `${imagesWithoutAlt} imagens sem texto alternativo`,
        fix: 'Adicione atributo alt descritivo em todas as imagens'
      });
      currentScore -= Math.min(10, imagesWithoutAlt * 2);
    }

    // Check structured data
    const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
    if (structuredData.length === 0) {
      foundIssues.push({
        type: 'warning',
        category: 'Dados Estruturados',
        message: 'Schema markup ausente',
        fix: 'Adicione dados estruturados JSON-LD'
      });
      currentScore -= 10;
    } else {
      foundIssues.push({
        type: 'success',
        category: 'Dados Estruturados',
        message: `${structuredData.length} schemas encontrados`,
      });
    }

    // Check Open Graph
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');

    if (!ogTitle || !ogDescription || !ogImage) {
      foundIssues.push({
        type: 'warning',
        category: 'Redes Sociais',
        message: 'Open Graph incompleto',
        fix: 'Complete as meta tags og:title, og:description e og:image'
      });
      currentScore -= 8;
    } else {
      foundIssues.push({
        type: 'success',
        category: 'Redes Sociais',
        message: 'Open Graph configurado corretamente',
      });
    }

    // Check page speed indicators
    const performanceEntries = performance.getEntriesByType('navigation');
    if (performanceEntries.length > 0) {
      const navEntry = performanceEntries[0] as PerformanceNavigationTiming;
      const loadTime = navEntry.loadEventEnd - navEntry.loadEventStart;
      
      if (loadTime > 3000) {
        foundIssues.push({
          type: 'warning',
          category: 'Performance',
          message: 'Tempo de carregamento alto',
          fix: 'Otimize imagens e reduza JavaScript'
        });
        currentScore -= 10;
      } else {
        foundIssues.push({
          type: 'success',
          category: 'Performance',
          message: 'Tempo de carregamento adequado',
        });
      }
    }

    setIssues(foundIssues);
    setScore(Math.max(0, currentScore));
    setAnalyzing(false);
  };

  useEffect(() => {
    // Auto-analyze on component mount
    setTimeout(analyzeSEO, 1000);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 70) return 'Bom';
    if (score >= 50) return 'Regular';
    return 'Precisa Melhorar';
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Análise SEO
          </CardTitle>
          <Button onClick={analyzeSEO} variant="outline" size="sm" disabled={analyzing}>
            <RefreshCw className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* SEO Score */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {score}/100
            </div>
            <Badge variant="outline" className="text-sm">
              {getScoreLabel(score)}
            </Badge>
          </div>
          
          <Progress value={score} className="h-3" />
        </div>

        {/* Issues List */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Análise Detalhada</h4>
          
          {issues.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {analyzing ? 'Analisando...' : 'Clique em analisar para verificar SEO'}
            </div>
          ) : (
            <div className="space-y-2">
              {issues.map((issue, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getIssueIcon(issue.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{issue.message}</span>
                      <Badge variant="outline" className="text-xs">
                        {issue.category}
                      </Badge>
                    </div>
                    {issue.fix && (
                      <p className="text-xs text-muted-foreground">
                        💡 {issue.fix}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Ações Rápidas</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              <Globe className="w-3 h-3 mr-1" />
              Testar URLs
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              Validar Schema
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Image className="w-3 h-3 mr-1" />
              Otimizar Imagens
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <LinkIcon className="w-3 h-3 mr-1" />
              Verificar Links
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};