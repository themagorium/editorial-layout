import { buildContentPath, type Article, type HeroItem } from "@/lib/content-store";

const SITE_URL = "https://www.themagorium.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

function upsertMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function removeStructuredDataScript() {
  const existing = document.head.querySelector('script[data-seo="article-jsonld"]');
  if (existing) existing.remove();
}

function setStructuredData(content: Article | (HeroItem & { excerpt?: string })) {
  removeStructuredDataScript();
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-seo", "article-jsonld");
  script.text = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: content.title,
    datePublished: content.date,
    dateModified: content.date,
    author: {
      "@type": "Person",
      name: content.author || "The Magorium",
    },
    publisher: {
      "@type": "Organization",
      name: "The Magorium",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/favicon.png`,
      },
    },
    image: [content.imageUrl || DEFAULT_OG_IMAGE],
    description:
      "excerpt" in content
        ? (content.excerpt || "").trim()
        : (content.subtitle || "").trim(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/article/${content.id}`,
    },
  });
  document.head.appendChild(script);
}

export function applyArticleSeo(content: Article | (HeroItem & { excerpt?: string })) {
  const description =
    ("excerpt" in content ? content.excerpt : content.subtitle || "").trim() ||
    "Read this story on The Magorium.";
  const canonicalUrl = `${SITE_URL}${buildContentPath(content.id, content.title)}`;
  const title = `${content.title} | The Magorium`;

  document.title = title;
  upsertMeta("description", description);
  upsertMeta("author", content.author || "The Magorium");
  upsertMeta("robots", "index,follow");

  upsertMeta("og:title", title, true);
  upsertMeta("og:description", description, true);
  upsertMeta("og:type", "article", true);
  upsertMeta("og:url", canonicalUrl, true);
  upsertMeta("og:image", content.imageUrl || DEFAULT_OG_IMAGE, true);

  upsertMeta("twitter:title", title);
  upsertMeta("twitter:description", description);
  upsertMeta("twitter:image", content.imageUrl || DEFAULT_OG_IMAGE);

  upsertLink("canonical", canonicalUrl);
  setStructuredData(content);
}
