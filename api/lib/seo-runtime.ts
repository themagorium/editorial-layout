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
  legacySlugs?: string[];
  bodyText?: string[];
  bodyHeadings?: string[];
  bodyBlocks?: Array<{ type: string; content: string }>;
  seoTags?: string[];
  edition?: string;
};

type RawBodyBlock = {
  id?: string;
  type: string;
  content?: string;
};

type RawStory = {
  id: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  category: string;
  author?: string;
  date: string;
  imageUrl?: string;
  legacySlugs?: string[];
  seoTags?: string[];
  body?: RawBodyBlock[];
};

// Editions are discovered from the CMS at request time, so a new edition is
// crawlable the moment it is published. The list below is only a fallback.
const FALLBACK_EDITIONS = ["2025-10", "2026-01", "2026-02", "2026-04", "2026-06", "2026-07", "2026-09"];

async function getPublishedEditionIds(): Promise<string[]> {
  try {
    const response = await fetch(`${SITE_URL}/api/content?list=editions`, {
      headers: { "User-Agent": "MagoriumSeoBot/1.0" },
    });
    const payload = (await response.json()) as { editions?: unknown };
    const editions = Array.isArray(payload?.editions)
      ? (payload.editions as unknown[]).filter((e): e is string => typeof e === "string" && /^\d{4}-\d{2}$/.test(e))
      : [];
    return editions.length > 0 ? editions : FALLBACK_EDITIONS;
  } catch {
    return FALLBACK_EDITIONS;
  }
}

function shortHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 97) hash = (hash * 31 + value.charCodeAt(index)) | 0;
  return (hash >>> 0).toString(36) + value.length.toString(36);
}

/** A crawlable, absolute image URL for a story. Photos stored inside the
 *  story (data: URIs) are served through /api/story-image. */
export function publicStoryImageUrl(type: "hero" | "article", id: string, imageUrl?: string, body?: RawBodyBlock[]): string {
  const source =
    (imageUrl || "").trim() ||
    ((body || []).find((block) => block.type === "image" && (block.content || "").trim())?.content || "").trim();
  if (!source) return DEFAULT_OG_IMAGE;
  if (source.startsWith("data:")) {
    return `${SITE_URL}/api/story-image?type=${type}&id=${encodeURIComponent(id)}&v=${shortHash(source)}`;
  }
  if (source.startsWith("/")) return `${SITE_URL}${source}`;
  return source;
}

function extractBodyContent(body: RawBodyBlock[] | undefined): {
  bodyText: string[];
  bodyHeadings: string[];
  bodyBlocks: Array<{ type: string; content: string }>;
} {
  if (!body || !Array.isArray(body)) {
    return { bodyText: [], bodyHeadings: [], bodyBlocks: [] };
  }
  const bodyText: string[] = [];
  const bodyHeadings: string[] = [];
  const bodyBlocks: Array<{ type: string; content: string }> = [];
  for (const block of body) {
    if (!block.content || isPlaceholderCopy(block.content)) continue;
    if (block.type === "text") {
      bodyText.push(block.content);
      bodyBlocks.push({ type: "text", content: block.content });
    } else if (block.type === "heading") {
      bodyHeadings.push(block.content);
      bodyBlocks.push({ type: "heading", content: block.content });
    }
  }
  return { bodyText, bodyHeadings, bodyBlocks };
}

// ── Fetch published stories from the CMS API ───────────────────────────────
function toSeoStory(raw: RawStory, type: "hero" | "article", edition: string): SeoStory {
  const { bodyText, bodyHeadings, bodyBlocks } = extractBodyContent(raw.body);
  return {
    id: raw.id,
    title: raw.title,
    category: raw.category,
    author: canonicalAuthorName(raw.author),
    date: raw.date,
    path: buildContentPath(raw.id, raw.title),
    imageUrl: publicStoryImageUrl(type, raw.id, raw.imageUrl, raw.body),
    excerpt: type === "hero" ? raw.excerpt || raw.subtitle : raw.excerpt,
    legacySlugs: raw.legacySlugs,
    seoTags: raw.seoTags,
    bodyText,
    bodyHeadings,
    bodyBlocks,
    edition,
  };
}

export async function getPublishedSeoStories(): Promise<SeoStory[]> {
  try {
    const editions = await getPublishedEditionIds();
    // Every edition in parallel, so every story has its full body text.
    const editionResponses = await Promise.allSettled(
      editions.map((edition) =>
        fetch(`${SITE_URL}/api/content?edition=${edition}`, {
          headers: { "User-Agent": "MagoriumSeoBot/1.0" },
        }).then((r) => (r.ok ? r.json() : null))
      )
    );

    const stories: SeoStory[] = [];
    const seenIds = new Set<string>();

    editionResponses.forEach((result, index) => {
      if (result.status !== "fulfilled" || !result.value) return;
      const raw = (result.value as { content?: { heroes?: RawStory[]; articles?: RawStory[] } })?.content;
      if (!raw) return;
      for (const hero of raw.heroes || []) {
        if (seenIds.has(hero.id)) continue;
        if (isPlaceholderTitle(hero.title)) continue;
        if (isPlaceholderCopy(hero.subtitle) && isPlaceholderCopy(hero.excerpt)) continue;
        seenIds.add(hero.id);
        stories.push(toSeoStory(hero, "hero", editions[index]));
      }
      for (const article of raw.articles || []) {
        if (seenIds.has(article.id)) continue;
        if (isPlaceholderTitle(article.title)) continue;
        if (isPlaceholderCopy(article.excerpt)) continue;
        seenIds.add(article.id);
        stories.push(toSeoStory(article, "article", editions[index]));
      }
    });

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
