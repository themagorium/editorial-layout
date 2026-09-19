import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";
const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// PLACEHOLDER — will be corrected once you paste your admin-login file's contents.
function isValidAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  return token === process.env.ADMIN_PUBLISH_TOKEN;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  if (!isValidAdminToken(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [totalsRaw, contentKeys, locationKeys, recentRaw] = await Promise.all([
    kv.hgetall<{ views?: number; clicks?: number }>("totals"),
    kv.smembers("content_keys"),
    kv.smembers("location_keys"),
    kv.lrange<string>("recent_events", 0, 29),
  ]);

  const content = await Promise.all(
    (contentKeys || []).map(async (key) => {
      const [contentType, contentId] = key.split(/:(.+)/).filter(Boolean);
      const stats = await kv.hgetall<{ views?: number; clicks?: number }>(`content:${key}`);
      return {
        contentType: contentType as "article" | "hero" | "ad",
        contentId,
        views: Number(stats?.views || 0),
        clicks: Number(stats?.clicks || 0),
      };
    })
  );

  const locations = await Promise.all(
    (locationKeys || []).map(async (key) => {
      const [city, country, countryCode] = key.split("|");
      const stats = await kv.hgetall<{ views?: number; clicks?: number }>(`location:${key}`);
      return {
        city,
        country,
        countryCode,
        views: Number(stats?.views || 0),
        clicks: Number(stats?.clicks || 0),
      };
    })
  );

  const recent = (recentRaw || []).map((r) => JSON.parse(r));

  res.status(200).json({
    totals: {
      totalViews: Number(totalsRaw?.views || 0),
      totalClicks: Number(totalsRaw?.clicks || 0),
      totalEvents: Number(totalsRaw?.views || 0) + Number(totalsRaw?.clicks || 0),
      uniqueLocations: (locationKeys || []).length,
    },
    content,
    locations: locations.sort((a, b) => b.views + b.clicks - (a.views + a.clicks)),
    recent,
  });
}
