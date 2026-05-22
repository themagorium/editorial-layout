const CONTENT_KEY = "magorium:published-content:v1";
export const SITE_URL = "https://www.themagorium.com";
export const BRAND_NAME = "The Magorium";
export const BRAND_ALIAS = "Magorium";
export const STAFF_AUTHOR_NAME = "The Magorium Editorial Staff";
export const SEO_ASSET_VERSION = "20260522-2000";
export const DEFAULT_SEO_IMAGE = `${SITE_URL}/og-image.jpg?v=${SEO_ASSET_VERSION}`;
export const DEFAULT_FAVICON = `${SITE_URL}/favicon.ico?v=${SEO_ASSET_VERSION}`;
const DEFAULT_APPLE_ICON = `${SITE_URL}/favicon.png?v=${SEO_ASSET_VERSION}`;
let kvClientPromise: Promise<{
  get: <T>(key: string) => Promise<T | null>;
} | null> | null = null;

type BodyBlock = {
  type?: string;
  content?: string;
  imageAlign?: "left" | "center" | "right";
  imageWidth?: "small" | "medium" | "large" | "full";
};

type StoredHero = {
  id: string;
  title: string;
  excerpt?: string;
  seoTags?: string[];
  subtitle?: string;
  category?: string;
  imageUrl?: string;
  author?: string;
  date?: string;
  edition?: string;
  body?: BodyBlock[];
};

type StoredArticle = {
  id: string;
  title: string;
  excerpt?: string;
  seoTags?: string[];
  category?: string;
  imageUrl?: string;
  author?: string;
  date?: string;
  edition?: string;
  body?: BodyBlock[];
};

type StoredPayload = {
  heroes?: StoredHero[];
  articles?: StoredArticle[];
};

type ChunkedContentPointer = {
  __chunked: true;
  totalChunks: number;
  chunkPrefix: string;
};

export type SeoStory = {
  id: string;
  title: string;
  excerpt: string;
  seoTags: string[];
  category: string;
  imageUrl: string;
  author: string;
  date: string;
  edition: string;
  path: string;
  bodyText: string[];
};

const FALLBACK_STORIES: SeoStory[] = [
  {
    id: "h-cv-summit",
    title: "CV Summit 2025 - Kongresshaus Zurich (September 23-24, 2025)",
    excerpt: "A Recalibration Toward Endurance.",
    seoTags: [],
    category: "Tech & AI",
    imageUrl: DEFAULT_SEO_IMAGE,
    author: "Millie Sealana",
    date: "2025-10-06",
    edition: "2025-10",
    path: "/articles/cv-summit-2025-kongresshaus-zurich-september-23-24-2025--h-cv-summit",
    bodyText: ["CV Summit 2025 brought together global leaders in blockchain and AI in Zurich."],
  },
  {
    id: "h-f1-austin",
    title: "F1 returns to American soil in the tech haven of Austin.",
    excerpt: "Formula 1 returns to Austin with championship implications.",
    seoTags: [],
    category: "Motorsport",
    imageUrl: DEFAULT_SEO_IMAGE,
    author: "Charlotte Thames",
    date: "2025-10-06",
    edition: "2025-10",
    path: "/articles/f1-returns-to-american-soil-in-the-tech-haven-of-austin--h-f1-austin",
    bodyText: ["F1 returns to American soil in Austin for a decisive race weekend."],
  },
  {
    id: "v1-cambiaso",
    title: "132nd Hurlingham Open: La Natividad La Dolfina Establish A New Standard Under Pressure",
    excerpt: "A pivotal Hurlingham Open result with high-goal polo implications.",
    seoTags: [],
    category: "Equestrian",
    imageUrl: DEFAULT_SEO_IMAGE,
    author: "Millie Sealana",
    date: "2025-10-06",
    edition: "2025-10",
    path: "/articles/132nd-hurlingham-open-la-natividad-la-dolfina-establish-a-new-standard-under-pressure--v1-cambiaso",
    bodyText: ["The 132nd Hurlingham Open highlighted a new level of tactical maturity."],
  },
  {
    id: "h-sailgp",
    title: "SailGP: From Geneva to Cadiz",
    excerpt: "SailGP momentum builds after Lake Geneva heading toward Cadiz.",
    seoTags: [],
    category: "Yachting",
    imageUrl: DEFAULT_SEO_IMAGE,
    author: "James Whitfield",
    date: "2025-10-06",
    edition: "2025-10",
    path: "/articles/sailgp-from-geneva-to-cadiz--h-sailgp",
    bodyText: ["SailGP teams leave Geneva and prepare for the next stage in Cadiz."],
  },
  {
    id: "a1",
    title: "Rio Carnival 2026: Samba Under the Stars",
    excerpt: "Rio's global cultural showcase returns with full force.",
    seoTags: [],
    category: "Music",
    imageUrl: DEFAULT_SEO_IMAGE,
    author: "Marcus Chen",
    date: "2026-02-13",
    edition: "2026-02",
    path: "/articles/rio-carnival-2026-samba-under-the-stars--a1",
    bodyText: ["Rio Carnival 2026 returns with signature spectacle and global attention."],
  },
  {
    id: "a2",
    title: "Super Bowl LX: Stadium Lights & Bay Area Glamour",
    excerpt: "The Bay Area hosts an iconic Super Bowl week.",
    seoTags: [],
    category: "Sports",
    imageUrl: DEFAULT_SEO_IMAGE,
    author: "James Whitfield",
    date: "2026-02-08",
    edition: "2026-02",
    path: "/articles/super-bowl-lx-stadium-lights-bay-area-glamour--a2",
    bodyText: ["Super Bowl LX combines elite sport, entertainment, and luxury hospitality."],
  },
  {
    id: "a3",
    title: "Dubai International Boat Show: The Middle East's Premier Superyacht Gathering",
    excerpt: "Superyacht capital momentum in Dubai continues to rise.",
    seoTags: [],
    category: "Yachting",
    imageUrl: DEFAULT_SEO_IMAGE,
    author: "James Whitfield",
    date: "2026-02-24",
    edition: "2026-02",
    path: "/articles/dubai-international-boat-show-the-middle-easts-premier-superyacht-gathering--a3",
    bodyText: ["Dubai International Boat Show gathers the global superyacht market."],
  },
  {
    id: "a4",
    title: "AT&T Pebble Beach Pro-Am: Where Golf Meets the Pacific",
    excerpt: "A marquee golf calendar event on California's coast.",
    seoTags: [],
    category: "Golf",
    imageUrl: DEFAULT_SEO_IMAGE,
    author: "James Whitfield",
    date: "2026-02-05",
    edition: "2026-02",
    path: "/articles/at-t-pebble-beach-pro-am-where-golf-meets-the-pacific--a4",
    bodyText: ["Pebble Beach returns as one of golf's most scenic and prestigious stages."],
  },
];

function isChunkedContentPointer(value: unknown): value is ChunkedContentPointer {
  if (!value || typeof value !== "object") return false;
  const pointer = value as Partial<ChunkedContentPointer>;
  return (
    pointer.__chunked === true
    && typeof pointer.totalChunks === "number"
    && pointer.totalChunks > 0
    && pointer.totalChunks <= 5000
    && typeof pointer.chunkPrefix === "string"
    && Boolean(pointer.chunkPrefix)
  );
}

async function readChunkedPayload(
  kv: { get: <T>(key: string) => Promise<T | null> },
  pointer: ChunkedContentPointer,
): Promise<StoredPayload | null> {
  let combined = "";
  for (let index = 0; index < pointer.totalChunks; index += 1) {
    const chunk = await kv.get<string>(`${pointer.chunkPrefix}${index}`);
    if (typeof chunk !== "string") {
      return null;
    }
    combined += chunk;
  }
  try {
    return JSON.parse(combined) as StoredPayload;
  } catch {
    return null;
  }
}

function hasKvConfig() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKvClient() {
  if (!hasKvConfig()) return null;
  if (!kvClientPromise) {
    kvClientPromise = import("@vercel/kv")
      .then((module) => module.kv)
      .catch(() => null);
  }
  return kvClientPromise;
}

function extractBodyText(blocks: BodyBlock[] | undefined): string[] {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .filter((block) => block && (block.type === "text" || block.type === "heading"))
    .map((block) => (block.content || "").trim())
    .filter(Boolean);
}

function sanitizeSeoTags(tags: unknown): string[] {
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
    if (normalized.length >= 25) break;
  }
  return normalized;
}

const PLACEHOLDER_TITLE_PATTERN = /^new\s+(hero|article)(\s+\d+)?$/i;
const PLACEHOLDER_COPY_PATTERNS = [
  /^add your first hero story$/i,
  /^add your first article$/i,
  /^add story text$/i,
  /^add first body paragraph$/i,
  /^add second body paragraph$/i,
  /^add third body paragraph$/i,
  /^upload photo or video$/i,
];

function isPlaceholderCopy(value?: string): boolean {
  const text = (value || "").trim();
  if (!text) return false;
  return PLACEHOLDER_COPY_PATTERNS.some((pattern) => pattern.test(text));
}

function isPublishReadyStory(story: SeoStory): boolean {
  const title = (story.title || "").trim();
  if (!title) return false;
  if (PLACEHOLDER_TITLE_PATTERN.test(title)) return false;
  if (isPlaceholderCopy(story.excerpt)) return false;
  return true;
}

function sanitizeHero(hero: StoredHero): SeoStory {
  const author = canonicalAuthorName(hero.author);
  const title = (hero.title || "").trim() || hero.id;
  return {
    id: hero.id,
    title,
    excerpt: (hero.excerpt || hero.subtitle || "").trim(),
    seoTags: sanitizeSeoTags(hero.seoTags),
    category: (hero.category || "News").trim(),
    imageUrl: (hero.imageUrl || DEFAULT_SEO_IMAGE).trim(),
    author,
    date: (hero.date || new Date().toISOString().slice(0, 10)).trim(),
    edition: (hero.edition || "").trim(),
    path: buildContentPath(hero.id, title),
    bodyText: extractBodyText(hero.body),
  };
}

function sanitizeArticle(article: StoredArticle): SeoStory {
  const author = canonicalAuthorName(article.author);
  const title = (article.title || "").trim() || article.id;
  return {
    id: article.id,
    title,
    excerpt: (article.excerpt || "").trim(),
    seoTags: sanitizeSeoTags(article.seoTags),
    category: (article.category || "News").trim(),
    imageUrl: (article.imageUrl || DEFAULT_SEO_IMAGE).trim(),
    author,
    date: (article.date || new Date().toISOString().slice(0, 10)).trim(),
    edition: (article.edition || "").trim(),
    path: buildContentPath(article.id, title),
    bodyText: extractBodyText(article.body),
  };
}

export async function getPublishedSeoStories(): Promise<SeoStory[]> {
  try {
    const kv = await getKvClient();
    if (!kv) return FALLBACK_STORIES;
    const rawPayload = await kv.get<StoredPayload | ChunkedContentPointer>(CONTENT_KEY);
    if (!rawPayload) return FALLBACK_STORIES;
    const payload = isChunkedContentPointer(rawPayload)
      ? await readChunkedPayload(kv, rawPayload)
      : rawPayload;
    if (!payload) return FALLBACK_STORIES;

    const heroes = Array.isArray(payload.heroes) ? payload.heroes.map(sanitizeHero) : [];
    const articles = Array.isArray(payload.articles) ? payload.articles.map(sanitizeArticle) : [];
    const stories = [...heroes, ...articles]
      .filter((story) => Boolean(story.id && story.title))
      .filter(isPublishReadyStory);
    if (stories.length === 0) return FALLBACK_STORIES;
    return stories.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  } catch {
    return FALLBACK_STORIES;
  }
}

export function canonicalAuthorName(author?: string) {
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
    normalized === "the magorium editorial staff"
  ) {
    return STAFF_AUTHOR_NAME;
  }
  return trimmed;
}

export function slugifyText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildContentPath(id: string, title: string): string {
  return `/articles/${slugifyText(title || id)}--${id}`;
}

export function getAuthorPath(author?: string) {
  const canonical = canonicalAuthorName(author);
  if (canonical === STAFF_AUTHOR_NAME) return "/author/staff";
  return `/author/${slugifyText(canonical) || "staff"}`;
}

function normalizeCategorySlug(value: string): string {
  return slugifyText(value);
}

export function normalizeCategoryName(rawCategory?: string): string {
  const normalized = (rawCategory || "").trim();
  if (!normalized) return "General";
  const slug = normalizeCategorySlug(normalized);

  if (slug === "art-design") return "Art & Design";
  if (slug === "tech-ai") return "Tech & AI";
  if (slug === "film-festivals") return "Film & Festivals";
  if (slug === "motor-sport" || slug === "motor-sports") return "Motorsport";
  if (slug === "polo") return "Equestrian";
  if (slug === "finance" || slug === "global-economy" || slug === "finance-global-economy") {
    return "Finance/ Global Economy";
  }
  return normalized;
}

export function getCategorySlug(rawCategory?: string): string {
  const normalized = normalizeCategoryName(rawCategory);
  return normalizeCategorySlug(normalized);
}

export function getCategoryPath(rawCategory?: string): string {
  return `/category/${getCategorySlug(rawCategory)}`;
}

export function guessAuthorNameFromSlug(slug: string): string {
  const cleaned = slugifyText(slug || "");
  if (!cleaned || cleaned === "staff" || cleaned === "the-magorium-staff") {
    return STAFF_AUTHOR_NAME;
  }
  return cleaned
    .split("-")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function tokenOverlapMatch(title: string, candidateSlug: string): boolean {
  const titleTokens = slugifyText(title).split("-").filter((token) => token.length > 1);
  const candidateTokens = slugifyText(candidateSlug).split("-").filter((token) => token.length > 1);
  if (candidateTokens.length < 2) return false;
  const titleSet = new Set(titleTokens);
  const overlap = candidateTokens.filter((token) => titleSet.has(token)).length;
  return overlap >= 2 && overlap / candidateTokens.length >= 0.6;
}

export function contentIdentifierMatches(story: SeoStory, identifier: string): boolean {
  const decoded = decodeURIComponent(identifier || "")
    .trim()
    .toLowerCase()
    .split("?")[0]
    .split("#")[0]
    .replace(/^\/+|\/+$/g, "");
  const candidate = decoded.split("/").pop() || decoded;
  const storyId = story.id.toLowerCase();
  const storySlug = slugifyText(story.title || story.id);
  if (!candidate) return false;
  if (candidate === storyId) return true;
  if (candidate === storySlug) return true;
  if (candidate === `${storySlug}--${storyId}`) return true;
  if (candidate.endsWith(`--${storyId}`)) return true;
  return tokenOverlapMatch(story.title, candidate);
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttribute(input: string): string {
  return escapeHtml(input).replace(/`/g, "&#96;");
}

export function renderSeoDocument(params: {
  title: string;
  description: string;
  canonicalUrl: string;
  keywords: string;
  bodyHtml: string;
  ogType?: "website" | "article" | "profile";
  imageUrl?: string;
  jsonLd?: unknown;
  noIndex?: boolean;
}) {
  const {
    title,
    description,
    canonicalUrl,
    keywords,
    bodyHtml,
    ogType = "website",
    imageUrl = DEFAULT_SEO_IMAGE,
    jsonLd,
    noIndex = false,
  } = params;

  const jsonLdMarkup = jsonLd
    ? `\n    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`
    : "";
  const robots = noIndex ? "noindex,nofollow" : "index,follow,max-image-preview:large";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttribute(description)}" />
    <meta name="keywords" content="${escapeAttribute(keywords)}" />
    <meta name="author" content="${escapeAttribute(BRAND_NAME)}" />
    <meta name="robots" content="${robots}" />
    <link rel="icon" href="${escapeAttribute(DEFAULT_FAVICON)}" />
    <link rel="apple-touch-icon" href="${escapeAttribute(DEFAULT_APPLE_ICON)}" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:title" content="${escapeAttribute(title)}" />
    <meta property="og:description" content="${escapeAttribute(description)}" />
    <meta property="og:type" content="${escapeAttribute(ogType)}" />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:image" content="${escapeAttribute(imageUrl)}" />
    <meta property="og:site_name" content="${escapeAttribute(BRAND_NAME)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(title)}" />
    <meta name="twitter:description" content="${escapeAttribute(description)}" />
    <meta name="twitter:image" content="${escapeAttribute(imageUrl)}" />${jsonLdMarkup}
    <style>
      body { font-family: Georgia, "Times New Roman", serif; margin: 0; color: #111; background: #fff; }
      main { max-width: 840px; margin: 0 auto; padding: 40px 20px 56px; line-height: 1.6; }
      h1, h2 { line-height: 1.25; }
      a { color: #0a4fcf; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .muted { color: #666; font-size: 14px; }
      .tag { display: inline-block; border: 1px solid #ddd; padding: 2px 8px; border-radius: 999px; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
      ul { padding-left: 18px; }
      li { margin: 8px 0; }
    </style>
  </head>
  <body>
    <main>${bodyHtml}</main>
  </body>
</html>`;
}
