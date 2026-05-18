import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

type BodyBlock = {
  id: string;
  type: "text" | "heading" | "image" | "video";
  content: string;
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

const CONTENT_KEY = "magorium:published-content:v1";
const ADMIN_PASSWORD_KEY = "ADMIN_PASSWORD";

let memoryFallback: StoredPayload | null = null;

function getConfiguredAdminPassword() {
  return process.env[ADMIN_PASSWORD_KEY];
}

function isKvConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
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

function sanitizePayload(input: unknown): PublishPayload {
  const payload = (input || {}) as Partial<PublishPayload>;

  const heroes = ensureArray<HeroPayload>(payload.heroes).map((hero) => ({
    ...hero,
    body: sanitizeBody(hero.body),
  }));
  const articles = ensureArray<ArticlePayload>(payload.articles).map((article) => ({
    ...article,
    body: sanitizeBody(article.body),
  }));
  const ads = ensureArray<AdPayload>(payload.ads);

  return { heroes, articles, ads };
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
  if (isKvConfigured()) {
    return (await kv.get<StoredPayload | null>(CONTENT_KEY)) || null;
  }
  return memoryFallback;
}

async function setStoredContent(content: StoredPayload) {
  if (isKvConfigured()) {
    await kv.set(CONTENT_KEY, content);
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
