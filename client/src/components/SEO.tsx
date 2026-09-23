import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  structuredData?: object;
  type?: string;
  image?: string;
}

export const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  canonical, 
  structuredData, 
  type = 'website',
  image = '/favicon.svg'
}) => {
  useEffect(() => {
    // Set Title
    document.title = title;
    
    // Set Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    // Set Canonical
    if (canonical) {
      let linkCanonical = document.querySelector('link[rel="canonical"]');
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute('href', canonical);
    }
    
    // Structured Data
    if (structuredData) {
      let script = document.querySelector('#seo-structured-data');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('id', 'seo-structured-data');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    // Set Meta tags helper
    const setMeta = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(property.startsWith('og:') ? 'property' : 'name', property);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    };

    setMeta('og:title', title);
    setMeta('og:description', description);
    setMeta('og:type', type);
    if (image) setMeta('og:image', image);
    if (canonical) setMeta('og:url', canonical);
    
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    if (image) setMeta('twitter:image', image);

    return () => {
      // In SPAs, usually overriding the tags on the next page is sufficient.
      // We clean up structured data to prevent multiple scripts from stacking up.
      if (structuredData) {
        const script = document.querySelector('#seo-structured-data');
        if (script) {
          script.remove();
        }
      }
    };
  }, [title, description, canonical, structuredData, type, image]);

  return null;
};
