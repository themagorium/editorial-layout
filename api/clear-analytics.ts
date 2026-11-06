import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAdminRequest } from "./lib/admin-auth-store.js";
import { getAnalyticsKv, daysBetween, dayKey } from "./lib/analytics-store.js";

// Admin only: wipes all analytics counts (the Analytics tab asks for confirmation first).

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  if (!(await isAdminRequest(req))) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }
  const kv = await getAnalyticsKv();
  if (!kv) {
    res.status(503).json({ ok: false, error: "Database is not configured." });
    return;
  }

  const [contentKeys, locationKeys] = await Promise.all([kv.smembers("content_keys"), kv.smembers("location_keys")]);
  const keys = [
    "totals", "recent_events", "content_keys", "location_keys",
    ...(contentKeys || []).map((k) => `content:${k}`),
    ...(locationKeys || []).map((k) => `location:${k}`),
  ];
  // Daily counters for the last 400 days.
  const today = dayKey();
  const start = dayKey(new Date(Date.now() - 399 * 86400000));
  for (const d of daysBetween(start, today, 400)) {
    keys.push(`a:d:${d}`, `a:loc:${d}`, `a:dev:${d}`, `a:vis:${d}`, `a:adloc:${d}`, `a:adctx:${d}`, `a:addev:${d}`);
  }
  for (let i = 0; i < keys.length; i += 100) await kv.del(...keys.slice(i, i + 100));

  res.status(200).json({ ok: true });
}
