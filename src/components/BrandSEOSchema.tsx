import { useEffect } from "react";
 
const BrandSEOSchema = () => {
  useEffect(() => {
    const schemaId = "magorium-brand-schema";
    if (document.getElementById(schemaId)) return;
 
    const script = document.createElement("script");
    script.id = schemaId;
    script.type = "application/ld+json";
 
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://themagorium.com/#organization",
          "name": "The Magorium",
          "alternateName": [
            "Themagorium",
            "Magorium",
            "magroum",
            "The Magorium Magazine",
            "The Magorium Publication",
            "themagorium.com"
          ],
          "url": "https://themagorium.com",
          "description": "The Magorium — a curated global publication covering infrastructure, economics, design, and culture. Where curated becomes legend.",
          "logo": {
            "@type": "ImageObject",
            "url": "https://themagorium.com/logo.png",
            "caption": "The Magorium"
          },
          "sameAs": [
            // "https://www.instagram.com/themagorium",
            // "https://www.linkedin.com/company/themagorium",
            // "https://twitter.com/themagorium"
          ]
        },
        {
          "@type": "WebSite",
          "@id": "https://themagorium.com/#website",
          "url": "https://themagorium.com",
          "name": "The Magorium",
          "description": "The Magorium — where curated becomes legend.",
          "publisher": {
            "@id": "https://themagorium.com/#organization"
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://themagorium.com/?s={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        }
      ]
    };
 
    script.text = JSON.stringify(schemaData, null, 2);
    document.head.appendChild(script);
  }, []);
 
  return null;
};
 
export default BrandSEOSchema;
 
