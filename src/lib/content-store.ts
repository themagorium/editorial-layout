// ===== Image Imports =====
import heroOlympics from "@/assets/hero-olympics.jpg";
import heroMilanFashion from "@/assets/hero-milan-fashion.jpg";
import heroSothebys from "@/assets/hero-sothebys.jpg";
import articleRioCarnival from "@/assets/article-rio-carnival.jpg";
import articleSuperbowl from "@/assets/article-superbowl.jpg";
import articleDubaiBoatShow from "@/assets/article-dubai-boat-show.jpg";
import articlePebbleBeach from "@/assets/article-pebble-beach.jpg";
import articleAbuDhabiArt from "@/assets/article-abu-dhabi-art.jpg";
// January 2026
import heroDavosWef from "@/assets/hero-davos-wef.jpg";
import heroSnowPolo from "@/assets/hero-snow-polo.jpg";
import heroHauteCouture from "@/assets/hero-haute-couture.jpg";
import articleOscars from "@/assets/article-oscars.jpg";
import articleArtSg from "@/assets/article-art-sg.jpg";
// (Pitti Uomo import removed — replaced by Abu Dhabi Art)
import articleAustralianOpen from "@/assets/article-australian-open.jpg";
// October 2025
import articleCambiaso from "@/assets/article-cambiaso.jpg";
import articleF1Americas from "@/assets/article-f1-americas.jpg";
import heroCapeTown from "@/assets/hero-cape-town.jpg";
import articleSailgp from "@/assets/article-sailgp.jpg";
import articleCvSummit from "@/assets/article-cv-summit.jpg";
import articleKusama from "@/assets/article-kusama.jpg";
import articleMarrakech from "@/assets/article-marrakech.jpg";
import articleEngadin from "@/assets/article-engadin.jpg";
import articleCambiasoPhoto1 from "@/assets/article-cambiaso-photo1.jpg";
import articleCambiasoPhoto2 from "@/assets/article-cambiaso-photo2.jpg";
import articlePfw from "@/assets/article-pfw.jpg";

// ===== Types =====
export type Category = 
  | "Travel" | "Yachting" | "Art & Design" | "Fashion" 
  | "Tech & AI" | "Motorsport" | "Film & Festivals" 
  | "Music" | "Golf" | "Tennis" | "Wellness" | "Equestrian" | "Sports";

export const CATEGORIES: Category[] = [
  "Travel", "Yachting", "Art & Design", "Fashion", "Tech & AI",
  "Motorsport", "Film & Festivals", "Music", "Golf", "Tennis", "Wellness", "Equestrian", "Sports"
];

export interface HeroItem {
  id: string;
  title: string;
  excerpt?: string;
  legacySlugs?: string[];
  subtitle: string;
  category: Category;
  imageUrl: string;
  videoUrl?: string;
  author?: string;
  date: string;
  featured?: boolean;
  edition: string;
  body?: ArticleBodyBlock[];
}

export interface ArticleBodyBlock {
  id: string;
  type: "text" | "heading" | "image" | "video";
  content: string;
  headingVariant?: "title" | "subsection";
  textStyle?: "normal" | "bold" | "italic" | "bold-italic";
  caption?: string;
  citation?: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  legacySlugs?: string[];
  category: Category;
  imageUrl: string;
  videoUrl?: string;
  author: string;
  date: string;
  featured?: boolean;
  body?: ArticleBodyBlock[];
  edition: string;
}

export interface AdSlot {
  id: string;
  label: string;
  position: "hero-sidebar" | "mid-feed" | "bottom-banner" | "sidebar";
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  width: number;
  height: number;
}

export interface PublishedEditorialContent {
  heroes: HeroItem[];
  articles: Article[];
  ads: AdSlot[];
  publishedAt: string;
  updatedAt?: string;
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
  const titleSlug = slugifyText(title || id);
  return `/articles/${titleSlug}--${id}`;
}

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

export function contentIdentifierMatches(item: { id: string; title: string; legacySlugs?: string[] }, identifier: string): boolean {
  const decoded = decodeURIComponent(identifier || "")
    .trim()
    .toLowerCase()
    .split("?")[0]
    .split("#")[0]
    .replace(/^\/+|\/+$/g, "");
  const candidate = decoded.split("/").pop() || decoded;
  const itemId = item.id.toLowerCase();
  const titleSlug = slugifyText(item.title || item.id);
  const legacySlugs = (item.legacySlugs || []).map((slug) => slugifyText(slug));

  if (!candidate) return false;
  if (candidate === itemId) return true;
  if (candidate === titleSlug) return true;
  if (candidate === `${titleSlug}--${itemId}`) return true;
  if (candidate.endsWith(`--${itemId}`)) return true;
  if (legacySlugs.includes(candidate)) return true;
  return hasStrongTokenOverlap(item.title, candidate);
}

export function createOctoberPatternBody(baseId: string, imageUrl?: string, videoUrl?: string): ArticleBodyBlock[] {
  return [
    {
      id: `${baseId}-seed-text`,
      type: "text",
      content: "",
    },
    createMediaSeedBlock(baseId, imageUrl, videoUrl),
  ];
}

function createMediaSeedBlock(baseId: string, imageUrl?: string, videoUrl?: string): ArticleBodyBlock {
  if (videoUrl) {
    return {
      id: `${baseId}-seed-video`,
      type: "video",
      content: videoUrl,
      caption: "Featured video",
    };
  }

  return {
    id: `${baseId}-seed-image`,
    type: "image",
    content: imageUrl || "",
    caption: imageUrl ? "Featured image" : "Upload photo or video",
  };
}

function normalizeBodyToOctoberPattern(
  baseId: string,
  body: ArticleBodyBlock[] | undefined,
  imageUrl?: string,
  videoUrl?: string,
): ArticleBodyBlock[] {
  const source = (body || []).filter(Boolean);
  const textLikeBlocks = source.filter((b) => b.type !== "image" && b.type !== "video");
  const mediaBlocks = source.filter((b) => b.type === "image" || b.type === "video");

  // Always enforce October-style sequence: text -> media -> text -> media...
  if (textLikeBlocks.length === 0) {
    return createOctoberPatternBody(baseId, imageUrl, videoUrl);
  }

  const primarySeedMedia = createMediaSeedBlock(baseId, imageUrl, videoUrl);
  const emptySeedMedia = createMediaSeedBlock(baseId, undefined, undefined);

  const normalized: ArticleBodyBlock[] = [];
  textLikeBlocks.forEach((textBlock, index) => {
    normalized.push({
      ...textBlock,
      id: `${baseId}-auto-t-${index}`,
    });
    const media = mediaBlocks[index] || (index === 0 ? primarySeedMedia : emptySeedMedia);
    normalized.push({
      ...media,
      id: `${baseId}-auto-m-${index}`,
      // Never duplicate hero/article lead media into every generated slot.
      content: mediaBlocks[index]?.content || (index === 0 ? media.content : ""),
      caption: mediaBlocks[index]?.caption || (index === 0 ? media.caption : ""),
      citation: mediaBlocks[index]?.citation || "",
    });
  });

  return normalized;
}

function normalizeHero(hero: HeroItem): HeroItem {
  return {
    ...hero,
    excerpt: hero.excerpt || hero.subtitle,
    body: normalizeBodyToOctoberPattern(hero.id, hero.body, hero.imageUrl, hero.videoUrl),
  };
}

function normalizeArticle(article: Article): Article {
  return {
    ...article,
    body: normalizeBodyToOctoberPattern(article.id, article.body, article.imageUrl, article.videoUrl),
  };
}

const DEFAULT_HEROES: HeroItem[] = [
  {
    id: "h1",
    title: "Winter Olympics XXV: Milano-Cortina 2026",
    subtitle: "The Dolomites prepare to host the world's greatest winter spectacle — a complete preview",
    category: "Travel",
    imageUrl: heroOlympics,
    date: "2026-02-06",
    edition: "2026-02",
  },
  {
    id: "h2",
    title: "Milan Fashion Week: The New Gilded Age",
    subtitle: "A front-row look at the collections defining this decade",
    category: "Fashion",
    imageUrl: heroMilanFashion,
    date: "2026-02-25",
    edition: "2026-02",
  },
  {
    id: "h3",
    title: "White Turf: Racing on Ice in St. Moritz",
    subtitle: "The world's most glamorous winter horse racing returns to the frozen lake of the Engadin",
    category: "Equestrian",
    imageUrl: heroWhiteTurf,
    date: "2026-02-15",
    edition: "2026-02",
  },
];

const DEFAULT_ARTICLES: Article[] = [
  {
    id: "a1",
    title: "Monaco Grand Prix 2026: The Crown Jewel of Motorsport",
    excerpt: "From the hairpin to the tunnel — everything you need to know about the most prestigious race on the calendar.",
    category: "Motorsport",
    imageUrl: articleMonacoGP,
    author: "James Whitfield",
    date: "2026-05-24",
    featured: true,
    edition: "2026-02",
  },
  {
    id: "a2",
    title: "Art Basel Miami Beach: Where Culture Meets Capital",
    excerpt: "Inside the galleries and private viewings that make this the world's premier contemporary art fair.",
    category: "Art & Design",
    imageUrl: articleArtBasel,
    author: "Marcus Chen",
    date: "2026-12-04",
    edition: "2026-02",
  },
  {
    id: "a3",
    title: "Cannes Film Festival: Cinema's Most Coveted Stage",
    excerpt: "The Palme d'Or contenders, the yacht parties, and the films that will define the year.",
    category: "Film & Festivals",
    imageUrl: articleCannes,
    author: "Sophie Laurent",
    date: "2026-05-12",
    edition: "2026-02",
  },
  {
    id: "a4",
    title: "Royal Ascot: The Pinnacle of British Elegance",
    excerpt: "Morning dress, millinery masterpieces, and world-class thoroughbred racing in the Royal Enclosure.",
    category: "Equestrian",
    imageUrl: articleAscot,
    author: "Elena Voss",
    date: "2026-06-16",
    edition: "2026-02",
  },
];

const DEFAULT_ADS: AdSlot[] = [
  { id: "ad1", label: "Hero Sidebar Ad", position: "hero-sidebar", width: 300, height: 250 },
  { id: "ad2", label: "Mid-Feed Banner", position: "mid-feed", width: 728, height: 90 },
  { id: "ad3", label: "Bottom Banner", position: "bottom-banner", width: 970, height: 250 },
  { id: "ad4", label: "Sidebar Ad", position: "sidebar", width: 300, height: 600 },
];

// ===== Storage & API =====
// Bump this version whenever DEFAULT content changes to invalidate stale localStorage
const CONTENT_VERSION = "5";
const PUBLISHED_CONTENT_ENDPOINT = "/api/content";
const STORAGE_KEYS = {
  heroes: "editorial_heroes",
  articles: "editorial_articles",
  ads: "editorial_ads",
  version: "editorial_content_version",
};

function isPublishedContentPayload(value: unknown): value is PublishedEditorialContent {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PublishedEditorialContent>;
  return (
    Array.isArray(candidate.heroes) &&
    Array.isArray(candidate.articles) &&
    Array.isArray(candidate.ads) &&
    typeof candidate.publishedAt === "string"
  );
}

function writePublishedContentToLocalStorage(content: PublishedEditorialContent) {
  localStorage.setItem(STORAGE_KEYS.heroes, JSON.stringify(content.heroes));
  localStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(content.articles));
  localStorage.setItem(STORAGE_KEYS.ads, JSON.stringify(content.ads));
  localStorage.setItem(STORAGE_KEYS.version, CONTENT_VERSION);
}

function ensureFreshDefaults() {
  const storedVersion = localStorage.getItem(STORAGE_KEYS.version);
  if (storedVersion !== CONTENT_VERSION) {
    localStorage.removeItem(STORAGE_KEYS.heroes);
    localStorage.removeItem(STORAGE_KEYS.articles);
    localStorage.removeItem(STORAGE_KEYS.ads);
    localStorage.setItem(STORAGE_KEYS.version, CONTENT_VERSION);
  }
}

export function getHeroes(): HeroItem[] {
  ensureFreshDefaults();
  const stored = localStorage.getItem(STORAGE_KEYS.heroes);
  const rawHeroes = stored ? (JSON.parse(stored) as HeroItem[]) : DEFAULT_HEROES;
  return rawHeroes.map(normalizeHero);
}

export function getArticles(): Article[] {
  ensureFreshDefaults();
  const stored = localStorage.getItem(STORAGE_KEYS.articles);
  const rawArticles = stored ? (JSON.parse(stored) as Article[]) : DEFAULT_ARTICLES;
  return rawArticles.map(normalizeArticle);
}

export function getAds(): AdSlot[] {
  const stored = localStorage.getItem(STORAGE_KEYS.ads);
  return stored ? JSON.parse(stored) : DEFAULT_ADS;
}

function hasRealBodyBlockContent(block: ArticleBodyBlock): boolean {
  if (block.type === "text" || block.type === "heading") {
    return Boolean((block.content || "").trim());
  }
  if (block.type === "image" || block.type === "video") {
    return Boolean((block.content || "").trim());
  }
  return false;
}

function cleanBodyForStorage(body?: ArticleBodyBlock[]): ArticleBodyBlock[] | undefined {
  if (!body || body.length === 0) return body;
  const cleaned = body.filter(hasRealBodyBlockContent);
  return cleaned.length > 0 ? cleaned : [];
}

function dedupeBodyByMediaContent(body?: ArticleBodyBlock[]): ArticleBodyBlock[] | undefined {
  if (!body || body.length === 0) return body;
  const seenMediaContent = new Set<string>();
  const deduped: ArticleBodyBlock[] = [];

  for (const block of body) {
    if (!block) continue;
    if (block.type === "image" || block.type === "video") {
      const mediaKey = `${block.type}:${(block.content || "").trim()}`;
      if (!block.content || seenMediaContent.has(mediaKey)) {
        continue;
      }
      seenMediaContent.add(mediaKey);
    }
    deduped.push(block);
  }

  return deduped;
}

export function saveHeroes(heroes: HeroItem[]) {
  const prepared = heroes.map((hero) =>
    normalizeHero({
      ...hero,
      body: cleanBodyForStorage(dedupeBodyByMediaContent(hero.body)),
    }),
  );
  localStorage.setItem(STORAGE_KEYS.heroes, JSON.stringify(prepared));
}

export function saveArticles(articles: Article[]) {
  const prepared = articles.map((article) =>
    normalizeArticle({
      ...article,
      body: cleanBodyForStorage(dedupeBodyByMediaContent(article.body)),
    }),
  );
  localStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(prepared));
}

export function saveAds(ads: AdSlot[]) {
  localStorage.setItem(STORAGE_KEYS.ads, JSON.stringify(ads));
}

export function restoreDefaultContentBackup() {
  localStorage.setItem(STORAGE_KEYS.heroes, JSON.stringify(DEFAULT_HEROES.map(normalizeHero)));
  localStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(DEFAULT_ARTICLES.map(normalizeArticle)));
  localStorage.setItem(STORAGE_KEYS.ads, JSON.stringify(DEFAULT_ADS));
  localStorage.setItem(STORAGE_KEYS.version, CONTENT_VERSION);
}

export async function publishContentSnapshot(heroes: HeroItem[], articles: Article[], ads: AdSlot[]) {
  const response = await fetch(PUBLISHED_CONTENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ heroes, articles, ads }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({} as { error?: string }));
    throw new Error(payload.error || "Publishing failed.");
  }
}

export const DEFAULT_PUBLISHED_CONTENT: {
  heroes: HeroItem[];
  articles: Article[];
  ads: AdSlot[];
} = {
  heroes: DEFAULT_HEROES.map(normalizeHero),
  articles: DEFAULT_ARTICLES.map(normalizeArticle),
  ads: DEFAULT_ADS,
};

function hasLocalEditsAvailable() {
  if (typeof window === "undefined") return false;
  const hasHeroes = Boolean(localStorage.getItem(STORAGE_KEYS.heroes));
  const hasArticles = Boolean(localStorage.getItem(STORAGE_KEYS.articles));
  return hasHeroes || hasArticles;
}

function hasPublishedStoryContent(content: { heroes: HeroItem[]; articles: Article[] }) {
  return content.heroes.length > 0 || content.articles.length > 0;
}

export async function getPublishedContentSnapshot(): Promise<{
  heroes: HeroItem[];
  articles: Article[];
  ads: AdSlot[];
}> {
  if (typeof window === "undefined") {
    return DEFAULT_PUBLISHED_CONTENT;
  }
  if (hasLocalEditsAvailable()) {
    return {
      heroes: getHeroes(),
      articles: getArticles(),
      ads: getAds(),
    };
  }
  try {
    const response = await fetch(PUBLISHED_CONTENT_ENDPOINT, { cache: "no-store" });
    if (!response.ok) return DEFAULT_PUBLISHED_CONTENT;
    const payload = await response.json().catch(() => null as unknown as {
      heroes?: HeroItem[];
      articles?: Article[];
      ads?: AdSlot[];
      payload?: {
        heroes?: HeroItem[];
        articles?: Article[];
        ads?: AdSlot[];
      };
      content?: {
        heroes?: HeroItem[];
        articles?: Article[];
        ads?: AdSlot[];
      };
    } | null);
    const raw = payload?.payload || payload?.content || payload;
    if (!raw || !Array.isArray(raw.heroes) || !Array.isArray(raw.articles) || !Array.isArray(raw.ads)) {
      return DEFAULT_PUBLISHED_CONTENT;
    }
    const normalized = {
      heroes: raw.heroes.map(normalizeHero),
      articles: raw.articles.map(normalizeArticle),
      ads: raw.ads,
    };
    if (!hasPublishedStoryContent(normalized)) {
      return DEFAULT_PUBLISHED_CONTENT;
    }
    return normalized;
  } catch {
    return DEFAULT_PUBLISHED_CONTENT;
  }
}

export function resetToDefaults() {
  localStorage.removeItem(STORAGE_KEYS.heroes);
  localStorage.removeItem(STORAGE_KEYS.articles);
  localStorage.removeItem(STORAGE_KEYS.ads);
}

export async function syncPublishedContentToLocalStorage() {
  if (typeof window === "undefined") {
    return { synced: false, configured: false };
  }
  if (hasLocalEditsAvailable()) {
    return { synced: false, configured: false };
  }

  try {
    const response = await fetch(PUBLISHED_CONTENT_ENDPOINT, { cache: "no-store" });
    if (!response.ok) return { synced: false, configured: false };

    const payload = (await response.json()) as {
      ok?: boolean;
      success?: boolean;
      content?: unknown;
      payload?: unknown;
    };

    const ok = payload.ok ?? payload.success ?? false;
    if (!ok) {
      return { synced: false, configured: false };
    }

    const published = payload.content ?? payload.payload;
    if (!isPublishedContentPayload(published)) {
      return { synced: false, configured: true };
    }
    if (!hasPublishedStoryContent(published)) {
      return { synced: false, configured: true };
    }

    writePublishedContentToLocalStorage(published);
    return {
      synced: true,
      configured: true,
      publishedAt: published.publishedAt,
    };
  } catch {
    return { synced: false, configured: false };
  }
}

export async function publishEditorialContent(
  content: Omit<PublishedEditorialContent, "publishedAt">,
  adminPassword?: string,
) {
  try {
    const response = await fetch(PUBLISHED_CONTENT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adminPassword ? { "x-admin-password": adminPassword } : {}),
      },
      body: JSON.stringify(content),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      success?: boolean;
      error?: string;
      publishedAt?: string;
      updatedAt?: string;
    };

    const ok = payload.ok ?? payload.success ?? false;
    if (!response.ok || !ok) {
      return {
        success: false,
        configured: true,
        error: payload.error || "Publish request failed.",
      };
    }

    return {
      success: true,
      configured: true,
      publishedAt: payload.publishedAt || payload.updatedAt,
    };
  } catch {
    return {
      success: false,
      configured: false,
      error: "Network error while publishing content.",
    };
  }
}

export function getEditions(): string[] {
  const heroes = getHeroes();
  const articles = getArticles();
  const editions = new Set<string>();
  heroes.forEach((h) => editions.add(h.edition));
  articles.forEach((a) => editions.add(a.edition));
  return Array.from(editions).sort().reverse();
}

export function getLatestEdition(): string {
  const editions = getEditions();
  return editions[0] || "2026-02";
}

export function getHeroesByEdition(edition: string): HeroItem[] {
  return getHeroes().filter((h) => h.edition === edition);
}

export function getArticlesByEdition(edition: string): Article[] {
  return getArticles().filter((a) => a.edition === edition);
}

export function formatEditionLabel(edition: string): string {
  const [year, month] = edition.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function createMediaTextPatternBody(articleId: string): ArticleBodyBlock[] {
  const now = Date.now();
  return [
    {
      id: `${articleId}-m1-${now}`,
      type: "image",
      content: "",
      caption: "",
      citation: "",
    },
    {
      id: `${articleId}-t1-${now + 1}`,
      type: "text",
      content: "",
    },
    {
      id: `${articleId}-m2-${now + 2}`,
      type: "image",
      content: "",
      caption: "",
      citation: "",
    },
    {
      id: `${articleId}-t2-${now + 3}`,
      type: "text",
      content: "",
    },
    {
      id: `${articleId}-m3-${now + 4}`,
      type: "image",
      content: "",
      caption: "",
      citation: "",
    },
    {
      id: `${articleId}-t3-${now + 5}`,
      type: "text",
      content: "",
    },
  ];
}

function normalizeBodyToMediaTextPattern(itemId: string, blocks?: ArticleBodyBlock[]): ArticleBodyBlock[] {
  const source = (blocks || []).filter((b) => b && b.type !== "heading");
  if (source.length === 0) return createMediaTextPatternBody(itemId);

  const media = source.filter((b) => b.type === "image" || b.type === "video");
  const text = source.filter((b) => b.type === "text");

  const normalized: ArticleBodyBlock[] = [];
  const pairs = Math.max(3, Math.min(6, Math.max(media.length, text.length)));
  const now = Date.now();

  for (let i = 0; i < pairs; i += 1) {
    const mediaBlock = media[i] || {
      id: `${itemId}-m-${now}-${i}`,
      type: "image" as const,
      content: "",
      caption: "",
      citation: "",
    };
    normalized.push({
      id: mediaBlock.id || `${itemId}-m-${now}-${i}`,
      type: mediaBlock.type === "video" ? "video" : "image",
      content: mediaBlock.content || "",
      caption: mediaBlock.caption || "",
      citation: mediaBlock.citation || "",
    });

    const textBlock = text[i] || {
      id: `${itemId}-t-${now}-${i}`,
      type: "text" as const,
      content: "",
    };
    normalized.push({
      id: textBlock.id || `${itemId}-t-${now}-${i}`,
      type: "text",
      content: textBlock.content || "",
      textStyle: textBlock.textStyle || "normal",
    });
  }

  return normalized;
}

export function enforceEditionPattern(heroes: HeroItem[], articles: Article[]) {
  const normalizedHeroes = heroes.map((hero) => ({
    ...hero,
    body: normalizeBodyToMediaTextPattern(hero.id, hero.body),
  }));
  const normalizedArticles = articles.map((article) => ({
    ...article,
    body: normalizeBodyToMediaTextPattern(article.id, article.body),
  }));
  return { heroes: normalizedHeroes, articles: normalizedArticles };
}
