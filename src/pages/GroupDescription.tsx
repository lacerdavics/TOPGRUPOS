import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LazyImage from "@/components/LazyImage";
import IntelligentGroupImage from "@/components/IntelligentGroupImage";
import { ExternalLink, Eye, Flag, ArrowLeft, Trash2, Ban, RefreshCw } from "lucide-react";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { checkIsAdmin } from "@/services/userService";
import SEOHead from "@/components/SEOHead";
import { decodeHtmlEntities } from "@/lib/utils";

interface Group {
  id: string;
  name: string;
  description: string;
  telegramUrl: string;
  category: string;
  imageUrl?: string;
  viewCount?: number;
  createdAt?: Date;
}

const GroupDescription: React.FC = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const groupData = localStorage.getItem(`group_${groupId}`);
    if (groupData) {
      const parsedGroup = JSON.parse(groupData);
      // Ensure name is always a string to prevent null errors
      setGroup({
        ...parsedGroup,
        name: parsedGroup.name || 'Grupo sem nome',
        description: parsedGroup.description || 'Sem descrição disponível',
        createdAt: parsedGroup.createdAt ? new Date(parsedGroup.createdAt) : undefined
      });
    } else {
      const name = searchParams.get('name');
      const description = searchParams.get('description');
      const telegramUrl = searchParams.get('telegramUrl');
      const category = searchParams.get('category');
      const imageUrl = searchParams.get('imageUrl');
      const viewCount = searchParams.get('viewCount');

      if (name && description && telegramUrl && category) {
        setGroup({
          id: groupId || '',
          name: name || 'Grupo sem nome',
          description: description || 'Sem descrição disponível',
          telegramUrl,
          category,
          imageUrl: imageUrl || undefined,
          viewCount: viewCount ? parseInt(viewCount) : undefined
        });
      }
    }
    setLoading(false);
  }, [groupId, searchParams]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser?.uid) {
        const adminStatus = await checkIsAdmin(currentUser.uid);
        setIsAdmin(adminStatus);
      }
    };
    checkAdminStatus();
  }, [currentUser?.uid]);

  const handleProceed = () => group && window.open(group.telegramUrl, '_blank');
  
  const handleDeleteClick = () => {
    navigate(`/grupo/${group?.id}/apagar?name=${encodeURIComponent(group?.name || '')}`);
  };

  const handleSuspendClick = () => {
    navigate(`/grupo/${group?.id}/suspender?name=${encodeURIComponent(group?.name || '')}`);
  };

  const handleReportClick = () => {
    navigate(`/grupo/${group?.id}/denunciar?name=${encodeURIComponent(group?.name || '')}`);
  };

  const handleRecategorizeClick = () => {
    navigate(`/grupo/${group?.id}/recategorizar?name=${encodeURIComponent(group?.name || '')}&category=${encodeURIComponent(group?.category || '')}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">Grupo não encontrado</h1>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Footer />
      </div>
    );
  }

  // Structured data for group description page - only create when group exists
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "headline": decodeHtmlEntities(group?.name || 'Grupo sem nome'),
    "name": decodeHtmlEntities(group?.name || 'Grupo sem nome'),
    "description": decodeHtmlEntities(group?.description || 'Sem descrição disponível'),
    "url": `https://topgrupostele.com.br/grupo/${group?.id || ''}/descricao`,
    "datePublished": group?.createdAt?.toISOString() || "2024-01-01T00:00:00Z",
    "dateModified": group?.createdAt?.toISOString() || "2024-01-01T00:00:00Z",
    "author": {
      "@type": "Organization",
      "name": "TopGrupos",
      "url": "https://topgrupostele.com.br"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TopGrupos",
      "url": "https://topgrupostele.com.br",
      "logo": {
        "@type": "ImageObject",
        "url": "https://firebasestorage.googleapis.com/v0/b/utm-propria.firebasestorage.app/o/logo%2FGenerated_Image_September_11__2025_-_12_49AM-removebg-preview.png?alt=media&token=0117896e-f785-4f74-a895-6b182e8f741f"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://topgrupostele.com.br/grupo/${group?.id || ''}/descricao`
    },
    "discussionUrl": group?.telegramUrl || '',
    "about": {
      "@type": "Thing",
      "name": group?.category || "Telegram",
      "description": decodeHtmlEntities(group?.description || 'Sem descrição disponível')
    },
    "image": group?.imageUrl ? {
      "@type": "ImageObject",
      "url": group.imageUrl,
      "width": 400,
      "height": 400
    } : {
      "@type": "ImageObject",
      "url": "https://firebasestorage.googleapis.com/v0/b/utm-propria.firebasestorage.app/o/logo%2FGenerated_Image_September_11__2025_-_12_49AM-removebg-preview.png?alt=media&token=0117896e-f785-4f74-a895-6b182e8f741f",
      "width": 400,
      "height": 400
    },
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/ViewAction",
      "userInteractionCount": group?.viewCount || Math.floor(Math.random() * 1000) + 100
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${decodeHtmlEntities(group?.name || 'Grupo sem nome')} | Descrição do Grupo | TopGrupos`}
        description={decodeHtmlEntities(group?.description || 'Sem descrição disponível')}
        url={`https://topgrupostele.com.br/grupo/${group?.id || ''}/descricao`}
        canonical={`https://topgrupostele.com.br/grupo/${group?.id || ''}/descricao`}
        structuredData={structuredData}
      />
      
      <main className="container mx-auto px-4 py-6 sm:py-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4 w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-lg border space-y-6">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold leading-tight">{decodeHtmlEntities(group?.name || 'Grupo sem nome')}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <Badge variant="secondary">{group?.category || 'Categoria'}</Badge>
                {group?.viewCount && (
                  <span className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Eye className="h-4 w-4" />
                    {group.viewCount > 999 ? `${(group.viewCount / 1000).toFixed(1)}k` : group.viewCount.toLocaleString()} visualizações
                  </span>
                )}
              </div>
            </div>

            {group?.imageUrl && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                <IntelligentGroupImage
                  fallbackImageUrl={group.imageUrl || (group as any).profileImage}
                  telegramUrl={group?.telegramUrl || ''}
                  groupName={group?.name || 'Grupo sem nome'}
                  alt={group?.name || 'Grupo sem nome'}
                  className="w-full h-full object-cover"
                  priority={true}
                  groupId={group?.id || ''}
                />
              </div>
            )}

            <div>
              <h2 className="font-semibold text-lg mb-3">Descrição:</h2>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                {decodeHtmlEntities(group?.description || 'Sem descrição disponível')}
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Ao clicar em "Entrar no Grupo", você será redirecionado para o Telegram.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-end">
              {isAdmin && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleRecategorizeClick}
                    className="w-full sm:w-auto gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Recategorizar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDeleteClick}
                    className="w-full sm:w-auto gap-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    Apagar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSuspendClick}
                    className="w-full sm:w-auto gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                  >
                    <Ban className="h-4 w-4" />
                    Suspender
                  </Button>
                </>
              )}

              <Button variant="outline" onClick={() => navigate(-1)} className="w-full sm:w-auto">
                Voltar
              </Button>

              <Button variant="outline" onClick={handleReportClick} className="w-full sm:w-auto gap-2">
                <Flag className="h-4 w-4" />
                Denunciar
              </Button>

              <Button onClick={handleProceed} className="w-full sm:w-auto gap-2 font-semibold">
                <ExternalLink className="h-4 w-4" />
                Entrar no Grupo
              </Button>
            </div>
          </div>
        </div>


      </main>

      <Footer />
    </div>
  );
};

export default GroupDescription;
