import type { VercelRequest } from "@vercel/node";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { verifyPublishToken } from "./publish-token.js";

// The admin password. By default it is the ADMIN_PASSWORD setting in Vercel.
// After a "Forgot password" reset, a new password is stored (hashed) in the
// database and takes over; ADMIN_PASSWORD is then ignored.

const AUTH_KEY = "magorium:admin-auth:v1";

type StoredAuth = { hash: string; salt: string; signingSecret: string; changedAt: string };

type Kv = {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown, opts?: { ex?: number }) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<unknown>;
};

export async function getKv(): Promise<Kv | null> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  try {
    const mod = await import("@vercel/kv");
    return mod.kv as unknown as Kv;
  } catch {
    return null;
  }
}

function parse(raw: unknown): StoredAuth | null {
  if (!raw) return null;
  if (typeof raw === "string") { try { return JSON.parse(raw) as StoredAuth; } catch { return null; } }
  return raw as StoredAuth;
}

async function getStored(): Promise<StoredAuth | null> {
  const kv = await getKv();
  if (!kv) return null;
  try { return parse(await kv.get<unknown>(AUTH_KEY)); } catch { return null; }
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function isAdminConfigured(): Promise<boolean> {
  return Boolean((await getStored()) || process.env.ADMIN_PASSWORD);
}

/** True if the typed password is the current admin password. */
export async function checkAdminPassword(input: string): Promise<boolean> {
  const typed = (input || "").trim();
  if (!typed) return false;
  const stored = await getStored();
  if (stored) return safeEqual(hashPassword(typed, stored.salt), stored.hash);
  const env = process.env.ADMIN_PASSWORD;
  return Boolean(env) && safeEqual(typed, env as string);
}

/** Key that signs admin sessions. Changes whenever the password changes. */
export async function getSigningKey(): Promise<string | null> {
  const stored = await getStored();
  if (stored) return stored.signingSecret;
  return process.env.ADMIN_PASSWORD || null;
}

/** Admin request: a valid session token (Bearer) or the password header. */
export async function isAdminRequest(req: VercelRequest): Promise<boolean> {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || "";
  const bearer = first(req.headers.authorization).replace(/^Bearer\s+/i, "").trim();
  const key = await getSigningKey();
  if (bearer && key && verifyPublishToken(bearer, key)) return true;
  const direct = first(req.headers["x-admin-password"]).trim();
  return direct ? checkAdminPassword(direct) : false;
}

export async function setAdminPassword(newPassword: string): Promise<void> {
  const kv = await getKv();
  if (!kv) throw new Error("Database is not configured.");
  const salt = randomBytes(16).toString("hex");
  const record: StoredAuth = {
    hash: hashPassword(newPassword.trim(), salt),
    salt,
    signingSecret: randomBytes(32).toString("hex"), // signs everyone out
    changedAt: new Date().toISOString(),
  };
  await kv.set(AUTH_KEY, JSON.stringify(record));
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
