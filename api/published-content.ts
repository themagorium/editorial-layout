import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

type PublishedPayload = {
  heroes?: unknown[];
  articles?: unknown[];
  ads?: unknown[];
  updatedAt?: string;
};

const CONTENT_KEY = "magorium:published-content:v1";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const payload = await kv.get<PublishedPayload>(CONTENT_KEY);
    res.status(200).json({ payload: payload ?? null });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!adminPassword || token !== adminPassword) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  const body = (req.body || {}) as PublishedPayload;
  if (!Array.isArray(body.heroes) || !Array.isArray(body.articles) || !Array.isArray(body.ads)) {
    res.status(400).json({ error: "Invalid payload. heroes/articles/ads arrays are required." });
    return;
  }

  const payload: PublishedPayload = {
    heroes: body.heroes,
    articles: body.articles,
    ads: body.ads,
    updatedAt: new Date().toISOString(),
  };

  await kv.set(CONTENT_KEY, payload);
  res.status(200).json({ success: true, updatedAt: payload.updatedAt });
}
