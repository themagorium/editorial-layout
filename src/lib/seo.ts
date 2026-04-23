import { buildContentPath, type Article, type HeroItem } from "@/lib/content-store";

const SITE_URL = "https://www.themagorium.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const STAFF_AUTHOR_NAME = "The Magorium Editorial Staff";
const STAFF_AUTHOR_SLUG = "staff";
const STAFF_AUTHOR_SLUG_ALIASES = new Set([
  STAFF_AUTHOR_SLUG,
  "the-magorium-staff",
  "the-magorium-editorial-staff",
  "magorium-staff",
  "magorium-editorial-staff",
  "editorial-staff",
  "the-magorium",
  "magorium",
]);
const BRAND_NAME = "The Magorium";
const BRAND_ALIAS = "Magorium";
const BRAND_ALIASES = [BRAND_ALIAS, "Magorum", "The Magorium"];

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

function removeStructuredDataScript(key?: string) {
  const selector = key ? `script[data-seo="${key}"]` : "script[data-seo]";
  const existingScripts = document.head.querySelectorAll(selector);
  existingScripts.forEach((script) => script.remove());
}

function upsertStructuredDataScript(key: string, payload: unknown) {
  removeStructuredDataScript(key);
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-seo", key);
  script.text = JSON.stringify(payload);
  document.head.appendChild(script);
}

export function canonicalAuthorName(author?: string) {
  const trimmed = (author || "").trim();
  if (!trimmed) return STAFF_AUTHOR_NAME;

  const normalized = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (
    normalized === "magorium" ||
    normalized === "the magorium" ||
    normalized === "staff" ||
    normalized === "editorial staff" ||
    normalized === "magorium staff" ||
    normalized === "the magorium staff" ||
    normalized === "the magorium editorial staff"
  ) {
    return STAFF_AUTHOR_NAME;
  }

  return trimmed;
}

function slugifyAuthor(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function authorSlug(author?: string) {
  const authorName = canonicalAuthorName(author);
  if (authorName === STAFF_AUTHOR_NAME) return STAFF_AUTHOR_SLUG;
  return slugifyAuthor(authorName) || STAFF_AUTHOR_SLUG;
}

export function isStaffAuthorSlug(slug?: string) {
  const normalized = slugifyAuthor(decodeURIComponent(slug || ""));
  if (!normalized) return true;
  return STAFF_AUTHOR_SLUG_ALIASES.has(normalized);
}

export function resolveAuthorNameFromSlug(slug: string, candidateAuthors: string[] = []) {
  if (isStaffAuthorSlug(slug)) return STAFF_AUTHOR_NAME;
  const normalizedSlug = slugifyAuthor(decodeURIComponent(slug || ""));
  const canonicalCandidates = Array.from(new Set(candidateAuthors.map((name) => canonicalAuthorName(name))));
  const directMatch = canonicalCandidates.find((name) => authorSlug(name) === normalizedSlug);
  return directMatch || STAFF_AUTHOR_NAME;
}

export function getAuthorPath(author?: string) {
  return `/author/${authorSlug(author)}`;
}

function setStructuredData(
  content: Article | (HeroItem & { excerpt?: string }),
  canonicalUrl: string,
  writerName: string,
  description: string,
) {
  const writerUrl = `${SITE_URL}${getAuthorPath(writerName)}`;
  const writerEntity = writerName === STAFF_AUTHOR_NAME
    ? {
      "@type": "Organization",
      name: writerName,
      url: writerUrl,
    }
    : {
      "@type": "Person",
      name: writerName,
      url: writerUrl,
    };

  upsertStructuredDataScript("article-jsonld", {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: content.title,
    url: canonicalUrl,
    datePublished: content.date,
    dateModified: content.date,
    author: writerEntity,
    creator: writerEntity,
    publisher: {
      "@type": "Organization",
      name: "The Magorium",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/favicon.png`,
      },
    },
    image: [content.imageUrl || DEFAULT_OG_IMAGE],
    description,
    articleSection: content.category,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  });
}

function setHomeStructuredData() {
  upsertStructuredDataScript("organization-jsonld", {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    alternateName: BRAND_ALIASES,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/favicon.png`,
    },
  });

  upsertStructuredDataScript("website-jsonld", {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_NAME,
    alternateName: BRAND_ALIASES,
    url: SITE_URL,
    publisher: {
      "@type": "Organization",
      name: BRAND_NAME,
      url: SITE_URL,
    },
  });
}

export function applyHomeSeo(queryHint?: string) {
  const normalizedHint = (queryHint || "").trim();
  const title = normalizedHint
    ? `${normalizedHint} | ${BRAND_NAME} — Curated Luxury Lifestyle Magazine`
    : `${BRAND_ALIAS} | ${BRAND_NAME} — Curated Luxury Lifestyle Magazine`;
  const description = normalizedHint
    ? `${BRAND_NAME} is the official destination for searches like ${normalizedHint}, ${BRAND_ALIAS}, and Magorum. Discover luxury travel, art, fashion, culture, yachting, motorsport, and global events.`
    : `${BRAND_NAME} (also searched as ${BRAND_ALIAS} or Magorum) is a premium curated lifestyle magazine covering luxury travel, art, fashion, culture, yachting, motorsport, and global events.`;
  const keywords = [
    BRAND_NAME,
    BRAND_ALIAS,
    "Magorum",
    normalizedHint,
    "TheMagorium",
    "Magorium magazine",
    "Magorum magazine",
    "luxury lifestyle magazine",
    "luxury travel",
    "art",
    "fashion",
    "motorsport",
    "yachting",
  ].join(", ");

  document.title = title;
  upsertMeta("description", description);
  upsertMeta("author", BRAND_NAME);
  upsertMeta("keywords", keywords);
  upsertMeta("robots", "index,follow");

  upsertMeta("og:title", title, true);
  upsertMeta("og:description", description, true);
  upsertMeta("og:type", "website", true);
  upsertMeta("og:url", SITE_URL, true);
  upsertMeta("og:image", DEFAULT_OG_IMAGE, true);
  upsertMeta("og:site_name", BRAND_NAME, true);

  upsertMeta("twitter:card", "summary_large_image");
  upsertMeta("twitter:title", title);
  upsertMeta("twitter:description", description);
  upsertMeta("twitter:image", DEFAULT_OG_IMAGE);

  upsertLink("canonical", SITE_URL);
  removeStructuredDataScript();
  setHomeStructuredData();
}

export function applyArticleSeo(content: Article | (HeroItem & { excerpt?: string })) {
  const writerName = canonicalAuthorName(content.author);
  const brandName = BRAND_NAME;
  const writerUrl = `${SITE_URL}${getAuthorPath(writerName)}`;
  const storySummary =
    ("excerpt" in content ? content.excerpt : content.subtitle || "").trim() ||
    "Read this story on The Magorium.";
  const description = `${storySummary} Written by ${writerName} for ${brandName}.`;
  const canonicalUrl = `${SITE_URL}${buildContentPath(content.id, content.title)}`;
  const title = `${content.title} | ${brandName}`;
  const keywords = [
    brandName,
    "The Magorium",
    writerName,
    content.category,
    content.title,
  ]
    .map((v) => v.trim())
    .filter(Boolean)
    .join(", ");

  document.title = title;
  upsertMeta("description", description);
  upsertMeta("author", writerName);
  upsertMeta("article:author", writerUrl, true);
  upsertMeta("article:publisher", brandName, true);
  upsertMeta("keywords", keywords);
  upsertMeta("robots", "index,follow");

  upsertMeta("og:title", title, true);
  upsertMeta("og:description", description, true);
  upsertMeta("og:type", "article", true);
  upsertMeta("og:url", canonicalUrl, true);
  upsertMeta("og:image", content.imageUrl || DEFAULT_OG_IMAGE, true);
  upsertMeta("og:site_name", brandName, true);

  upsertMeta("twitter:card", "summary_large_image");
  upsertMeta("twitter:title", title);
  upsertMeta("twitter:description", description);
  upsertMeta("twitter:image", content.imageUrl || DEFAULT_OG_IMAGE);
  upsertMeta("twitter:label1", "Written by");
  upsertMeta("twitter:data1", writerName);

  upsertLink("canonical", canonicalUrl);
  removeStructuredDataScript();
  setStructuredData(content, canonicalUrl, writerName, description);
}

export function applyContributorsSeo() {
  const canonicalUrl = `${SITE_URL}/contributors`;
  const title = `Contributors | ${BRAND_NAME}`;
  const description =
    "Meet The Magorium contributors including Millie Sealana, Charlotte Thames, and editorial staff covering luxury travel, art, fashion, culture, and sport.";

  document.title = title;
  upsertMeta("description", description);
  upsertMeta("author", STAFF_AUTHOR_NAME);
  upsertMeta("robots", "index,follow");

  upsertMeta("og:title", title, true);
  upsertMeta("og:description", description, true);
  upsertMeta("og:type", "website", true);
  upsertMeta("og:url", canonicalUrl, true);
  upsertMeta("og:image", DEFAULT_OG_IMAGE, true);
  upsertMeta("og:site_name", BRAND_NAME, true);

  upsertMeta("twitter:title", title);
  upsertMeta("twitter:description", description);
  upsertMeta("twitter:image", DEFAULT_OG_IMAGE);

  upsertLink("canonical", canonicalUrl);
  removeStructuredDataScript();
  setHomeStructuredData();
}

export function applyCollectionSeo(title: string, description: string, path: string) {
  const canonicalUrl = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  document.title = title;
  upsertMeta("description", description);
  upsertMeta("author", BRAND_NAME);
  upsertMeta("robots", "index,follow");

  upsertMeta("og:title", title, true);
  upsertMeta("og:description", description, true);
  upsertMeta("og:type", "website", true);
  upsertMeta("og:url", canonicalUrl, true);
  upsertMeta("og:image", DEFAULT_OG_IMAGE, true);
  upsertMeta("og:site_name", BRAND_NAME, true);

  upsertMeta("twitter:title", title);
  upsertMeta("twitter:description", description);
  upsertMeta("twitter:image", DEFAULT_OG_IMAGE);

  upsertLink("canonical", canonicalUrl);
  removeStructuredDataScript();
  setHomeStructuredData();
}

export function applyAuthorSeo(authorName: string, storyCount: number) {
  const canonicalAuthor = canonicalAuthorName(authorName);
  const canonicalPath = getAuthorPath(canonicalAuthor);
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const title = `${canonicalAuthor} | The Magorium`;
  const description = `${storyCount} published ${
    storyCount === 1 ? "story" : "stories"
  } by ${canonicalAuthor} on The Magorium.`;

  applyCollectionSeo(title, description, canonicalPath);

  upsertStructuredDataScript("author-jsonld", {
    "@context": "https://schema.org",
    "@type": canonicalAuthor === STAFF_AUTHOR_NAME ? "Organization" : "Person",
    name: canonicalAuthor,
    url: canonicalUrl,
    mainEntityOfPage: {
      "@type": "ProfilePage",
      "@id": canonicalUrl,
    },
  });
}
