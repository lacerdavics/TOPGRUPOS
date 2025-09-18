import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  noindex?: boolean;
  canonical?: string;
  structuredData?: object;
  additionalStructuredData?: object[]; // Para múltiplos schemas
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = "TopGrupos - Descubra os Melhores Grupos do Telegram",
  description = "🚀 Encontre grupos do Telegram organizados por categoria: amizade, namoro, filmes, educação, criptomoedas e mais. Milhares de grupos ativos verificados.",
  keywords = "grupos telegram, telegram grupos, grupos do telegram, comunidades telegram",
  image = "https://firebasestorage.googleapis.com/v0/b/utm-propria.firebasestorage.app/o/logo%2FGenerated_Image_September_11__2025_-_12_49AM-removebg-preview.png?alt=media&token=0117896e-f785-4f74-a895-6b182e8f741f",
  url = "https://topgrupostele.com.br",
  type = "website",
  noindex = false,
  canonical,
  structuredData,
  additionalStructuredData = []
}) => {
  const fullTitle = title.includes('TopGrupos') ? title : `${title} | TopGrupos`;
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Robots */}
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"} />
      
      {/* Canonical */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="TopGrupos" />
      <meta property="og:locale" content="pt_BR" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* Additional Structured Data */}
      {additionalStructuredData.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;