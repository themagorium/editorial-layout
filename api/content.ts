import type { VercelRequest, VercelResponse } from "@vercel/node";

type BodyBlock = {
  id: string;
  type: "text" | "heading" | "image" | "video";
  content: string;
  imageAlign?: "left" | "center" | "right";
  imageWidth?: "small" | "medium" | "large" | "full";
  headingVariant?: "title" | "subsection";
  textStyle?: "normal" | "bold" | "italic" | "bold-italic";
  caption?: string;
  citation?: string;
};

type HeroPayload = {
  id: string;
  title: string;
  excerpt?: string;
  legacySlugs?: string[];
  seoTags?: string[];
  subtitle: string;
  category: string;
  imageUrl: string;
  videoUrl?: string;
  secondaryImageUrl?: string;
  secondaryImageCaption?: string;
  secondaryImageCitation?: string;
  secondaryImageAlign?: "left" | "center" | "right";
  secondaryImageWidth?: "small" | "medium" | "large" | "full";
  sources?: string;
  author?: string;
  date: string;
  featured?: boolean;
  edition: string;
  body?: BodyBlock[];
};
type ArticlePayload = {
  id: string;
  title: string;
  excerpt: string;
  legacySlugs?: string[];
  seoTags?: string[];
  category: string;
  imageUrl: string;
  videoUrl?: string;
  secondaryImageUrl?: string;
  secondaryImageCaption?: string;
  secondaryImageCitation?: string;
  secondaryImageAlign?: "left" | "center" | "right";
  secondaryImageWidth?: "small" | "medium" | "large" | "full";
  sources?: string;
  author: string;
  date: string;
  featured?: boolean;
  edition: string;
  body?: BodyBlock[];
};
type AdPayload = {
  id: string;
  label: string;
  position: "hero-sidebar" | "mid-feed" | "bottom-banner" | "sidebar";
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  width: number;
  height: number;
};

type PublishPayload = {
  heroes: HeroPayload[];
  articles: ArticlePayload[];
  ads: AdPayload[];
};

type StoredPayload = PublishPayload & {
  publishedAt: string;
  updatedAt?: string;
};

type StoryType = "hero" | "article";

type EditionIndexRecord = {
  heroIds: string[];
  articleIds: string[];
  updatedAt: string;
};

type ChunkedPointer = {
  __chunked: true;
  totalChunks: number;
  chunkPrefix: string;
};

type LatestViewPayload = {
  heroes: HeroPayload[];
  articles: ArticlePayload[];
  ads: AdPayload[];
  publishedAt: string;
  updatedAt?: string;
  latestEdition: string;
};

// ===== Storage keys =====
const LEGACY_CONTENT_KEY = "magorium:published-content:v1"; // read-only migration source

const NS = "magorium:content:v3"; // v3 = per-story storage
const EDITIONS_INDEX_KEY = `${NS}:editions`; // string[] of edition ids
const ADS_KEY = `${NS}:ads`;
const LATEST_VIEW_KEY = `${NS}:latest`;
const META_KEY = `${NS}:meta`;

function editionIndexKey(edition: string): string {
  return `${NS}:edition:${edition}:index`;
}
function storyKey(type: StoryType, id: string): string {
  return `${NS}:story:${type}:${id}`;
}

// Any single stored value bigger than this gets transparently split into
// chunks under the hood. With per-story storage this should rarely trigger —
// it would take one enormous individual article to hit it — but it's kept as
// a safety net either way.
const KV_VALUE_CHUNK_SIZE = 350_000;

// Client → server upload chunking, used only for the legacy "publish the
// whole archive in one go" fallback path. Decoupled on purpose from
// KV_VALUE_CHUNK_SIZE above — conflating the two was the original bug.
const UPLOAD_CHUNK_MAX_CHARS = 700_000;
const CONTENT_UPLOAD_PREFIX = `${NS}:upload:`;

const ADMIN_PASSWORD_KEY = "ADMIN_PASSWORD";
const SITE_URL = "https://www.themagorium.com";
const INDEXNOW_KEY = "8f3d2a6b9c1e4f7ab5d8c2e1f0a9b6d3";
const INDEXNOW_KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

// ===== In-memory fallback (used only when KV isn't configured) =====
const memoryStore = new Map<string, unknown>();
const memoryChunkUploads = new Map<string, { totalChunks: number; chunks: Map<number, string> }>();

let kvClientPromise: Promise<{
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
} | null> | null = null;

const TRUSTED_WRITE_HOSTS = new Set([
  "themagorium.com",
  "www.themagorium.com",
  "themagorium.co",
  "www.themagorium.co",
  "maximillianco.com",
  "www.maximillianco.com",
  "localhost",
  "127.0.0.1",
]);
const TRUSTED_WRITE_SUFFIXES = [".vercel.app", ".vercel.sh", ".now.sh"];

function getConfiguredAdminPassword() {
  return process.env[ADMIN_PASSWORD_KEY];
}

function isKvConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function splitCsv(value?: string): string[] {
  if (!value) return [];
  return value.split(",").map((token) => token.trim().toLowerCase()).filter(Boolean);
}

function getFirstHeaderValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function normalizeHostFromHeader(raw: string): string {
  const value = raw.trim().toLowerCase();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      return new URL(value).hostname.toLowerCase();
    } catch {
      return "";
    }
  }
  const hostLike = value.split("/")[0].split("?")[0];
  const withoutPort = hostLike.includes(":") ? hostLike.split(":")[0] : hostLike;
  return withoutPort.replace(/\.$/, "");
}

function buildTrustedWriteHosts() {
  const trustedHosts = new Set(TRUSTED_WRITE_HOSTS);
  splitCsv(process.env.ADMIN_TRUSTED_HOSTS).forEach((host) => trustedHosts.add(host));
  return trustedHosts;
}

function buildTrustedWriteSuffixes() {
  return Array.from(new Set([...TRUSTED_WRITE_SUFFIXES, ...splitCsv(process.env.ADMIN_TRUSTED_HOST_SUFFIXES)]));
}

function isTrustedAdminWriteRequest(req: VercelRequest): boolean {
  if (process.env.ADMIN_TRUST_ALL_ORIGINS === "1") return true;
  const trustedHosts = buildTrustedWriteHosts();
  const trustedSuffixes = buildTrustedWriteSuffixes();
  const sourceHeader = getFirstHeaderValue(req.headers.origin) || getFirstHeaderValue(req.headers.referer);
  const sourceHost = normalizeHostFromHeader(sourceHeader);
  if (sourceHost) {
    if (trustedHosts.has(sourceHost)) return true;
    return trustedSuffixes.some((suffix) => sourceHost.length > suffix.length && sourceHost.endsWith(suffix));
  }
  if (process.env.NODE_ENV !== "production") return true;
  const destinationHost = normalizeHostFromHeader(
    getFirstHeaderValue(req.headers["x-forwarded-host"]) || getFirstHeaderValue(req.headers.host),
  );
  if (!destinationHost) return false;
  if (trustedHosts.has(destinationHost)) return true;
  return trustedSuffixes.some((suffix) => destinationHost.length > suffix.length && destinationHost.endsWith(suffix));
}

async function getKvClient() {
  if (!isKvConfigured()) return null;
  if (!kvClientPromise) {
    kvClientPromise = import("@vercel/kv")
      .then((module) => module.kv as unknown as {
        get: <T>(key: string) => Promise<T | null>;
        set: (key: string, value: unknown) => Promise<unknown>;
        del: (key: string) => Promise<unknown>;
      })
      .catch(() => null);
  }
  return kvClientPromise;
}

// ===== Generic KV helpers with transparent chunking =====

async function rawGet<T>(key: string): Promise<T | null> {
  const kv = await getKvClient();
  if (kv) return kv.get<T>(key);
  return (memoryStore.has(key) ? (memoryStore.get(key) as T) : null);
}

async function rawSet(key: string, value: unknown): Promise<void> {
  const kv = await getKvClient();
  if (kv) {
    await kv.set(key, value);
    return;
  }
  memoryStore.set(key, value);
}

async function rawDel(key: string): Promise<void> {
  const kv = await getKvClient();
  if (kv) {
    await kv.del(key);
    return;
  }
  memoryStore.delete(key);
}

function isChunkedPointer(value: unknown): value is ChunkedPointer {
  if (!value || typeof value !== "object") return false;
  const pointer = value as Partial<ChunkedPointer>;
  return (
    pointer.__chunked === true
    && typeof pointer.totalChunks === "number"
    && pointer.totalChunks > 0
    && typeof pointer.chunkPrefix === "string"
    && Boolean(pointer.chunkPrefix)
  );
}

/** Store any JSON-serializable value under `key`, chunking transparently if
 *  it's larger than KV_VALUE_CHUNK_SIZE. */
async function kvSet(key: string, value: unknown): Promise<void> {
  const serialized = JSON.stringify(value);
  if (serialized.length <= KV_VALUE_CHUNK_SIZE) {
    await rawSet(key, value);
    return;
  }
  const chunkPrefix = `${key}:chunk:`;
  const totalChunks = Math.ceil(serialized.length / KV_VALUE_CHUNK_SIZE);
  for (let index = 0; index < totalChunks; index += 1) {
    const start = index * KV_VALUE_CHUNK_SIZE;
    await rawSet(`${chunkPrefix}${index}`, serialized.slice(start, start + KV_VALUE_CHUNK_SIZE));
  }
  const pointer: ChunkedPointer = { __chunked: true, totalChunks, chunkPrefix };
  await rawSet(key, pointer);
}

/** Retrieve a value stored via kvSet, reconstructing chunks if needed. */
async function kvGet<T>(key: string): Promise<T | null> {
  const value = await rawGet<T | ChunkedPointer>(key);
  if (value === null || value === undefined) return null;
  if (!isChunkedPointer(value)) return value as T;

  let combined = "";
  for (let index = 0; index < value.totalChunks; index += 1) {
    const chunk = await rawGet<string>(`${value.chunkPrefix}${index}`);
    if (typeof chunk !== "string") throw new Error(`Missing stored chunk for key ${key}.`);
    combined += chunk;
  }
  return JSON.parse(combined) as T;
}

/** Delete a value stored via kvSet, cleaning up any chunks it used. */
async function kvDel(key: string): Promise<void> {
  const value = await rawGet<unknown>(key);
  if (isChunkedPointer(value)) {
    for (let index = 0; index < value.totalChunks; index += 1) {
      await rawDel(`${value.chunkPrefix}${index}`);
    }
  }
  await rawDel(key);
}

function ensureArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value as T[];
}

function sanitizeBody(blocks: BodyBlock[] | undefined): BodyBlock[] {
  if (!blocks || blocks.length === 0) return [];
  return blocks.filter((block) => {
    if (!block || typeof block !== "object") return false;
    const type = block.type;
    if (type !== "text" && type !== "heading" && type !== "image" && type !== "video") return false;
    if (type === "text" || type === "heading") return Boolean((block.content || "").trim());
    return true;
  });
}

function sanitizeSeoTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const rawTag of tags) {
    const cleaned = String(rawTag || "").replace(/\s+/g, " ").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(cleaned);
    if (normalized.length >= 25) break;
  }
  return normalized;
}

function sanitizeHero(hero: HeroPayload): HeroPayload {
  return {
    ...hero,
    seoTags: sanitizeSeoTags(hero.seoTags),
    body: sanitizeBody(hero.body),
  };
}

function sanitizeArticle(article: ArticlePayload): ArticlePayload {
  return {
    ...article,
    seoTags: sanitizeSeoTags(article.seoTags),
    body: sanitizeBody(article.body),
  };
}

function sanitizePayload(input: unknown): PublishPayload {
  const payload = (input || {}) as Partial<PublishPayload>;
  const heroes = ensureArray<HeroPayload>(payload.heroes).map(sanitizeHero);
  const articles = ensureArray<ArticlePayload>(payload.articles).map(sanitizeArticle);
  const ads = ensureArray<AdPayload>(payload.ads);
  return { heroes, articles, ads };
}

function slugifyText(value: string): string {
  return value.toLowerCase().trim().replace(/['"]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function buildContentPath(id: string, title: string): string {
  const slug = slugifyText(title);
  return `/articles/${slug}--${id}`;
}

function canonicalAuthorSlug(author?: string): string {
  const normalized = slugifyText(author || "");
  if (!normalized || normalized === "staff") return "staff";
  return normalized;
}

function collectIndexNowUrls(content: { heroes: HeroPayload[]; articles: ArticlePayload[]; ads: AdPayload[] }): string[] {
  const paths = new Set<string>(["/", "/archive", "/themagorium", "/magorium"]);
  const editionKeys = new Set<string>();
  content.heroes.forEach((hero) => {
    paths.add(buildContentPath(hero.id, hero.title));
    if (hero.edition) editionKeys.add(hero.edition);
    if (hero.category) paths.add(`/category/${slugifyText(hero.category)}`);
    paths.add(`/author/${canonicalAuthorSlug(hero.author)}`);
  });
  content.articles.forEach((article) => {
    paths.add(buildContentPath(article.id, article.title));
    if (article.edition) editionKeys.add(article.edition);
    if (article.category) paths.add(`/category/${slugifyText(article.category)}`);
    paths.add(`/author/${canonicalAuthorSlug(article.author)}`);
  });
  editionKeys.forEach((edition) => paths.add(`/archive/${edition}`));
  return Array.from(paths).map((path) => `${SITE_URL}${path}`);
}

async function submitIndexNow(urls: string[]) {
  if (urls.length === 0) return;
  const payload = {
    host: "www.themagorium.com",
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY_LOCATION,
    urlList: urls.slice(0, 1000),
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch {
    // best-effort only
  } finally {
    clearTimeout(timeout);
  }
}

const PLACEHOLDER_TITLE_PATTERN = /^new\s+(hero|article)(\s+\d+)?$/i;
const PLACEHOLDER_COPY_PATTERNS = [
  /^add your (first|second|third|fourth)\s+hero story$/i,
  /^add your (first|second|third|fourth)\s+article$/i,
  /^add your .* story$/i,
  /^add your .* article$/i,
  /^add story text$/i,
  /^add (first|second|third|fourth) body paragraph$/i,
  /^upload photo or video$/i,
];

function isPlaceholderCopy(value?: string): boolean {
  const text = (value || "").trim();
  if (!text) return false;
  return PLACEHOLDER_COPY_PATTERNS.some((pattern) => pattern.test(text));
}

function stripPlaceholderCopy(value?: string): string {
  const text = (value || "").trim();
  return isPlaceholderCopy(text) ? "" : text;
}

function isPublishReadyHero(hero: HeroPayload): boolean {
  const title = (hero.title || "").trim();
  if (!title || PLACEHOLDER_TITLE_PATTERN.test(title)) return false;
  if (isPlaceholderCopy(hero.subtitle)) return false;
  return true;
}

function isPublishReadyArticle(article: ArticlePayload): boolean {
  const title = (article.title || "").trim();
  if (!title || PLACEHOLDER_TITLE_PATTERN.test(title)) return false;
  if (isPlaceholderCopy(article.excerpt)) return false;
  return true;
}

function editionSortWeight(edition: string): number {
  const normalized = (edition || "").trim();
  const direct = normalized.match(/^(\d{4})-(\d{1,2})$/);
  if (direct) {
    const year = Number.parseInt(direct[1], 10);
    const month = Number.parseInt(direct[2], 10);
    if (month >= 1 && month <= 12) return year * 100 + month;
  }
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.getUTCFullYear() * 100 + (parsed.getUTCMonth() + 1);
  }
  return Number.MIN_SAFE_INTEGER;
}

function compareEditionDesc(left: string, right: string): number {
  const leftWeight = editionSortWeight(left);
  const rightWeight = editionSortWeight(right);
  if (leftWeight === rightWeight) return right.localeCompare(left);
  return rightWeight - leftWeight;
}

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function isLargeInlineDataUrl(value?: string): boolean {
  const normalized = (value || "").trim();
  return normalized.startsWith("data:") && normalized.length > 2_400_000;
}

function isInvalidMediaValue(value?: string): boolean {
  const normalized = (value || "").trim();
  if (!normalized) return true;
  if (normalized === "undefined" || normalized === "null") return true;
  if (normalized.startsWith("blob:")) return true;
  return false;
}

function isLogoFallbackAsset(value: string): boolean {
  return value.includes("/favicon.png") || value.includes("/og-image.jpg") || value.includes("/og-image.png");
}

function extractFirstBodyImageUrl(body?: BodyBlock[]): string {
  if (!Array.isArray(body)) return "";
  for (const block of body) {
    if (!block || block.type !== "image") continue;
    const candidate = normalizeLatestImageUrl(block.content);
    if (candidate) return candidate;
  }
  return "";
}

function normalizeLatestImageUrl(imageUrl?: string): string {
  const normalized = (imageUrl || "").trim();
  if (isInvalidMediaValue(normalized)) return "";
  if (isLargeInlineDataUrl(normalized)) return "";
  if (isLogoFallbackAsset(normalized)) return "";
  return normalized;
}

function normalizeLatestVideoUrl(videoUrl?: string): string | undefined {
  const normalized = (videoUrl || "").trim();
  if (isInvalidMediaValue(normalized)) return undefined;
  if (isLargeInlineDataUrl(normalized)) return undefined;
  return normalized;
}

function hasLatestDisplayMedia(entry: { imageUrl?: string; videoUrl?: string; body?: BodyBlock[] }): boolean {
  const normalizedImage = normalizeLatestImageUrl(entry.imageUrl) || extractFirstBodyImageUrl(entry.body);
  const normalizedVideo = normalizeLatestVideoUrl(entry.videoUrl);
  return Boolean(normalizedImage || normalizedVideo);
}

function toLatestHeroSummary(hero: HeroPayload): HeroPayload {
  const imageUrl = normalizeLatestImageUrl(hero.imageUrl) || extractFirstBodyImageUrl(hero.body);
  return {
    id: hero.id,
    title: hero.title,
    excerpt: stripPlaceholderCopy(hero.excerpt) || stripPlaceholderCopy(hero.subtitle),
    legacySlugs: hero.legacySlugs,
    seoTags: hero.seoTags,
    subtitle: stripPlaceholderCopy(hero.subtitle),
    category: hero.category,
    imageUrl,
    videoUrl: normalizeLatestVideoUrl(hero.videoUrl),
    secondaryImageUrl: normalizeLatestImageUrl(hero.secondaryImageUrl),
    secondaryImageCaption: hero.secondaryImageCaption,
    secondaryImageCitation: hero.secondaryImageCitation,
    secondaryImageAlign: hero.secondaryImageAlign,
    secondaryImageWidth: hero.secondaryImageWidth,
    author: hero.author,
    date: hero.date,
    featured: hero.featured,
    edition: hero.edition,
    body: [],
  };
}

function toLatestArticleSummary(article: ArticlePayload): ArticlePayload {
  const imageUrl = normalizeLatestImageUrl(article.imageUrl) || extractFirstBodyImageUrl(article.body);
  return {
    id: article.id,
    title: article.title,
    excerpt: stripPlaceholderCopy(article.excerpt),
    legacySlugs: article.legacySlugs,
    seoTags: article.seoTags,
    category: article.category,
    imageUrl,
    videoUrl: normalizeLatestVideoUrl(article.videoUrl),
    secondaryImageUrl: normalizeLatestImageUrl(article.secondaryImageUrl),
    secondaryImageCaption: article.secondaryImageCaption,
    secondaryImageCitation: article.secondaryImageCitation,
    secondaryImageAlign: article.secondaryImageAlign,
    secondaryImageWidth: article.secondaryImageWidth,
    author: article.author,
    date: article.date,
    featured: article.featured,
    edition: article.edition,
    body: [],
  };
}

function toLatestAdSummary(ad: AdPayload): AdPayload {
  return {
    id: ad.id,
    label: ad.label,
    position: ad.position,
    imageUrl: isLargeInlineDataUrl(ad.imageUrl) ? undefined : ad.imageUrl,
    videoUrl: isLargeInlineDataUrl(ad.videoUrl) ? undefined : ad.videoUrl,
    linkUrl: ad.linkUrl,
    width: ad.width,
    height: ad.height,
  };
}

function applyLatestLimits(content: LatestViewPayload, heroLimit: number, articleLimit: number): LatestViewPayload {
  return { ...content, heroes: content.heroes.slice(0, heroLimit), articles: content.articles.slice(0, articleLimit) };
}

function readFirstString(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function readNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return NaN;
}

function normalizeUploadId(value: unknown): string {
  return readFirstString(value).trim().replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
}

function normalizeEditionId(value: unknown): string {
  return readFirstString(value).trim().replace(/[^a-z0-9-]/gi, "").slice(0, 20);
}

function normalizeStoryId(value: unknown): string {
  return readFirstString(value).trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120);
}

function normalizeStoryType(value: unknown): StoryType | null {
  const normalized = readFirstString(value).trim().toLowerCase();
  return normalized === "hero" || normalized === "article" ? normalized : null;
}

// ===== Client upload-chunk storage (legacy full-archive publish fallback) =====

function getUploadMetaKey(uploadId: string): string {
  return `${CONTENT_UPLOAD_PREFIX}${uploadId}:meta`;
}
function getUploadChunkKey(uploadId: string, index: number): string {
  return `${CONTENT_UPLOAD_PREFIX}${uploadId}:chunk:${index}`;
}

async function storeUploadChunk(uploadId: string, index: number, totalChunks: number, chunk: string) {
  const kv = await getKvClient();
  if (kv) {
    await kv.set(getUploadMetaKey(uploadId), { totalChunks, updatedAt: new Date().toISOString() });
    await kv.set(getUploadChunkKey(uploadId, index), chunk);
    return;
  }
  const existing = memoryChunkUploads.get(uploadId) || { totalChunks, chunks: new Map<number, string>() };
  existing.totalChunks = totalChunks;
  existing.chunks.set(index, chunk);
  memoryChunkUploads.set(uploadId, existing);
}

async function readUploadedContent(uploadId: string): Promise<string> {
  const kv = await getKvClient();
  if (kv) {
    const meta = await kv.get<{ totalChunks?: number }>(getUploadMetaKey(uploadId));
    const totalChunks = Number(meta?.totalChunks || 0);
    if (!Number.isInteger(totalChunks) || totalChunks <= 0 || totalChunks > 5000) {
      throw new Error("Upload is incomplete or invalid.");
    }
    let combined = "";
    for (let index = 0; index < totalChunks; index += 1) {
      const chunk = await kv.get<string>(getUploadChunkKey(uploadId, index));
      if (typeof chunk !== "string") throw new Error("One or more upload chunks are missing.");
      combined += chunk;
    }
    return combined;
  }
  const upload = memoryChunkUploads.get(uploadId);
  if (!upload || !upload.totalChunks) throw new Error("Upload is incomplete or invalid.");
  let combined = "";
  for (let index = 0; index < upload.totalChunks; index += 1) {
    const chunk = upload.chunks.get(index);
    if (typeof chunk !== "string") throw new Error("One or more upload chunks are missing.");
    combined += chunk;
  }
  memoryChunkUploads.delete(uploadId);
  return combined;
}

async function verifyBearerPublishToken(token: string, adminPassword: string): Promise<boolean> {
  if (!token || !adminPassword) return false;
  try {
    const tokenModule = await import("./lib/publish-token.js");
    return tokenModule.verifyPublishToken(token, adminPassword);
  } catch {
    return false;
  }
}

async function authorized(req: VercelRequest): Promise<boolean> {
  const configured = getConfiguredAdminPassword();
  if (!configured) return false;
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const normalizedAuth = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const bearer = (normalizedAuth || "").replace(/^Bearer\s+/i, "").trim();
  if (bearer && (await verifyBearerPublishToken(bearer, configured))) return true;
  const directHeader = req.headers["x-admin-password"];
  const providedDirect = Array.isArray(directHeader) ? directHeader[0] : directHeader;
  if ((providedDirect || "").trim() === configured) return true;
  return false;
}

// ===== Per-story storage layer =====

async function getEditionsIndex(): Promise<string[]> {
  const stored = await kvGet<string[]>(EDITIONS_INDEX_KEY);
  return Array.isArray(stored) ? stored : [];
}
async function setEditionsIndex(editions: string[]): Promise<void> {
  await kvSet(EDITIONS_INDEX_KEY, Array.from(new Set(editions)).sort(compareEditionDesc));
}

async function getEditionIndex(edition: string): Promise<EditionIndexRecord | null> {
  return kvGet<EditionIndexRecord>(editionIndexKey(edition));
}
async function setEditionIndex(edition: string, record: EditionIndexRecord): Promise<void> {
  await kvSet(editionIndexKey(edition), record);
}
async function deleteEditionIndex(edition: string): Promise<void> {
  await kvDel(editionIndexKey(edition));
}

async function getStory<T>(type: StoryType, id: string): Promise<T | null> {
  return kvGet<T>(storyKey(type, id));
}
async function setStory(type: StoryType, id: string, value: unknown): Promise<void> {
  await kvSet(storyKey(type, id), value);
}
async function deleteStory(type: StoryType, id: string): Promise<void> {
  await kvDel(storyKey(type, id));
}

async function getAdsContent(): Promise<AdPayload[]> {
  return (await kvGet<AdPayload[]>(ADS_KEY)) || [];
}
async function setAdsContent(ads: AdPayload[]): Promise<void> {
  await kvSet(ADS_KEY, ads);
}

async function getMeta(): Promise<{ publishedAt: string; updatedAt?: string } | null> {
  return kvGet<{ publishedAt: string; updatedAt?: string }>(META_KEY);
}
async function setMeta(meta: { publishedAt: string; updatedAt?: string }): Promise<void> {
  await kvSet(META_KEY, meta);
}

async function getLatestView(): Promise<LatestViewPayload | null> {
  return kvGet<LatestViewPayload>(LATEST_VIEW_KEY);
}
async function setLatestView(payload: LatestViewPayload): Promise<void> {
  await kvSet(LATEST_VIEW_KEY, payload);
}

/** Fetch every hero + article for one edition, each read from its own key
 *  in parallel. This never grows heavier per-story regardless of how many
 *  OTHER stories exist in other editions — or even in this same edition. */
async function getEditionContent(edition: string): Promise<{ heroes: HeroPayload[]; articles: ArticlePayload[]; updatedAt?: string } | null> {
  const index = await getEditionIndex(edition);
  if (!index) return null;
  const [heroes, articles] = await Promise.all([
    Promise.all(index.heroIds.map((id) => getStory<HeroPayload>("hero", id))),
    Promise.all(index.articleIds.map((id) => getStory<ArticlePayload>("article", id))),
  ]);
  return {
    heroes: heroes.filter((h): h is HeroPayload => Boolean(h)),
    articles: articles.filter((a): a is ArticlePayload => Boolean(a)),
    updatedAt: index.updatedAt,
  };
}

/** Rebuilds the small "latest" payload the public homepage reads, by walking
 *  editions newest-first and stopping at the first one with ready content.
 *  Touches at most one or two editions' worth of stories — never the archive. */
async function rebuildLatestView(publishedAt: string, updatedAt: string): Promise<void> {
  const editions = (await getEditionsIndex()).sort(compareEditionDesc);
  let latestEdition = "";
  let latestHeroes: HeroPayload[] = [];
  let latestArticles: ArticlePayload[] = [];
  for (const edition of editions) {
    const content = await getEditionContent(edition);
    if (!content) continue;
    const readyHeroes = content.heroes.filter(isPublishReadyHero).filter(hasLatestDisplayMedia);
    const readyArticles = content.articles.filter(isPublishReadyArticle).filter(hasLatestDisplayMedia);
    if (readyHeroes.length > 0 || readyArticles.length > 0) {
      latestEdition = edition;
      latestHeroes = readyHeroes;
      latestArticles = readyArticles;
      break;
    }
  }
  const ads = await getAdsContent();
  await setLatestView({
    heroes: latestHeroes.map(toLatestHeroSummary),
    articles: latestArticles.map(toLatestArticleSummary),
    ads: ads.map(toLatestAdSummary),
    publishedAt,
    updatedAt,
    latestEdition,
  });
}

/** Writes (or deletes) a single story and keeps its edition's index in sync. */
async function upsertStory(type: StoryType, edition: string, story: HeroPayload | ArticlePayload, stamp: string): Promise<void> {
  await setStory(type, story.id, story);
  const index = (await getEditionIndex(edition)) || { heroIds: [], articleIds: [], updatedAt: stamp };
  if (type === "hero" && !index.heroIds.includes(story.id)) index.heroIds.push(story.id);
  if (type === "article" && !index.articleIds.includes(story.id)) index.articleIds.push(story.id);
  index.updatedAt = stamp;
  await setEditionIndex(edition, index);
  const editions = await getEditionsIndex();
  if (!editions.includes(edition)) await setEditionsIndex([...editions, edition]);
}

async function removeStory(type: StoryType, edition: string, id: string): Promise<void> {
  await deleteStory(type, id);
  const index = await getEditionIndex(edition);
  if (!index) return;
  if (type === "hero") index.heroIds = index.heroIds.filter((existing) => existing !== id);
  if (type === "article") index.articleIds = index.articleIds.filter((existing) => existing !== id);
  if (index.heroIds.length === 0 && index.articleIds.length === 0) {
    await deleteEditionIndex(edition);
    const editions = await getEditionsIndex();
    await setEditionsIndex(editions.filter((e) => e !== edition));
  } else {
    index.updatedAt = new Date().toISOString();
    await setEditionIndex(edition, index);
  }
}

/** Full-archive write. MERGE-ONLY: every hero/article in the payload is
 *  written to its own key and added to its edition's index, but nothing that
 *  is missing from the payload is ever deleted. A partial or stale payload
 *  (one edition, hard-coded defaults, an old browser copy) used to wipe every
 *  other edition from the live site — that can no longer happen. Deleting is
 *  only possible through the explicit `delete-story` / `delete-edition`
 *  phases, and those snapshot the site first. */
async function writeContentAcrossEditions(content: PublishPayload, publishedAt: string, updatedAt: string): Promise<void> {
  const byEdition = new Map<string, { heroes: HeroPayload[]; articles: ArticlePayload[] }>();
  content.heroes.forEach((hero) => {
    const key = hero.edition || "unknown";
    const bucket = byEdition.get(key) || { heroes: [], articles: [] };
    bucket.heroes.push(hero);
    byEdition.set(key, bucket);
  });
  content.articles.forEach((article) => {
    const key = article.edition || "unknown";
    const bucket = byEdition.get(key) || { heroes: [], articles: [] };
    bucket.articles.push(article);
    byEdition.set(key, bucket);
  });

  for (const [edition, bucket] of byEdition.entries()) {
    const previousIndex = await getEditionIndex(edition);
    const heroIds = [...(previousIndex?.heroIds || [])];
    const articleIds = [...(previousIndex?.articleIds || [])];
    bucket.heroes.forEach((h) => { if (!heroIds.includes(h.id)) heroIds.push(h.id); });
    bucket.articles.forEach((a) => { if (!articleIds.includes(a.id)) articleIds.push(a.id); });
    await Promise.all([
      ...bucket.heroes.map((hero) => setStory("hero", hero.id, hero)),
      ...bucket.articles.map((article) => setStory("article", article.id, article)),
    ]);
    await setEditionIndex(edition, { heroIds, articleIds, updatedAt });
  }

  const previousEditions = await getEditionsIndex();
  await setEditionsIndex([...previousEditions, ...byEdition.keys()]);
  // Only replace ads when the payload actually carries some.
  if (content.ads.length > 0) await setAdsContent(content.ads);
  await setMeta({ publishedAt, updatedAt });
  await rebuildLatestView(publishedAt, updatedAt);
}

/** The old destructive full-archive diff, kept only for restoring a snapshot
 *  (where "make the site exactly this" is the intent). Never called from a
 *  publish path. */
async function replaceContentAcrossEditions(content: PublishPayload, publishedAt: string, updatedAt: string): Promise<void> {
  const byEdition = new Map<string, { heroes: HeroPayload[]; articles: ArticlePayload[] }>();
  content.heroes.forEach((hero) => {
    const key = hero.edition || "unknown";
    const bucket = byEdition.get(key) || { heroes: [], articles: [] };
    bucket.heroes.push(hero);
    byEdition.set(key, bucket);
  });
  content.articles.forEach((article) => {
    const key = article.edition || "unknown";
    const bucket = byEdition.get(key) || { heroes: [], articles: [] };
    bucket.articles.push(article);
    byEdition.set(key, bucket);
  });

  const previousEditions = await getEditionsIndex();
  const nextEditions = Array.from(byEdition.keys());

  // Editions removed entirely (e.g. "Delete Edition" then Save).
  for (const edition of previousEditions.filter((e) => !nextEditions.includes(e))) {
    const index = await getEditionIndex(edition);
    if (index) {
      await Promise.all([
        ...index.heroIds.map((id) => deleteStory("hero", id)),
        ...index.articleIds.map((id) => deleteStory("article", id)),
      ]);
    }
    await deleteEditionIndex(edition);
  }

  // Editions present: diff individual stories, write current ones.
  for (const [edition, bucket] of byEdition.entries()) {
    const previousIndex = await getEditionIndex(edition);
    const nextHeroIds = bucket.heroes.map((h) => h.id);
    const nextArticleIds = bucket.articles.map((a) => a.id);

    if (previousIndex) {
      const removedHeroIds = previousIndex.heroIds.filter((id) => !nextHeroIds.includes(id));
      const removedArticleIds = previousIndex.articleIds.filter((id) => !nextArticleIds.includes(id));
      await Promise.all([
        ...removedHeroIds.map((id) => deleteStory("hero", id)),
        ...removedArticleIds.map((id) => deleteStory("article", id)),
      ]);
    }

    await Promise.all([
      ...bucket.heroes.map((hero) => setStory("hero", hero.id, hero)),
      ...bucket.articles.map((article) => setStory("article", article.id, article)),
    ]);

    await setEditionIndex(edition, { heroIds: nextHeroIds, articleIds: nextArticleIds, updatedAt });
  }

  await setEditionsIndex(nextEditions);
  await setAdsContent(content.ads);
  await setMeta({ publishedAt, updatedAt });
  await rebuildLatestView(publishedAt, updatedAt);
}

/** Read-only migration source from the old single-blob format. */
async function getLegacyBlob(): Promise<StoredPayload | null> {
  const kv = await getKvClient();
  if (kv) {
    const stored = await kv.get<StoredPayload | ChunkedPointer>(LEGACY_CONTENT_KEY);
    if (!stored) return null;
    if (!isChunkedPointer(stored)) return stored as StoredPayload;
    let combined = "";
    for (let index = 0; index < stored.totalChunks; index += 1) {
      const chunk = await kv.get<string>(`${stored.chunkPrefix}${index}`);
      if (typeof chunk !== "string") throw new Error("Legacy content is missing one or more stored chunks.");
      combined += chunk;
    }
    return JSON.parse(combined) as StoredPayload;
  }
  return null;
}

/** Self-healing: if per-story storage is empty but an old single-blob
 *  payload exists, split it out. Safe to call every time — a no-op once
 *  migrated. */
async function migrateLegacyBlobIfNeeded(): Promise<void> {
  const existingEditions = await getEditionsIndex();
  if (existingEditions.length > 0) return;
  const legacy = await getLegacyBlob();
  if (!legacy) return;
  await writeContentAcrossEditions(sanitizePayload(legacy), legacy.publishedAt, legacy.updatedAt || legacy.publishedAt);
}

/** Reassembles the full archive — used only by the legacy unscoped GET.
 *  Prefer `?edition=`, `?storyId=`, or `?view=latest` wherever possible. */
async function getFullContent(): Promise<StoredPayload | null> {
  await migrateLegacyBlobIfNeeded();
  const editions = await getEditionsIndex();
  if (editions.length === 0) return null;
  const heroes: HeroPayload[] = [];
  const articles: ArticlePayload[] = [];
  for (const edition of editions) {
    const content = await getEditionContent(edition);
    if (!content) continue;
    heroes.push(...content.heroes);
    articles.push(...content.articles);
  }
  const ads = await getAdsContent();
  const meta = (await getMeta()) || { publishedAt: new Date(0).toISOString() };
  return { heroes, articles, ads, publishedAt: meta.publishedAt, updatedAt: meta.updatedAt };
}

// ===== Automatic site snapshots =====
// "published": taken AFTER every successful publish, so the newest one is
//   always an exact copy of the last published site. This is what the admin
//   "Restore Backup" button restores.
// "safety": taken BEFORE a delete or restore, so even those can be undone.
// Restore with POST { phase: "restore-backup", backupId }.
const BACKUPS_INDEX_KEY = `${NS}:backups`;
const MAX_BACKUPS = 12;
type BackupKind = "published" | "safety";
type BackupEntry = { id: string; createdAt: string; reason: string; kind?: BackupKind; editions: string[]; stories: number };

function backupKey(id: string): string {
  return `${NS}:backup:${id}`;
}

async function listBackups(): Promise<BackupEntry[]> {
  return ensureArray<BackupEntry>(await kvGet<BackupEntry[]>(BACKUPS_INDEX_KEY));
}

async function snapshotSite(reason: string, kind: BackupKind = "safety"): Promise<BackupEntry | null> {
  const content = await getFullContent();
  if (!content || (content.heroes.length === 0 && content.articles.length === 0)) return null;
  const createdAt = new Date().toISOString();
  const entry: BackupEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    reason,
    kind,
    editions: await getEditionsIndex(),
    stories: content.heroes.length + content.articles.length,
  };
  await kvSet(backupKey(entry.id), content);
  const backups = [entry, ...(await listBackups())];
  for (const old of backups.slice(MAX_BACKUPS)) await kvDel(backupKey(old.id));
  await kvSet(BACKUPS_INDEX_KEY, backups.slice(0, MAX_BACKUPS));
  return entry;
}

/** Snapshot of the site exactly as it now stands, right after a publish. */
async function snapshotPublished(reason: string): Promise<BackupEntry | null> {
  return snapshotSite(reason, "published");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    try {
      const queryView = readFirstString(req.query?.view).trim().toLowerCase();
      const queryEdition = normalizeEditionId(req.query?.edition);
      const queryStoryId = normalizeStoryId(req.query?.storyId);
      const queryStoryType = normalizeStoryType(req.query?.storyType);

      // Single story — the smallest possible read.
      if (queryStoryId && queryStoryType) {
        await migrateLegacyBlobIfNeeded();
        const story = await getStory(queryStoryType, queryStoryId);
        res.status(200).json({ ok: true, success: true, configured: isKvConfigured(), content: { story } });
        return;
      }

      // One edition's worth of stories, each fetched from its own key.
      if (queryEdition) {
        await migrateLegacyBlobIfNeeded();
        const record = await getEditionContent(queryEdition);
        const ads = await getAdsContent();
        res.status(200).json({
          ok: true,
          success: true,
          configured: isKvConfigured(),
          content: { heroes: record?.heroes || [], articles: record?.articles || [], ads, edition: queryEdition },
        });
        return;
      }

      // Public homepage — small, pre-built payload.
      if (queryView === "latest") {
        res.setHeader("Cache-Control", "public, s-maxage=5, stale-while-revalidate=30");
        const heroLimit = parsePositiveInt(readFirstString(req.query?.heroLimit), 3);
        const articleLimit = parsePositiveInt(readFirstString(req.query?.articleLimit), 4);
        await migrateLegacyBlobIfNeeded();
        const latest = await getLatestView();
        const limited = latest ? applyLatestLimits(latest, heroLimit, articleLimit) : null;
        res.status(200).json({ ok: true, success: true, configured: isKvConfigured(), content: limited, payload: limited });
        return;
      }
// SEO/bot view — lightweight summaries only (no body content), across
      // all editions. Previously this fell through to the full unscoped
      // legacy branch below, which reconstructs every story's full body
      // across every edition — a multi-MB payload taking 15+ seconds.
      if (queryView === "seo") {
        await migrateLegacyBlobIfNeeded();
        const editions = await getEditionsIndex();
        const heroes: HeroPayload[] = [];
        const articles: ArticlePayload[] = [];
        for (const edition of editions) {
          const content = await getEditionContent(edition);
          if (!content) continue;
          heroes.push(...content.heroes);
          articles.push(...content.articles);
        }
        const ads = await getAdsContent();
        res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
        res.status(200).json({
          ok: true,
          success: true,
          configured: isKvConfigured(),
          content: {
            heroes: heroes.map(toLatestHeroSummary),
            articles: articles.map(toLatestArticleSummary),
            ads: ads.map(toLatestAdSummary),
          },
        });
        return;
      }

      // storyType filter without a storyId — e.g. "give me all heroes" or
      // "all articles" for a category page. Same fix: lightweight summaries,
      // not the full unscoped archive.
      if (queryStoryType && !queryStoryId) {
        await migrateLegacyBlobIfNeeded();
        const editions = await getEditionsIndex();
        const heroes: HeroPayload[] = [];
        const articles: ArticlePayload[] = [];
        for (const edition of editions) {
          const content = await getEditionContent(edition);
          if (!content) continue;
          heroes.push(...content.heroes);
          articles.push(...content.articles);
        }
        const ads = await getAdsContent();
        res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=120");
        res.status(200).json({
          ok: true,
          success: true,
          configured: isKvConfigured(),
          content: {
            heroes: queryStoryType === "hero" ? heroes.map(toLatestHeroSummary) : [],
            articles: queryStoryType === "article" ? articles.map(toLatestArticleSummary) : [],
            ads: ads.map(toLatestAdSummary),
          },
        });
        return;
      }
      // Admin-only list of automatic snapshots (ids for "restore-backup").
      if (readFirstString(req.query?.list).trim().toLowerCase() === "backups") {
        if (!(await authorized(req))) {
          res.status(401).json({ ok: false, success: false, configured: isKvConfigured(), error: "Unauthorized." });
          return;
        }
        res.status(200).json({ ok: true, success: true, configured: isKvConfigured(), backups: await listBackups() });
        return;
      }

      // Lightweight edition list — no story content, useful for an edition picker.
      if (readFirstString(req.query?.list).trim().toLowerCase() === "editions") {
        await migrateLegacyBlobIfNeeded();
        const editions = await getEditionsIndex();
        res.status(200).json({ ok: true, success: true, configured: isKvConfigured(), editions: [...editions].sort(compareEditionDesc) });
        return;
      }

      // Legacy unscoped path: full archive, for backward compatibility only.
      const content = await getFullContent();
      res.status(200).json({ ok: true, success: true, configured: isKvConfigured(), content, payload: content });
      return;
    } catch (error) {
      res.status(500).json({
        ok: false,
        success: false,
        configured: isKvConfigured(),
        error: error instanceof Error ? error.message : "Failed to load published content.",
      });
      return;
    }
  }

  if (req.method === "POST") {
    if (!isTrustedAdminWriteRequest(req)) {
      res.status(403).json({ success: false, configured: isKvConfigured(), error: "Untrusted admin origin." });
      return;
    }
    if (!(await authorized(req))) {
      res.status(401).json({ success: false, configured: isKvConfigured(), error: "Unauthorized." });
      return;
    }

    try {
      const phase = readFirstString((req.body as { phase?: string } | undefined)?.phase).trim().toLowerCase();

      // ---- Save ONE story (smallest possible write) ----
      if (phase === "story") {
        const edition = normalizeEditionId((req.body as { edition?: unknown })?.edition);
        const storyType = normalizeStoryType((req.body as { storyType?: unknown })?.storyType);
        const rawStory = (req.body as { story?: unknown })?.story;
        if (!edition || !storyType || !rawStory || typeof rawStory !== "object") {
          res.status(400).json({ ok: false, success: false, configured: isKvConfigured(), error: "Missing edition, storyType, or story." });
          return;
        }
        const sanitized = storyType === "hero" ? sanitizeHero(rawStory as HeroPayload) : sanitizeArticle(rawStory as ArticlePayload);
        const stamp = new Date().toISOString();
        await migrateLegacyBlobIfNeeded();
        await upsertStory(storyType, edition, sanitized, stamp);
        const meta = (await getMeta()) || { publishedAt: stamp };
        await setMeta({ publishedAt: meta.publishedAt, updatedAt: stamp });
        await rebuildLatestView(meta.publishedAt, stamp);
        // Bulk saves send snapshot:false per story and one "snapshot" call at the end.
        if ((req.body as { snapshot?: unknown })?.snapshot !== false) {
          await snapshotPublished(`published ${storyType} ${sanitized.title || sanitized.id} (${edition})`);
        }
        void submitIndexNow(
          collectIndexNowUrls(
            storyType === "hero"
              ? { heroes: [sanitized as HeroPayload], articles: [], ads: [] }
              : { heroes: [], articles: [sanitized as ArticlePayload], ads: [] },
          ),
        );
        res.status(200).json({ ok: true, success: true, configured: isKvConfigured(), publishedAt: meta.publishedAt, updatedAt: stamp });
        return;
      }

      // ---- Delete ONE story ----
      if (phase === "delete-story") {
        const edition = normalizeEditionId((req.body as { edition?: unknown })?.edition);
        const storyType = normalizeStoryType((req.body as { storyType?: unknown })?.storyType);
        const id = normalizeStoryId((req.body as { id?: unknown })?.id);
        if (!edition || !storyType || !id) {
          res.status(400).json({ ok: false, success: false, configured: isKvConfigured(), error: "Missing edition, storyType, or id." });
          return;
        }
        await migrateLegacyBlobIfNeeded();
        await snapshotSite(`before delete-story ${storyType}:${id} (${edition})`);
        await removeStory(storyType, edition, id);
        const stamp = new Date().toISOString();
        const meta = (await getMeta()) || { publishedAt: stamp };
        await setMeta({ publishedAt: meta.publishedAt, updatedAt: stamp });
        await rebuildLatestView(meta.publishedAt, stamp);
        await snapshotPublished(`published after deleting ${storyType}:${id} (${edition})`);
        res.status(200).json({ ok: true, success: true, configured: isKvConfigured(), publishedAt: meta.publishedAt, updatedAt: stamp });
        return;
      }

      // ---- Save one whole edition (all its stories in one request) ----
      if (phase === "edition") {
        const edition = normalizeEditionId((req.body as { edition?: unknown })?.edition);
        if (!edition) {
          res.status(400).json({ ok: false, success: false, configured: isKvConfigured(), error: "Missing edition id." });
          return;
        }
        const heroes = ensureArray<HeroPayload>((req.body as any)?.heroes).map(sanitizeHero);
        const articles = ensureArray<ArticlePayload>((req.body as any)?.articles).map(sanitizeArticle);
        const adsInput = (req.body as { ads?: unknown })?.ads;
        const stamp = new Date().toISOString();

        // An empty payload used to silently delete the whole edition.
        // Deleting an edition now needs the explicit "delete-edition" phase.
        if (heroes.length === 0 && articles.length === 0) {
          res.status(400).json({
            ok: false,
            success: false,
            configured: isKvConfigured(),
            error: `Refusing to save edition ${edition} with no stories. To delete an edition, use phase "delete-edition" with confirm: "${edition}".`,
          });
          return;
        }

        await migrateLegacyBlobIfNeeded();
        const previousIndex = await getEditionIndex(edition);
        const nextHeroIds = heroes.map((h) => h.id);
        const nextArticleIds = articles.map((a) => a.id);
        const wouldRemove = Boolean(
          previousIndex &&
            (previousIndex.heroIds.some((id) => !nextHeroIds.includes(id)) ||
              previousIndex.articleIds.some((id) => !nextArticleIds.includes(id))),
        );
        if (wouldRemove) await snapshotSite(`before edition save ${edition} (removes stories)`);

        if (previousIndex) {
          const removedHeroIds = previousIndex.heroIds.filter((id) => !nextHeroIds.includes(id));
          const removedArticleIds = previousIndex.articleIds.filter((id) => !nextArticleIds.includes(id));
          await Promise.all([
            ...removedHeroIds.map((id) => deleteStory("hero", id)),
            ...removedArticleIds.map((id) => deleteStory("article", id)),
          ]);
        }

        if (heroes.length === 0 && articles.length === 0) {
          await deleteEditionIndex(edition);
          const editions = await getEditionsIndex();
          await setEditionsIndex(editions.filter((e) => e !== edition));
        } else {
          await Promise.all([
            ...heroes.map((hero) => setStory("hero", hero.id, hero)),
            ...articles.map((article) => setStory("article", article.id, article)),
          ]);
          await setEditionIndex(edition, { heroIds: nextHeroIds, articleIds: nextArticleIds, updatedAt: stamp });
          const editions = await getEditionsIndex();
          if (!editions.includes(edition)) await setEditionsIndex([...editions, edition]);
        }

        if (Array.isArray(adsInput)) await setAdsContent(ensureArray<AdPayload>(adsInput));

        const meta = (await getMeta()) || { publishedAt: stamp };
        await setMeta({ publishedAt: meta.publishedAt, updatedAt: stamp });
        await rebuildLatestView(meta.publishedAt, stamp);
        await snapshotPublished(`published edition ${edition}`);
        const ads = await getAdsContent();
        void submitIndexNow(collectIndexNowUrls({ heroes, articles, ads }));
        res.status(200).json({ ok: true, success: true, configured: isKvConfigured(), publishedAt: meta.publishedAt, updatedAt: stamp });
        return;
      }

      // ---- Delete ONE whole edition (explicit + confirmed + snapshotted) ----
      if (phase === "delete-edition") {
        const edition = normalizeEditionId((req.body as { edition?: unknown })?.edition);
        const confirm = normalizeEditionId((req.body as { confirm?: unknown })?.confirm);
        if (!edition || confirm !== edition) {
          res.status(400).json({
            ok: false,
            success: false,
            configured: isKvConfigured(),
            error: "Deleting an edition requires { edition, confirm } with confirm equal to the edition id.",
          });
          return;
        }
        await migrateLegacyBlobIfNeeded();
        const backup = await snapshotSite(`before delete-edition ${edition}`);
        const index = await getEditionIndex(edition);
        if (index) {
          await Promise.all([
            ...index.heroIds.map((id) => deleteStory("hero", id)),
            ...index.articleIds.map((id) => deleteStory("article", id)),
          ]);
        }
        await deleteEditionIndex(edition);
        await setEditionsIndex((await getEditionsIndex()).filter((e) => e !== edition));
        const stamp = new Date().toISOString();
        const meta = (await getMeta()) || { publishedAt: stamp };
        await setMeta({ publishedAt: meta.publishedAt, updatedAt: stamp });
        await rebuildLatestView(meta.publishedAt, stamp);
        await snapshotPublished(`published after deleting edition ${edition}`);
        res.status(200).json({ ok: true, success: true, configured: isKvConfigured(), deleted: edition, backupId: backup?.id });
        return;
      }

      // ---- Put the whole site back exactly as an automatic snapshot had it ----
      if (phase === "restore-backup") {
        const backupId = readFirstString((req.body as { backupId?: unknown })?.backupId).trim();
        const entry = (await listBackups()).find((b) => b.id === backupId);
        const snapshot = entry ? await kvGet<StoredPayload>(backupKey(entry.id)) : null;
        if (!entry || !snapshot) {
          res.status(404).json({ ok: false, success: false, configured: isKvConfigured(), error: "Backup not found." });
          return;
        }
        const before = await snapshotSite(`before restore of ${backupId}`);
        const stamp = new Date().toISOString();
        await replaceContentAcrossEditions(sanitizePayload(snapshot), snapshot.publishedAt || stamp, stamp);
        await snapshotPublished(`published by restoring backup from ${entry.createdAt}`);
        res.status(200).json({ ok: true, success: true, configured: isKvConfigured(), restored: backupId, undoBackupId: before?.id });
        return;
      }

      // ---- Record the site as it stands now as the last published version ----
      // Called once at the end of a bulk "Save Changes" (whose per-story
      // saves skip their own snapshots).
      if (phase === "snapshot") {
        await migrateLegacyBlobIfNeeded();
        const entry = await snapshotPublished(readFirstString((req.body as { reason?: unknown })?.reason).trim() || "published (bulk save)");
        res.status(200).json({ ok: true, success: true, configured: isKvConfigured(), backupId: entry?.id });
        return;
      }

      // ---- Chunked upload of a full (all-editions) payload ----
      if (phase === "chunk") {
        const uploadId = normalizeUploadId((req.body as { uploadId?: unknown })?.uploadId);
        const index = readNumber((req.body as { index?: unknown })?.index);
        const totalChunks = readNumber((req.body as { totalChunks?: unknown })?.totalChunks);
        const chunk = readFirstString((req.body as { chunk?: unknown })?.chunk);

        if (!uploadId) {
          res.status(400).json({ ok: false, success: false, configured: isKvConfigured(), error: "Missing upload id." });
          return;
        }
        if (!Number.isInteger(index) || index < 0 || index > 5000) {
          res.status(400).json({ ok: false, success: false, configured: isKvConfigured(), error: "Invalid chunk index." });
          return;
        }
        if (!Number.isInteger(totalChunks) || totalChunks <= 0 || totalChunks > 5000) {
          res.status(400).json({ ok: false, success: false, configured: isKvConfigured(), error: "Invalid chunk count." });
          return;
        }
        if (chunk.length === 0 || chunk.length > UPLOAD_CHUNK_MAX_CHARS) {
          res.status(400).json({
            ok: false,
            success: false,
            configured: isKvConfigured(),
            error: `Chunk payload is invalid (received ${chunk.length} chars, max ${UPLOAD_CHUNK_MAX_CHARS}).`,
          });
          return;
        }
        await storeUploadChunk(uploadId, index, totalChunks, chunk);
        res.status(200).json({ ok: true, success: true, configured: isKvConfigured(), uploadId, index, totalChunks });
        return;
      }

      if (phase === "finalize") {
        const uploadId = normalizeUploadId((req.body as { uploadId?: unknown })?.uploadId);
        if (!uploadId) {
          res.status(400).json({ ok: false, success: false, configured: isKvConfigured(), error: "Missing upload id." });
          return;
        }
        const serialized = await readUploadedContent(uploadId);
        const parsed = JSON.parse(serialized) as unknown;
        const content = sanitizePayload(parsed);
        const publishedAt = new Date().toISOString();
        await migrateLegacyBlobIfNeeded();
        await writeContentAcrossEditions(content, publishedAt, publishedAt);
        await snapshotPublished("published full site (chunked)");
        void submitIndexNow(collectIndexNowUrls(content));
        res.status(200).json({ ok: true, success: true, configured: isKvConfigured(), publishedAt, updatedAt: publishedAt });
        return;
      }

      // ---- Legacy: whole archive in one direct POST (merge-only) ----
      if (phase) {
        res.status(400).json({ ok: false, success: false, configured: isKvConfigured(), error: `Unknown phase "${phase}".` });
        return;
      }
      const content = sanitizePayload(req.body);
      if (content.heroes.length === 0 && content.articles.length === 0) {
        res.status(400).json({ ok: false, success: false, configured: isKvConfigured(), error: "No stories in payload; nothing was changed." });
        return;
      }
      const publishedAt = new Date().toISOString();
      await migrateLegacyBlobIfNeeded();
      await writeContentAcrossEditions(content, publishedAt, publishedAt);
      await snapshotPublished("published full site");
      void submitIndexNow(collectIndexNowUrls(content));
      res.status(200).json({ ok: true, success: true, configured: isKvConfigured(), publishedAt, updatedAt: publishedAt });
      return;
    } catch (error) {
      res.status(500).json({
        ok: false,
        success: false,
        configured: isKvConfigured(),
        error: error instanceof Error ? error.message : "Failed to publish content.",
      });
      return;
    }
  }

  res.status(405).json({ ok: false, success: false, configured: isKvConfigured(), error: "Method not allowed." });
}
