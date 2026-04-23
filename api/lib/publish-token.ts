import { createHmac, timingSafeEqual } from "node:crypto";

const PUBLISH_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function toBuffer(value: string): Buffer {
  return Buffer.from(value, "utf8");
}

export function createPublishToken(adminPassword: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + PUBLISH_TOKEN_TTL_MS;
  const payload = String(expiresAt);
  const signature = createHmac("sha256", adminPassword).update(payload).digest("hex");
  const token = Buffer.from(`${payload}.${signature}`, "utf8").toString("base64url");
  return { token, expiresAt };
}

export function verifyPublishToken(token: string, adminPassword: string): boolean {
  if (!token || !adminPassword) return false;

  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return false;
  }

  const [expiresAtRaw, signature] = decoded.split(".");
  if (!expiresAtRaw || !signature) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const expectedSignature = createHmac("sha256", adminPassword).update(expiresAtRaw).digest("hex");
  const provided = toBuffer(signature);
  const expected = toBuffer(expectedSignature);
  if (provided.length !== expected.length) return false;

  return timingSafeEqual(provided, expected);
}
