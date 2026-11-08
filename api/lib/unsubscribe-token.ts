import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getKv } from "./admin-auth-store.js";

// Signed unsubscribe links: /api/unsubscribe?e=<email>&t=<token>.
const SECRET_KEY = "magorium:unsubscribe-secret:v1";
const SITE = process.env.SITE_URL || "https://www.themagorium.com";

async function secret(): Promise<string> {
  if (process.env.UNSUBSCRIBE_SECRET) return process.env.UNSUBSCRIBE_SECRET;
  const kv = await getKv();
  if (!kv) throw new Error("Database is not configured.");
  const existing = await kv.get<string>(SECRET_KEY);
  if (typeof existing === "string" && existing) return existing;
  const fresh = randomBytes(32).toString("hex");
  await kv.set(SECRET_KEY, fresh);
  return ((await kv.get<string>(SECRET_KEY)) as string) || fresh;
}

export async function unsubscribeToken(email: string): Promise<string> {
  return createHmac("sha256", await secret()).update(email.toLowerCase()).digest("base64url").slice(0, 32);
}

export async function unsubscribeUrl(email: string): Promise<string> {
  return `${SITE}/api/unsubscribe?e=${encodeURIComponent(email)}&t=${await unsubscribeToken(email)}`;
}

export async function verifyUnsubscribeToken(email: string, token: string): Promise<boolean> {
  const expected = Buffer.from(await unsubscribeToken(email));
  const given = Buffer.from(token || "");
  return expected.length === given.length && timingSafeEqual(expected, given);
}
