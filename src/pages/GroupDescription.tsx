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

interface Group {
  id: string;
  name: string;
  description: string;
  telegramUrl: string;
  category: string;
  imageUrl?: string;
  viewCount?: number;
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
      setGroup(JSON.parse(groupData));
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
          name,
          description,
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

  const decodeHtml = (html: string) =>
    html?.replace(/&#39;/g, "'")
        .replace(/&#33;/g, "!")
        .replace(/&#34;/g, '"')
        .replace(/&#38;/g, "&")
        .replace(/&amp;/g, "&");

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

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 sm:py-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <Button onClick={() => navigate(-1)} variant="ghost" className="mb-4 w-full sm:w-auto">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-lg border space-y-6">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold leading-tight">{decodeHtml(group.name)}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <Badge variant="secondary">{group.category}</Badge>
                    groupId={group.id}
                {group.viewCount && (
                  <span className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Eye className="h-4 w-4" />
                    {group.viewCount > 999 ? `${(group.viewCount / 1000).toFixed(1)}k` : group.viewCount.toLocaleString()} visualizações
                  </span>
                )}
              </div>
            </div>

            {group.imageUrl && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                <IntelligentGroupImage
                  fallbackImageUrl={group.imageUrl || (group as any).profileImage}
                  telegramUrl={group.telegramUrl}
                  groupName={group.name}
                  alt={group.name}
                  className="w-full h-full object-cover"
                  priority={true}
                  groupId={group.id}
                />
              </div>
            )}

            <div>
              <h2 className="font-semibold text-lg mb-3">Descrição:</h2>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                {decodeHtml(group.description) || "Sem descrição disponível."}
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
