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

const CONTENT_KEY = "magorium:published-content:v1";
const CONTENT_CHUNK_PREFIX = `${CONTENT_KEY}:chunk:`;
const CONTENT_CHUNK_SIZE = 700_000;
const ADMIN_PASSWORD_KEY = "ADMIN_PASSWORD";

let memoryFallback: StoredPayload | null = null;
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

    await kv.set(CONTENT_KEY, {
      __chunked: true,
      totalChunks,
      chunkPrefix: CONTENT_CHUNK_PREFIX,
      updatedAt: content.updatedAt || content.publishedAt,
    } satisfies ChunkedContentPointer);
    return;
  }
  memoryFallback = content;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    try {
      const content = await getStoredContent();
      const normalizedContent = content
        ? {
            ...content,
            publishedAt: content.publishedAt || content.updatedAt || new Date(0).toISOString(),
            updatedAt: content.updatedAt || content.publishedAt,
          }
        : null;
      res.status(200).json({
        ok: true,
        success: true,
        configured: isKvConfigured(),
        content: normalizedContent,
        payload: normalizedContent,
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
