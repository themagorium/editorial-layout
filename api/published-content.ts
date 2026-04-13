import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyPublishToken } from "./lib/publish-token";

type PublishedPayload = {
  heroes?: unknown[];
  articles?: unknown[];
  ads?: unknown[];
  updatedAt?: string;
};

const CONTENT_KEY = "magorium:published-content:v1";

async function getKvClient() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    try {
      const kv = await getKvClient();
      const payload = await kv.get<PublishedPayload>(CONTENT_KEY);
      if (!payload) {
        res.status(200).json({ payload: null });
        return;
      }

      res.status(200).json({
        heroes: Array.isArray(payload.heroes) ? payload.heroes : [],
        articles: Array.isArray(payload.articles) ? payload.articles : [],
        ads: Array.isArray(payload.ads) ? payload.ads : [],
        updatedAt: payload.updatedAt ?? null,
      });
      return;
    } catch (error) {
      res.status(500).json({
        error: "Published content store is unavailable.",
        details: error instanceof Error ? error.message : "Unknown error.",
      });
    }
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!adminPassword || !verifyPublishToken(token, adminPassword)) {
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

  try {
    const kv = await getKvClient();
    await kv.set(CONTENT_KEY, payload);
    res.status(200).json({ success: true, updatedAt: payload.updatedAt });
  } catch (error) {
    res.status(500).json({
      error: "Failed to write published content.",
      details: error instanceof Error ? error.message : "Unknown error.",
    });
  }
}
