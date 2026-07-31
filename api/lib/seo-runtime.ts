export const SITE_URL = "https://www.themagorium.com";
export const BRAND_NAME = "The Magorium";
export const BRAND_ALIAS = "Magorium";
export const STAFF_AUTHOR_NAME = "The Magorium Editorial Staff";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const DEFAULT_FAVICON = `${SITE_URL}/favicon.png`;
export const DEFAULT_SEO_IMAGE = DEFAULT_OG_IMAGE;
export const HOME_SEO_DESCRIPTION =
  "The Magorium — also known as Magorium and TheMagorium — is a global curated magazine covering luxury, technology, business, sport, arts, fashion, travel, and culture. Where Curated Becomes Legend.";

// ── Slugify ────────────────────────────────────────────────────────────────
export function slugifyText(value: string): string {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Author name normalisation ──────────────────────────────────────────────
export function canonicalAuthorName(author?: string): string {
  const trimmed = (author || "").trim();
  if (!trimmed) return STAFF_AUTHOR_NAME;
  const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (
    normalized === "magorium" ||
    normalized === "the magorium" ||
    normalized === "staff" ||
    normalized === "editorial staff" ||
    normalized === "magorium staff" ||
    normalized === "the magorium staff" ||
    normalized === "the magorium editorial staff" ||
    normalized === "editor"
  ) {
    return STAFF_AUTHOR_NAME;
  }
  return trimmed;
}

export function guessAuthorNameFromSlug(slug: string): string {
  if (!slug) return STAFF_AUTHOR_NAME;
  const normalized = (slug || "").toLowerCase().trim();
  if (normalized === "staff" || normalized === "the-magorium-staff") {
    return STAFF_AUTHOR_NAME;
  }
  return slug
    .replace(/-/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getAuthorPath(author?: string): string {
  const authorName = canonicalAuthorName(author);
  if (authorName === STAFF_AUTHOR_NAME) return "/author/staff";
  const slug = slugifyText(authorName);
  return `/author/${slug || "staff"}`;
}
export function normalizeCategoryName(slug: string): string {
  const trimmed = (slug || "").trim();
  if (!trimmed || trimmed.toLowerCase() === "all") return "All";
  return trimmed
    .replace(/-/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getCategoryPath(category: string): string {
  const normalized = (category || "").trim();
  if (!normalized || normalized.toLowerCase() === "all") return "/category/all";
  return `/category/${slugifyText(normalized)}`;
}
// ── Content path builder ───────────────────────────────────────────────────
export function buildContentPath(id: string, title: string): string {
  const titleSlug = slugifyText(title || id);
  return `/articles/${titleSlug}--${id}`;
}

// ── Content identifier matching ────────────────────────────────────────────
function tokenizeForMatch(value: string): string[] {
  return slugifyText(value)
    .split("-")
    .filter((token) => token.length > 1);
}

function hasStrongTokenOverlap(title: string, candidateSlug: string): boolean {
  const candidateTokens = tokenizeForMatch(candidateSlug);
  if (candidateTokens.length < 2) return false;
  const titleTokens = new Set(tokenizeForMatch(title));
  const overlapCount = candidateTokens.filter((token) => titleTokens.has(token)).length;
  return overlapCount >= 2 && overlapCount / candidateTokens.length >= 0.6;
}

export function contentIdentifierMatches(
  item: { id: string; title: string; legacySlugs?: string[] },
  identifier: string,
): boolean {
  const decoded = decodeURIComponent(identifier || "")
    .trim()
    .toLowerCase()
    .split("?")[0]
    .split("#")[0]
    .replace(/^\/+|\/+$/g, "");
  const candidate = decoded.split("/").pop() || decoded;
  const itemId = item.id.toLowerCase();
  const titleSlug = slugifyText(item.title || item.id);
  const legacySlugs = (item.legacySlugs || []).map((s) => slugifyText(s));
  if (!candidate) return false;
  if (candidate === itemId) return true;
  if (candidate === titleSlug) return true;
  if (candidate === `${titleSlug}--${itemId}`) return true;
  if (candidate.endsWith(`--${itemId}`)) return true;
  if (legacySlugs.includes(candidate)) return true;
  return hasStrongTokenOverlap(item.title, candidate);
}

// ── HTML escaping ──────────────────────────────────────────────────────────
export function escapeHtml(str?: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Placeholder detection ──────────────────────────────────────────────────
const PLACEHOLDER_TITLE_PATTERN = /^new\s+(hero|article)(\s+\d+)?$/i;
const PLACEHOLDER_COPY_PATTERNS = [
  /^add your (first|second|third|fourth)\s+hero story$/i,
  /^add your (first|second|third|fourth)\s+article$/i,
  /^add your .* story$/i,
  /^add story text$/i,
  /^add (first|second|third|fourth) body paragraph$/i,
  /^upload photo or video$/i,
];

function isPlaceholderTitle(title?: string): boolean {
  const normalized = (title || "").trim();
  if (!normalized) return true;
  return PLACEHOLDER_TITLE_PATTERN.test(normalized);
}

function isPlaceholderCopy(value?: string): boolean {
  const text = (value || "").trim();
  if (!text) return true;
  return PLACEHOLDER_COPY_PATTERNS.some((p) => p.test(text));
}

// ── Story type ─────────────────────────────────────────────────────────────
export type SeoStory = {
  id: string;
  title: string;
  category: string;
  author: string;
  date: string;
  path: string;
  imageUrl?: string;
  excerpt?: string;
  legacySlugs?: string[];bodyText?: string[];
  seoTags?: string[];
  edition?: string; 
};

// ── Fetch published stories from the CMS API ───────────────────────────────
export async function getPublishedSeoStories(): Promise<SeoStory[]> {
  try {
    const response = await fetch(`${SITE_URL}/api/content`, {
      headers: { "User-Agent": "MagoriumSeoBot/1.0" },
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      ok?: boolean;
      success?: boolean;
      payload?: {
        heroes?: Array<{
          id: string;
          title: string;
          subtitle?: string;
          excerpt?: string;
          category: string;
          author?: string;
          date: string;
          imageUrl?: string;
          legacySlugs?: string[];
        }>;
        articles?: Array<{
          id: string;
          title: string;
          excerpt?: string;
          category: string;
          author: string;
          date: string;
          imageUrl?: string;
          legacySlugs?: string[];
        }>;
      };
      content?: {
        heroes?: Array<{
          id: string;
          title: string;
          subtitle?: string;
          excerpt?: string;
          category: string;
          author?: string;
          date: string;
          imageUrl?: string;
          legacySlugs?: string[];
        }>;
        articles?: Array<{
          id: string;
          title: string;
          excerpt?: string;
          category: string;
          author: string;
          date: string;
          imageUrl?: string;
          legacySlugs?: string[];
        }>;
      };
    };

    const raw = payload?.payload || payload?.content;
    if (!raw) return [];

    const stories: SeoStory[] = [];

    for (const hero of raw.heroes || []) {
      if (isPlaceholderTitle(hero.title)) continue;
      if (isPlaceholderCopy(hero.subtitle) && isPlaceholderCopy(hero.excerpt)) continue;
      stories.push({
        id: hero.id,
        title: hero.title,
        category: hero.category,
        author: canonicalAuthorName(hero.author),
        date: hero.date,
        path: buildContentPath(hero.id, hero.title),
        imageUrl: hero.imageUrl,
        excerpt: hero.excerpt || hero.subtitle,
        legacySlugs: hero.legacySlugs,
      });
    }

    for (const article of raw.articles || []) {
      if (isPlaceholderTitle(article.title)) continue;
      if (isPlaceholderCopy(article.excerpt)) continue;
      stories.push({
        id: article.id,
        title: article.title,
        category: article.category,
        author: canonicalAuthorName(article.author),
        date: article.date,
        path: buildContentPath(article.id, article.title),
        imageUrl: article.imageUrl,
        excerpt: article.excerpt,
        legacySlugs: article.legacySlugs,
      });
    }

    return stories.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  } catch {
    return [];
  }
}

// ── SEO HTML document renderer ─────────────────────────────────────────────
export function renderSeoDocument(options: {
  title: string;
  description: string;
  canonicalUrl: string;
  keywords?: string;
  ogType?: string;
  bodyHtml: string;
  jsonLd?: unknown;
  imageUrl?: string;
  noIndex?: boolean;
}): string {
  const {
    title,
    description,
    canonicalUrl,
    keywords,
    ogType = "website",
    bodyHtml,
    jsonLd,
    imageUrl,
    noIndex,
  } = options;

  const ogImage = imageUrl && !imageUrl.startsWith("/assets/") && !imageUrl.startsWith("data:")
    ? imageUrl
    : DEFAULT_OG_IMAGE;

  const robotsMeta = noIndex
    ? `<meta name="robots" content="noindex,follow">`
    : `<meta name="robots" content="index,follow">`;

  const jsonLdScript = jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
    : "";

  const keywordsMeta = keywords
    ? `<meta name="keywords" content="${escapeHtml(keywords)}">`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
${keywordsMeta}
<meta name="author" content="${escapeHtml(BRAND_NAME)}">
${robotsMeta}
<link rel="canonical" href="${escapeHtml(canonicalUrl)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="${escapeHtml(ogType)}">
<meta property="og:url" content="${escapeHtml(canonicalUrl)}">
<meta property="og:image" content="${escapeHtml(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="${escapeHtml(BRAND_NAME)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(ogImage)}">
${jsonLdScript}
<style>
  body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a3e;background:#fff;line-height:1.6}
  h1{font-size:2rem;margin-bottom:0.5rem;color:#1a1a3e}
  h2{font-size:1.25rem;color:#1a1a3e;margin-top:2rem}
  a{color:#b8860b;text-decoration:none}
  a:hover{text-decoration:underline}
  ul{list-style:none;padding:0}
  li{padding:0.75rem 0;border-bottom:1px solid #eee}
  .muted{color:#666;font-size:0.875rem}
  .tag{display:inline-block;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:#b8860b;border:1px solid #b8860b;padding:2px 6px;border-radius:2px;margin-right:8px}
  .brand{font-size:0.875rem;color:#666;margin-bottom:2rem}
</style>
</head>
<body>
<p class="brand"><a href="${SITE_URL}">${escapeHtml(BRAND_NAME)}</a> &middot; Where Curated Becomes Legend</p>
${bodyHtml}
</body>
</html>`;
}
