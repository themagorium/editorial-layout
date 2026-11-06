import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAdminRequest } from "./lib/admin-auth-store.js";
import { getAnalyticsKv } from "./lib/analytics-store.js";

// Admin only: everything the Analytics tab shows.

type Counts = { views?: number | string; clicks?: number | string };

function parseEvent(raw: unknown): unknown {
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return null; } }
  return raw;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (!(await isAdminRequest(req))) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }
  const kv = await getAnalyticsKv();
  if (!kv) {
    res.status(503).json({ ok: false, error: "Database is not configured." });
    return;
  }

  const [totalsRaw, contentKeys, locationKeys, recentRaw] = await Promise.all([
    kv.hgetall<number | string>("totals"),
    kv.smembers("content_keys"),
    kv.smembers("location_keys"),
    kv.lrange<unknown>("recent_events", 0, 29),
  ]);

  const content = await Promise.all((contentKeys || []).map(async (key) => {
    const i = key.indexOf(":");
    const contentType = key.slice(0, i);
    const contentId = key.slice(i + 1);
    const stats = ((await kv.hgetall<number | string>(`content:${key}`)) || {}) as Counts;
    return { contentType, contentId, views: Number(stats.views || 0), clicks: Number(stats.clicks || 0) };
  }));

  const locations = await Promise.all((locationKeys || []).map(async (key) => {
    const [city, country, countryCode] = key.split("|");
    const stats = ((await kv.hgetall<number | string>(`location:${key}`)) || {}) as Counts;
    return { city, country, countryCode, views: Number(stats.views || 0), clicks: Number(stats.clicks || 0) };
  }));

  const totals = (totalsRaw || {}) as Counts;
  const totalViews = Number(totals.views || 0);
  const totalClicks = Number(totals.clicks || 0);

  res.status(200).json({
    totals: {
      totalViews,
      totalClicks,
      totalEvents: totalViews + totalClicks,
      uniqueLocations: (locationKeys || []).length,
    },
    content,
    locations: locations.sort((a, b) => b.views + b.clicks - (a.views + a.clicks)),
    recent: (recentRaw || []).map(parseEvent).filter(Boolean),
  });
}
