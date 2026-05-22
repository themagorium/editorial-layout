import { buildContentPath, type Article, type HeroItem } from "@/lib/content-store";

const SITE_URL = "https://www.themagorium.com";
const SEO_ASSET_VERSION = "20260522-0630";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg?v=${SEO_ASSET_VERSION}`;
const DEFAULT_FAVICON = `${SITE_URL}/favicon.png?v=${SEO_ASSET_VERSION}`;
const STAFF_AUTHOR_NAME = "The Magorium Editorial Staff";
const BRAND_NAME = "The Magorium";
const BRAND_ALIAS = "Magorium";
const BRAND_ALIASES = [
  BRAND_ALIAS,
  "Magorum",
  "Magoriium",
  "The Magorium",
  "The Magoriium",
  "TheMagorium",
  "Themagorium",
  "Themagoriium",
];

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

export function getAuthorPath(author?: string) {
  const authorName = canonicalAuthorName(author);
  if (authorName === STAFF_AUTHOR_NAME) return "/author/staff";
  const slug = authorName
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `/author/${slug || "staff"}`;
}

export function getCategoryPath(category?: string) {
  const slug = (category || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `/category/${slug || "general"}`;
}

function normalizeSeoTags(tags?: string[]): string[] {
  if (!Array.isArray(tags)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const rawTag of tags) {
    const cleaned = String(rawTag || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(cleaned);
  }
  return normalized;
}

function setStructuredData(
  content: Article | (HeroItem & { excerpt?: string }),
  canonicalUrl: string,
  writerName: string,
  description: string,
  keywords: string,
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
        url: DEFAULT_FAVICON,
      },
    },
    image: [content.imageUrl || DEFAULT_OG_IMAGE],
    description,
    keywords,
    articleSection: content.category,
    about: [writerEntity],
    isPartOf: {
      "@type": "WebSite",
      name: BRAND_NAME,
      url: SITE_URL,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  });
}

function normalizeContributorStoryPaths(
  contributorStoryPaths: Record<string, string[]>,
): Record<string, string[]> {
  const normalizedMap: Record<string, string[]> = {};
  Object.entries(contributorStoryPaths).forEach(([authorName, storyPaths]) => {
    const canonicalName = canonicalAuthorName(authorName);
    const existingPaths = normalizedMap[canonicalName] || [];
    const normalizedPaths = storyPaths
      .filter(Boolean)
      .map((path) => (path.startsWith("/") ? path : `/${path}`));
    normalizedMap[canonicalName] = Array.from(new Set([...existingPaths, ...normalizedPaths]));
  });
  return normalizedMap;
}

function setHomeStructuredData(storyPaths: string[] = []) {
  upsertStructuredDataScript("organization-jsonld", {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    alternateName: BRAND_ALIASES,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: DEFAULT_FAVICON,
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

  if (storyPaths.length > 0) {
    upsertStructuredDataScript("home-itemlist-jsonld", {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: storyPaths.map((path, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}${path}`,
      })),
    });
  }
}

export function applyHomeSeo(queryHint?: string, storyPaths: string[] = []) {
  const normalizedHint = (queryHint || "").trim();
  const title = normalizedHint
    ? `${normalizedHint} | ${BRAND_NAME} | TheMagorium | Magorium`
    : `${BRAND_NAME} | TheMagorium | Magorium - A Curated Lifestyle Magazine`;
  const description =
    `${BRAND_NAME} (also searched as TheMagorium and Magorium) - A Curated Lifestyle Magazine covering travel, art, culture, fashion, motorsport, yachting, and global events.`;
  const keywords = [
    BRAND_NAME,
    BRAND_ALIAS,
    "Magorum",
    "Magoriium",
    "The Magoriium",
    normalizedHint,
    "TheMagorium",
    "Themagorium",
    "Themagoriium",
    "Magorium magazine",
    "Magorum magazine",
    "curated lifestyle magazine",
    "travel",
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
  setHomeStructuredData(storyPaths);
}

export function applyArticleSeo(content: Article | (HeroItem & { excerpt?: string })) {
  const writerName = canonicalAuthorName(content.author);
  const brandName = BRAND_NAME;
  const writerUrl = `${SITE_URL}${getAuthorPath(writerName)}`;
  const customSeoTags = normalizeSeoTags(content.seoTags);
  const storySummary =
    ("excerpt" in content ? content.excerpt : content.subtitle || "").trim() ||
    "Read this story on The Magorium.";
  const description = `${content.title} by ${writerName} for ${brandName}. ${storySummary}`;
  const canonicalUrl = `${SITE_URL}${buildContentPath(content.id, content.title)}`;
  const title = `${writerName} — ${content.title} | ${brandName}`;
  const keywords = [
    brandName,
    "The Magorium",
    writerName,
    content.category,
    content.title,
    ...customSeoTags,
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
  setStructuredData(content, canonicalUrl, writerName, description, keywords);
}

export function applyContributorsSeo(
  contributorNames: string[] = [],
  contributorStoryPaths: Record<string, string[]> = {},
) {
  const canonicalUrl = `${SITE_URL}/contributors`;
  const title = `Contributors | ${BRAND_NAME}`;
  const normalizedStoryPaths = normalizeContributorStoryPaths(contributorStoryPaths);
  const canonicalContributorNames = Array.from(
    new Set([
      ...contributorNames.map((name) => canonicalAuthorName(name)),
      ...Object.keys(normalizedStoryPaths),
    ]),
  );
  const description =
    "Meet The Magorium contributors including Millie Sealana, Charlotte Thames, and editorial staff covering luxury travel, art, fashion, culture, and sport. Discover stories by each writer and journalist.";
  const keywords = [
    "The Magorium contributors",
    "Magorium journalists",
    "Magorium writers",
    "Magorium authors",
    ...canonicalContributorNames,
  ]
    .filter(Boolean)
    .join(", ");

  document.title = title;
  upsertMeta("description", description);
  upsertMeta("author", STAFF_AUTHOR_NAME);
  upsertMeta("keywords", keywords);
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

  if (canonicalContributorNames.length > 0) {
    upsertStructuredDataScript("contributors-jsonld", {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      url: canonicalUrl,
      about: canonicalContributorNames.map((name) => ({
        "@type": name === STAFF_AUTHOR_NAME ? "Organization" : "Person",
        name,
        url: `${SITE_URL}${getAuthorPath(name)}`,
      })),
      mainEntity: {
        "@type": "ItemList",
        itemListElement: canonicalContributorNames.map((name, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": name === STAFF_AUTHOR_NAME ? "Organization" : "Person",
            name,
            url: `${SITE_URL}${getAuthorPath(name)}`,
          },
        })),
      },
    });

    upsertStructuredDataScript("contributors-profiles-jsonld", {
      "@context": "https://schema.org",
      "@graph": canonicalContributorNames.map((name) => ({
        "@type": name === STAFF_AUTHOR_NAME ? "Organization" : "Person",
        name,
        url: `${SITE_URL}${getAuthorPath(name)}`,
        mainEntityOfPage: {
          "@type": "ProfilePage",
          "@id": `${SITE_URL}${getAuthorPath(name)}`,
        },
      })),
    });

    const storyUrls = Array.from(
      new Set(canonicalContributorNames.flatMap((name) => normalizedStoryPaths[name] || [])),
    );
    if (storyUrls.length > 0) {
      upsertStructuredDataScript("contributors-story-itemlist-jsonld", {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: storyUrls.map((path, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}${path}`,
        })),
      });
    }
  }
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

export function applyAuthorSeo(authorName: string, storyCount: number, storyPaths: string[] = []) {
  const canonicalAuthor = canonicalAuthorName(authorName);
  const canonicalPath = getAuthorPath(canonicalAuthor);
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const topStorySlug = storyPaths[0]
    ? decodeURIComponent(storyPaths[0].split("/").pop() || "")
        .replace(/--[a-z0-9-]+$/i, "")
        .replace(/-/g, " ")
        .trim()
    : "";
  const topStoryLabel = topStorySlug
    ? topStorySlug.replace(/\b\w/g, (token) => token.toUpperCase())
    : "";
  const title = topStoryLabel
    ? `${canonicalAuthor} | ${topStoryLabel} | ${BRAND_NAME}`
    : `${canonicalAuthor} | ${BRAND_NAME} Journalist & Author Archive`;
  const description = `${storyCount} published ${
    storyCount === 1 ? "story" : "stories"
  } by ${canonicalAuthor} on ${BRAND_NAME}. Read credited stories written by ${canonicalAuthor}.`;
  const keywords = [
    canonicalAuthor,
    `${canonicalAuthor} journalist`,
    `${canonicalAuthor} author`,
    `${canonicalAuthor} ${BRAND_ALIAS}`,
    `${canonicalAuthor} ${BRAND_NAME}`,
    `${BRAND_NAME} contributors`,
    `${BRAND_ALIAS} contributors`,
  ].join(", ");

  applyCollectionSeo(title, description, canonicalPath);
  upsertMeta("keywords", keywords);

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

  if (storyPaths.length > 0) {
    upsertStructuredDataScript("author-itemlist-jsonld", {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: storyPaths.map((path, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}${path}`,
      })),
    });
  }
}

export function applyMagoriumBrandSeo(path = "/magorium") {
  void path;
  const canonicalUrl = `${SITE_URL}/`;
  const title = `${BRAND_NAME} | TheMagorium | Magorium - A Curated Lifestyle Magazine`;
  const description =
    `${BRAND_NAME} (also searched as TheMagorium and Magorium) - A Curated Lifestyle Magazine covering travel, art, culture, fashion, motorsport, yachting, and global events.`;
  const keywords = [
    BRAND_NAME,
    BRAND_ALIAS,
    "Magorum",
    "Magoriium",
    "The Magoriium",
    "TheMagorium",
    "Themagorium",
    "Themagoriium",
    "Magorium journalists",
    "Magorium authors",
    "Magorium archive",
  ].join(", ");

  document.title = title;
  upsertMeta("description", description);
  upsertMeta("author", BRAND_NAME);
  upsertMeta("keywords", keywords);
  upsertMeta("robots", "index,follow");

  upsertMeta("og:title", title, true);
  upsertMeta("og:description", description, true);
  upsertMeta("og:type", "website", true);
  upsertMeta("og:url", canonicalUrl, true);
  upsertMeta("og:image", DEFAULT_OG_IMAGE, true);
  upsertMeta("og:site_name", BRAND_NAME, true);

  upsertMeta("twitter:card", "summary_large_image");
  upsertMeta("twitter:title", title);
  upsertMeta("twitter:description", description);
  upsertMeta("twitter:image", DEFAULT_OG_IMAGE);

  upsertLink("canonical", canonicalUrl);
  removeStructuredDataScript();
  setHomeStructuredData();
  upsertStructuredDataScript("magorium-brand-jsonld", {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${BRAND_ALIAS} stories`,
    url: canonicalUrl,
    about: {
      "@type": "Organization",
      name: BRAND_NAME,
      alternateName: BRAND_ALIASES,
      url: SITE_URL,
    },
  });
}

export function applySeoHistorySeo(storyPaths: string[] = [], contributorNames: string[] = []) {
  const canonicalUrl = `${SITE_URL}/seo-history`;
  const title = `${BRAND_NAME} SEO History | Author & Writer Credit Archive`;
  const description =
    `Search-visible history for ${BRAND_NAME}: every published article with credited writer or journalist byline, plus linked author archives.`;
  const keywords = [
    BRAND_NAME,
    `${BRAND_ALIAS} seo history`,
    "writer credit archive",
    "journalist credit archive",
    "author byline history",
    ...contributorNames,
  ]
    .filter(Boolean)
    .join(", ");

  document.title = title;
  upsertMeta("description", description);
  upsertMeta("author", BRAND_NAME);
  upsertMeta("keywords", keywords);
  upsertMeta("robots", "index,follow");

  upsertMeta("og:title", title, true);
  upsertMeta("og:description", description, true);
  upsertMeta("og:type", "website", true);
  upsertMeta("og:url", canonicalUrl, true);
  upsertMeta("og:image", DEFAULT_OG_IMAGE, true);
  upsertMeta("og:site_name", BRAND_NAME, true);

  upsertMeta("twitter:card", "summary_large_image");
  upsertMeta("twitter:title", title);
  upsertMeta("twitter:description", description);
  upsertMeta("twitter:image", DEFAULT_OG_IMAGE);

  upsertLink("canonical", canonicalUrl);
  removeStructuredDataScript();

  upsertStructuredDataScript("seo-history-jsonld", {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${BRAND_NAME} SEO history`,
        url: canonicalUrl,
        description,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: storyPaths.map((path, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${SITE_URL}${path}`,
          })),
        },
      },
      {
        "@type": "ItemList",
        name: `${BRAND_NAME} contributor credits`,
        itemListElement: contributorNames.map((name, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": canonicalAuthorName(name) === STAFF_AUTHOR_NAME ? "Organization" : "Person",
            name: canonicalAuthorName(name),
            url: `${SITE_URL}${getAuthorPath(name)}`,
          },
        })),
      },
    ],
  });
}
