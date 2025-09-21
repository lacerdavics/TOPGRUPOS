// SEO utility functions for better indexation

export const generateBreadcrumbStructuredData = (breadcrumbs: Array<{ name: string; url: string }>) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
};

export const generateFAQStructuredData = (faqs: Array<{ question: string; answer: string }>) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

export const generateWebsiteStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "TopGrupos",
    "url": "https://topgrupostele.com.br",
    "description": "A maior plataforma para descobrir grupos do Telegram no Brasil",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://topgrupostele.com.br/busca?q={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TopGrupos",
      "url": "https://topgrupostele.com.br",
      "logo": {
        "@type": "ImageObject",
        "url": "https://firebasestorage.googleapis.com/v0/b/utm-propria.firebasestorage.app/o/logo%2FGenerated_Image_September_11__2025_-_12_49AM-removebg-preview.png?alt=media&token=0117896e-f785-4f74-a895-6b182e8f741f"
      }
    }
  };
};

export const generateOrganizationStructuredData = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TopGrupos",
    "description": "A maior plataforma para descobrir grupos do Telegram no Brasil",
    "url": "https://topgrupostele.com.br",
    "logo": "https://firebasestorage.googleapis.com/v0/b/utm-propria.firebasestorage.app/o/logo%2FGenerated_Image_September_11__2025_-_12_49AM-removebg-preview.png?alt=media&token=0117896e-f785-4f74-a895-6b182e8f741f",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+55-31-99148-2323",
      "contactType": "customer service",
      "availableLanguage": "Portuguese"
    },
    "sameAs": [
      "https://t.me/topgrupos"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "BR",
      "addressRegion": "MG"
    }
  };
};

export const optimizePageForSEO = (pageData: {
  title: string;
  description: string;
  keywords: string;
  url: string;
  type?: string;
}) => {
  // Update document title
  document.title = pageData.title;
  
  // Update meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', pageData.description);
  
  // Update canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', pageData.url);
  
  // Update Open Graph
  const ogTags = [
    { property: 'og:title', content: pageData.title },
    { property: 'og:description', content: pageData.description },
    { property: 'og:url', content: pageData.url },
    { property: 'og:type', content: pageData.type || 'website' }
  ];
  
  ogTags.forEach(tag => {
    let ogTag = document.querySelector(`meta[property="${tag.property}"]`);
    if (!ogTag) {
      ogTag = document.createElement('meta');
      ogTag.setAttribute('property', tag.property);
      document.head.appendChild(ogTag);
    }
    ogTag.setAttribute('content', tag.content);
  });
};

export const checkSEOHealth = () => {
  const issues: string[] = [];
  
  // Check essential meta tags
  if (!document.querySelector('title')?.textContent) {
    issues.push('Título da página ausente');
  }
  
  if (!document.querySelector('meta[name="description"]')) {
    issues.push('Meta description ausente');
  }
  
  if (!document.querySelector('link[rel="canonical"]')) {
    issues.push('URL canônica ausente');
  }
  
  if (!document.querySelector('meta[property="og:title"]')) {
    issues.push('Open Graph title ausente');
  }
  
  // Check for duplicate content indicators
  const h1Tags = document.querySelectorAll('h1');
  if (h1Tags.length > 1) {
    issues.push('Múltiplas tags H1 encontradas');
  }
  
  return {
    isHealthy: issues.length === 0,
    issues,
    score: Math.max(0, 100 - (issues.length * 15))
  };
};