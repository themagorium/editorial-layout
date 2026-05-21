import crypto from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type StoredMedia = {
  dataUrl: string;
  createdAt: string;
};

const MEDIA_KEY_PREFIX = "magorium:media:v1:";
const ADMIN_PASSWORD_KEY = "ADMIN_PASSWORD";

let memoryFallback = new Map<string, StoredMedia>();
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

function isKvConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
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

function readQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = dataUrl.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\n\r]+)$/);
  if (!match) return null;
  const mimeType = (match[1] || "").trim().toLowerCase();
  const base64 = (match[2] || "").replace(/\s+/g, "");
  if (!mimeType || !base64) return null;
  return { mimeType, base64 };
}

function getMediaKey(id: string) {
  return `${MEDIA_KEY_PREFIX}${id}`;
}

function getMediaId(dataUrl: string): string {
  return crypto.createHash("sha256").update(dataUrl).digest("hex").slice(0, 40);
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

async function getStoredMedia(id: string): Promise<StoredMedia | null> {
  const kv = await getKvClient();
  if (kv) {
    return (await kv.get<StoredMedia>(getMediaKey(id))) || null;
  }
  return memoryFallback.get(id) || null;
}

async function setStoredMedia(id: string, media: StoredMedia): Promise<void> {
  const kv = await getKvClient();
  if (kv) {
    await kv.set(getMediaKey(id), media);
    return;
  }
  memoryFallback.set(id, media);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const id = readQueryValue(req.query?.id).trim();
    if (!id) {
      return res.status(400).json({ success: false, error: "Missing media id." });
    }

    const stored = await getStoredMedia(id);
    if (!stored) {
      return res.status(404).json({ success: false, error: "Media not found." });
    }

    const parsed = parseDataUrl(stored.dataUrl);
    if (!parsed) {
      return res.status(422).json({ success: false, error: "Stored media is invalid." });
    }

    try {
      const bytes = Buffer.from(parsed.base64, "base64");
      res.setHeader("Content-Type", parsed.mimeType);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.status(200).send(bytes);
    } catch {
      return res.status(422).json({ success: false, error: "Could not decode stored media." });
    }
  }

  if (req.method === "POST") {
    if (!isTrustedAdminWriteRequest(req)) {
      return res.status(403).json({ success: false, error: "Write blocked from this origin." });
    }
    if (!await authorized(req)) {
      return res.status(401).json({ success: false, error: "Unauthorized." });
    }

    const dataUrl = typeof req.body?.dataUrl === "string" ? req.body.dataUrl.trim() : "";
    if (!dataUrl) {
      return res.status(400).json({ success: false, error: "Missing media payload." });
    }
    if (dataUrl.length > 20_000_000) {
      return res.status(413).json({ success: false, error: "Media file is too large. Please use a smaller upload." });
    }

    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      return res.status(400).json({ success: false, error: "Unsupported media format." });
    }

    const id = getMediaId(dataUrl);
    const existing = await getStoredMedia(id);
    if (!existing) {
      await setStoredMedia(id, {
        dataUrl,
        createdAt: new Date().toISOString(),
      });
    }

    const relativeUrl = `/api/media?id=${id}`;
    return res.status(200).json({
      success: true,
      id,
      url: relativeUrl,
    });
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ success: false, error: "Method not allowed." });
}
