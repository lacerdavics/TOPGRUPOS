import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Users, Tag, ArrowLeft } from "lucide-react";
import { getCategoryById } from "@/data/categories";
import CategoryIcon from "@/components/CategoryIcon";
import { decodeHtmlEntities } from "@/lib/utils";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import IntelligentGroupImage from "@/components/IntelligentGroupImage";
import SEOHead from "@/components/SEOHead";

interface Group {
  id: string;
  name: string;
  description: string;
  telegramUrl: string;
  category: string;
  profileImage?: string;
  membersCount?: number;
}

const GroupDetails = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Recuperar dados do grupo do localStorage ou API
    const groupData = localStorage.getItem(`group_${groupId}`);
    if (groupData) {
      setGroup(JSON.parse(groupData));
    }
    setLoading(false);
  }, [groupId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Grupo não encontrado</h1>
            <Button onClick={() => navigate(-1)} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const decodedName = decodeHtmlEntities(group.name);
  const decodedDescription = decodeHtmlEntities(group.description);
  const category = getCategoryById(group.category);

  // Structured data for group details page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "headline": decodedName,
    "name": decodedName,
    "description": decodedDescription,
    "url": `https://topgrupostele.com.br/grupo/${group.id}`,
    "datePublished": group.createdAt?.toISOString() || "2024-01-01T00:00:00Z",
    "dateModified": group.createdAt?.toISOString() || "2024-01-01T00:00:00Z",
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
      "@id": `https://topgrupostele.com.br/grupo/${group.id}`
    },
    "discussionUrl": group.telegramUrl,
    "about": {
      "@type": "Thing",
      "name": group.category || "Telegram",
      "description": decodedDescription
    },
    "image": group.profileImage ? {
      "@type": "ImageObject",
      "url": group.profileImage,
      "width": 400,
      "height": 400
    } : undefined,
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/JoinAction",
      "userInteractionCount": group.membersCount || Math.floor(Math.random() * 1000) + 100
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${decodedName} | Grupo do Telegram | TopGrupos`}
        description={decodedDescription}
        url={`https://topgrupostele.com.br/grupo/${group.id}`}
        canonical={`https://topgrupostele.com.br/grupo/${group.id}`}
        robots="index, follow, max-image-preview:large"
        structuredData={structuredData}
      />
      
      <SEOHead
        title={`${decodedName} | Grupo do Telegram | TopGrupos`}
        description={decodedDescription}
        url={`https://topgrupostele.com.br/grupo/${group.id}`}
        canonical={`https://topgrupostele.com.br/grupo/${group.id}`}
        robots="index, follow, max-image-preview:large"
        structuredData={structuredData}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Button 
            onClick={() => navigate(-1)} 
            variant="ghost" 
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {/* Group Card */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0">
                {group.name ? (
                  <IntelligentGroupImage
                    fallbackImageUrl={group.profileImage || group.imageUrl}
                    telegramUrl={group.telegramUrl}
                    groupName={decodedName}
                    alt={decodedName}
                    className="w-full h-full object-cover"
                    priority={true}
                    groupId={group.id}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted/80 flex items-center justify-center">
                    <div className="text-muted-foreground/60 text-2xl font-bold">📷</div>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold leading-tight">
                  {decodedName}
                </h1>
                {group.membersCount && (
                  <div className="flex items-center mt-3">
                    <Users className="w-5 h-5 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {group.membersCount.toLocaleString()} membros
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Category */}
            {category && (
              <div className="flex items-center space-x-2 mb-8">
                <Tag className="w-5 h-5 text-muted-foreground" />
                <div className="flex items-center space-x-2">
                  {category.icon && (
                    <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                      <CategoryIcon iconData={category.icon} size={16} color="white" />
                    </div>
                  )}
                  <Badge variant="outline">
                    {category.name}
                  </Badge>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-8">
              <h2 className="font-semibold text-lg mb-4 text-muted-foreground uppercase tracking-wide">
                Descrição
              </h2>
              <p className="text-foreground leading-relaxed text-lg">
                {decodedDescription}
              </p>
            </div>

            {/* Action Button */}
            <div className="space-y-4">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
                asChild
              >
                <a 
                  href={group.telegramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Entrar no Grupo
                </a>
              </Button>
              
              <p className="text-sm text-center text-muted-foreground">
                Você será redirecionado para o Telegram
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GroupDetails;