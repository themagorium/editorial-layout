const PUBLISHED_CONTENT_ENDPOINT = "/api/content";
const LATEST_SNAPSHOT_CACHE_KEY = "editorial_latest_snapshot_v1";

export type Category =
  | "Travel"
  | "Yachting"
  | "Art & Design"
  | "Fashion"
  | "Tech & AI"
  | "Motorsport"
  | "Film & Festivals"
  | "Music"
  | "Golf"
  | "Tennis"
  | "Wellness"
  | "Equestrian"
  | "Sports"
  | "Finance/ Global Economy";

export const CATEGORIES: Category[] = [
  "Travel",
  "Yachting",
  "Art & Design",
  "Fashion",
  "Tech & AI",
  "Motorsport",
  "Film & Festivals",
  "Music",
  "Golf",
  "Tennis",
  "Wellness",
  "Equestrian",
  "Sports",
  "Finance/ Global Economy",
];

export const PUBLIC_ARCHIVE_EDITIONS = ["2026-02", "2026-01", "2025-10"];

export interface ArticleBodyBlock {
  id: string;
  type: "text" | "heading" | "image" | "video";
  content: string;
  imageAlign?: "left" | "center" | "right";
  imageWidth?: "small" | "medium" | "large" | "full";
  headingVariant?: "title" | "subsection";
  textStyle?: "normal" | "bold" | "italic" | "bold-italic";
  caption?: string;
  citation?: string;
}

export interface HeroItem {
  id: string;
  title: string;
  excerpt?: string;
  legacySlugs?: string[];
  seoTags?: string[];
  subtitle: string;
  category: Category | string;
  imageUrl: string;
  videoUrl?: string;
  author?: string;
  date: string;
  featured?: boolean;
  edition: string;
  body?: ArticleBodyBlock[];
   ad?: AdSlot;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  legacySlugs?: string[];
  seoTags?: string[];
  category: Category | string;
  imageUrl: string;
  videoUrl?: string;
  author: string;
  date: string;
  featured?: boolean;
  body?: ArticleBodyBlock[];
  edition: string;
  ad?: AdSlot;
}

export interface AdSlot {
  id: string;
  label: string;
position: "hero-sidebar" | "mid-feed" | "bottom-banner" | "sidebar" | "inline-hero" | "inline-article";
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  width: number;
  height: number;
}

type LatestPublishedEditionSnapshot = {
  heroes: HeroItem[];
  articles: Article[];
  ads: AdSlot[];
  latestEdition: string;
};

function isLatestPublishedEditionSnapshot(value: unknown): value is LatestPublishedEditionSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LatestPublishedEditionSnapshot>;
  return (
    Array.isArray(candidate.heroes)
    && Array.isArray(candidate.articles)
    && Array.isArray(candidate.ads)
    && typeof candidate.latestEdition === "string"
  );
}

function hasStories(snapshot: LatestPublishedEditionSnapshot) {
  return snapshot.heroes.length > 0 || snapshot.articles.length > 0;
}


const ADMIN_PLACEHOLDER_COPY_PATTERNS = [
  /^add your (first|second|third|fourth)\s+hero story$/i,
  /^add your (first|second|third|fourth)\s+article$/i,
  /^add your .* story$/i,
  /^add your .* article$/i,
  /^add story text$/i,
  /^add (first|second|third|fourth) body paragraph$/i,
  /^upload photo or video$/i,
];

function stripAdminPlaceholderCopy(value?: string): string {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  return ADMIN_PLACEHOLDER_COPY_PATTERNS.some((pattern) => pattern.test(trimmed)) ? "" : trimmed;
}

function normalizeStoryMediaUrl(value?: string): string {
  const normalized = (value || "").trim();
  if (!normalized) return "";
  if (normalized === "undefined" || normalized === "null") return "";
  if (normalized.startsWith("blob:")) return "";
  if (normalized.includes("/favicon.png")) return "";
  if (normalized.includes("/og-image.jpg")) return "";
  if (normalized.includes("/og-image.png")) return "";
  return normalized;
}

function sanitizeLatestSnapshot(snapshot: LatestPublishedEditionSnapshot): LatestPublishedEditionSnapshot {
  const heroes = snapshot.heroes
    .map((hero) => {
      const subtitle = stripAdminPlaceholderCopy(hero.subtitle);
      const excerpt = stripAdminPlaceholderCopy(hero.excerpt) || subtitle;
      return {
        ...hero,
        subtitle,
        excerpt,
        imageUrl: normalizeStoryMediaUrl(hero.imageUrl),
        videoUrl: normalizeStoryMediaUrl(hero.videoUrl) || undefined,
      };
    })
    .filter((hero) => Boolean(hero.imageUrl || hero.videoUrl));

  const articles = snapshot.articles
    .map((article) => ({
      ...article,
      excerpt: stripAdminPlaceholderCopy(article.excerpt),
      imageUrl: normalizeStoryMediaUrl(article.imageUrl),
      videoUrl: normalizeStoryMediaUrl(article.videoUrl) || undefined,
    }))
    .filter((article) => Boolean(article.imageUrl || article.videoUrl));

  return {
    ...snapshot,
    heroes,
    articles,
  };
}

function readCachedLatestSnapshot(): LatestPublishedEditionSnapshot | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(LATEST_SNAPSHOT_CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isLatestPublishedEditionSnapshot(parsed)) return null;
    return sanitizeLatestSnapshot(parsed);
  } catch {
    return null;
  }
}

function writeCachedLatestSnapshot(snapshot: LatestPublishedEditionSnapshot) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LATEST_SNAPSHOT_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Best-effort only.
  }
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

export function formatEditionLabel(edition: string): string {
  const [year, month] = edition.split("-");
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function getCachedLatestPublishedEditionSnapshot(options?: {
  heroLimit?: number;
  articleLimit?: number;
}): LatestPublishedEditionSnapshot {
  const heroLimit = Math.max(1, options?.heroLimit || 3);
  const articleLimit = Math.max(1, options?.articleLimit || 4);
  const cached = readCachedLatestSnapshot();
  if (cached && hasStories(cached)) {
    return {
      ...cached,
      heroes: cached.heroes.slice(0, heroLimit),
      articles: cached.articles.slice(0, articleLimit),
    };
  }
  return {
    heroes: [],
    articles: [],
    ads: [],
    latestEdition: "",
  };
}

export async function getLatestPublishedEditionSnapshot(options?: {
  heroLimit?: number;
  articleLimit?: number;
}): Promise<LatestPublishedEditionSnapshot> {
  const heroLimit = Math.max(1, options?.heroLimit || 3);
  const articleLimit = Math.max(1, options?.articleLimit || 4);
  const fallback = getCachedLatestPublishedEditionSnapshot({ heroLimit, articleLimit });

  try {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = setTimeout(() => controller?.abort(), 4000);
    const response = await fetch(`${PUBLISHED_CONTENT_ENDPOINT}?view=latest&heroLimit=${heroLimit}&articleLimit=${articleLimit}`, {
      cache: "no-store",
      signal: controller?.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) return fallback;
    const payload = await response.json().catch(() => null as unknown as {
      payload?: {
        heroes?: HeroItem[];
        articles?: Article[];
        ads?: AdSlot[];
        latestEdition?: string;
      };
      content?: {
        heroes?: HeroItem[];
        articles?: Article[];
        ads?: AdSlot[];
        latestEdition?: string;
      };
    } | null);
    const raw = payload?.payload || payload?.content;
    if (!raw || !Array.isArray(raw.heroes) || !Array.isArray(raw.articles) || !Array.isArray(raw.ads)) {
      return fallback;
    }

    const latestSnapshot = sanitizeLatestSnapshot({
      heroes: raw.heroes,
      articles: raw.articles,
      ads: raw.ads,
      latestEdition: (raw.latestEdition || "").trim(),
    });
    if (hasStories(latestSnapshot)) writeCachedLatestSnapshot(latestSnapshot);
    return latestSnapshot;
  } catch {
    return fallback;
  }
}
