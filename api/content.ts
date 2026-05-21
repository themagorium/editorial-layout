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

type ChunkedContentPointer = {
  __chunked: true;
  totalChunks: number;
  chunkPrefix: string;
  updatedAt: string;
};

type LatestViewPayload = {
  heroes: HeroPayload[];
  articles: ArticlePayload[];
  ads: AdPayload[];
  publishedAt: string;
  updatedAt?: string;
  latestEdition: string;
};

const CONTENT_KEY = "magorium:published-content:v1";
const CONTENT_CHUNK_PREFIX = `${CONTENT_KEY}:chunk:`;
const CONTENT_UPLOAD_PREFIX = `${CONTENT_KEY}:upload:`;
const CONTENT_CHUNK_SIZE = 700_000;
const ADMIN_PASSWORD_KEY = "ADMIN_PASSWORD";

let memoryFallback: StoredPayload | null = null;
let memoryChunkUploads = new Map<string, { totalChunks: number; chunks: Map<number, string> }>();
let kvClientPromise: Promise<{
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown) => Promise<unknown>;
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
  return value
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
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
  return trustedSuffixes.some(
    (suffix) => destinationHost.length > suffix.length && destinationHost.endsWith(suffix),
  );
}

async function getKvClient() {
  if (!isKvConfigured()) return null;
  if (!kvClientPromise) {
    kvClientPromise = import("@vercel/kv")
      .then((module) => module.kv)
      .catch(() => null);
  }
  return kvClientPromise;
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
    return Boolean((block.content || "").trim());
  });
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

function sanitizePayload(input: unknown): PublishPayload {
  const payload = (input || {}) as Partial<PublishPayload>;

  const heroes = ensureArray<HeroPayload>(payload.heroes).map((hero) => ({
    ...hero,
    seoTags: sanitizeSeoTags(hero.seoTags),
    body: sanitizeBody(hero.body),
  }));
  const articles = ensureArray<ArticlePayload>(payload.articles).map((article) => ({
    ...article,
    seoTags: sanitizeSeoTags(article.seoTags),
    body: sanitizeBody(article.body),
  }));
  const ads = ensureArray<AdPayload>(payload.ads);

  return { heroes, articles, ads };
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

function pickLatestReadyEdition(heroes: HeroPayload[], articles: ArticlePayload[]): string {
  const editions = Array.from(
    new Set([...heroes.map((hero) => hero.edition), ...articles.map((article) => article.edition)]),
  )
    .filter(Boolean)
    .sort()
    .reverse();

  for (const edition of editions) {
    if (heroes.some((hero) => hero.edition === edition && isPublishReadyHero(hero))) return edition;
    if (articles.some((article) => article.edition === edition && isPublishReadyArticle(article))) return edition;
  }

  return editions[0] || "";
}

function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function toLatestViewPayload(
  content: StoredPayload,
  heroLimit: number,
  articleLimit: number,
): LatestViewPayload {
  const readyHeroes = content.heroes.filter(isPublishReadyHero);
  const readyArticles = content.articles.filter(isPublishReadyArticle);
  const latestEdition = pickLatestReadyEdition(readyHeroes, readyArticles);
  const heroes = latestEdition
    ? readyHeroes.filter((hero) => hero.edition === latestEdition).slice(0, heroLimit)
    : [];
  const articles = latestEdition
    ? readyArticles.filter((article) => article.edition === latestEdition).slice(0, articleLimit)
    : [];

  return {
    heroes,
    articles,
    ads: content.ads,
    publishedAt: content.publishedAt,
    updatedAt: content.updatedAt,
    latestEdition,
  };
}

function isChunkedContentPointer(value: unknown): value is ChunkedContentPointer {
  if (!value || typeof value !== "object") return false;
  const pointer = value as Partial<ChunkedContentPointer>;
  return (
    pointer.__chunked === true
    && typeof pointer.totalChunks === "number"
    && pointer.totalChunks > 0
    && typeof pointer.chunkPrefix === "string"
    && Boolean(pointer.chunkPrefix)
  );
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
  const normalized = readFirstString(value).trim();
  return normalized.replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
}

function getUploadMetaKey(uploadId: string): string {
  return `${CONTENT_UPLOAD_PREFIX}${uploadId}:meta`;
}

function getUploadChunkKey(uploadId: string, index: number): string {
  return `${CONTENT_UPLOAD_PREFIX}${uploadId}:chunk:${index}`;
}

async function storeUploadChunk(uploadId: string, index: number, totalChunks: number, chunk: string) {
  const kv = await getKvClient();
  if (kv) {
    await kv.set(getUploadMetaKey(uploadId), {
      totalChunks,
      updatedAt: new Date().toISOString(),
    });
    await kv.set(getUploadChunkKey(uploadId, index), chunk);
    return;
  }

  const existing = memoryChunkUploads.get(uploadId) || {
    totalChunks,
    chunks: new Map<number, string>(),
  };
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
      if (typeof chunk !== "string") {
        throw new Error("One or more upload chunks are missing.");
      }
      combined += chunk;
    }
    return combined;
  }

  const upload = memoryChunkUploads.get(uploadId);
  if (!upload || !upload.totalChunks) {
    throw new Error("Upload is incomplete or invalid.");
  }
  let combined = "";
  for (let index = 0; index < upload.totalChunks; index += 1) {
    const chunk = upload.chunks.get(index);
    if (typeof chunk !== "string") {
      throw new Error("One or more upload chunks are missing.");
    }
    combined += chunk;
  }
  memoryChunkUploads.delete(uploadId);
  return combined;
}

async function verifyBearerPublishToken(token: string, adminPassword: string): Promise<boolean> {
  if (!token || !adminPassword) return false;
  try {
    const tokenModule = await import("./lib/publish-token");
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
  if (bearer && await verifyBearerPublishToken(bearer, configured)) return true;

  const directHeader = req.headers["x-admin-password"];
  const providedDirect = Array.isArray(directHeader) ? directHeader[0] : directHeader;
  if ((providedDirect || "").trim() === configured) return true;
  return false;
}

async function getStoredContent() {
  const kv = await getKvClient();
  if (kv) {
    const stored = await kv.get<StoredPayload | ChunkedContentPointer>(CONTENT_KEY);
    if (!stored) return null;

    if (!isChunkedContentPointer(stored)) {
      return stored;
    }

    let combined = "";
    for (let index = 0; index < stored.totalChunks; index += 1) {
      const chunk = await kv.get<string>(`${stored.chunkPrefix}${index}`);
      if (typeof chunk !== "string") {
        throw new Error("Published content is missing one or more stored chunks.");
      }
      combined += chunk;
    }

    return JSON.parse(combined) as StoredPayload;
  }
  return memoryFallback;
}

async function setStoredContent(content: StoredPayload) {
  const kv = await getKvClient();
  if (kv) {
    const serialized = JSON.stringify(content);
    if (serialized.length <= CONTENT_CHUNK_SIZE) {
      await kv.set(CONTENT_KEY, content);
      return;
    }

    const totalChunks = Math.ceil(serialized.length / CONTENT_CHUNK_SIZE);
    for (let index = 0; index < totalChunks; index += 1) {
      const start = index * CONTENT_CHUNK_SIZE;
      const end = start + CONTENT_CHUNK_SIZE;
      await kv.set(`${CONTENT_CHUNK_PREFIX}${index}`, serialized.slice(start, end));
    }

    const pointer: ChunkedContentPointer = {
      __chunked: true,
      totalChunks,
      chunkPrefix: CONTENT_CHUNK_PREFIX,
      updatedAt: content.updatedAt || content.publishedAt,
    };
    await kv.set(CONTENT_KEY, pointer);
    return;
  }
  memoryFallback = content;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    try {
      const content = await getStoredContent();
      const queryView = readFirstString(req.query?.view).trim().toLowerCase();
      const normalizedContent = content
        ? {
            ...content,
            publishedAt: content.publishedAt || content.updatedAt || new Date(0).toISOString(),
            updatedAt: content.updatedAt || content.publishedAt,
          }
        : null;
      const responseContent = normalizedContent && queryView === "latest"
        ? toLatestViewPayload(
            normalizedContent,
            parsePositiveInt(readFirstString(req.query?.heroLimit), 3),
            parsePositiveInt(readFirstString(req.query?.articleLimit), 4),
          )
        : normalizedContent;
      res.status(200).json({
        ok: true,
        success: true,
        configured: isKvConfigured(),
        content: responseContent,
        payload: responseContent,
      });
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
      res.status(403).json({
        success: false,
        configured: isKvConfigured(),
        error: "Untrusted admin origin.",
      });
      return;
    }

    if (!await authorized(req)) {
      res.status(401).json({
        success: false,
        configured: isKvConfigured(),
        error: "Unauthorized.",
      });
      return;
    }

    try {
      const phase = readFirstString((req.body as { phase?: string } | undefined)?.phase).trim().toLowerCase();
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
        if (chunk.length === 0 || chunk.length > CONTENT_CHUNK_SIZE + 10_000) {
          res.status(400).json({ ok: false, success: false, configured: isKvConfigured(), error: "Chunk payload is invalid." });
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
        await setStoredContent({
          ...content,
          publishedAt,
          updatedAt: publishedAt,
        });

        res.status(200).json({
          ok: true,
          success: true,
          configured: isKvConfigured(),
          publishedAt,
          updatedAt: publishedAt,
        });
        return;
      }

      const content = sanitizePayload(req.body);
      const publishedAt = new Date().toISOString();
      await setStoredContent({
        ...content,
        publishedAt,
        updatedAt: publishedAt,
      });
      res.status(200).json({
        ok: true,
        success: true,
        configured: isKvConfigured(),
        publishedAt,
        updatedAt: publishedAt,
      });
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

  res.status(405).json({
    ok: false,
    success: false,
    configured: isKvConfigured(),
    error: "Method not allowed.",
  });
}
