import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAnalyticsKv, CONTENT_TYPES, EVENT_TYPES } from "./lib/analytics-store.js";

// Public: records article / hero / ad views and clicks for the admin Analytics tab.
// POST { events: [{ contentId, contentType, eventType }] }  (or a single event)
// The site batches events and sends them once, after the page has loaded.

const MAX_EVENTS = 60;
const RATE_LIMIT_PER_MINUTE = 120;

type InEvent = { contentId?: unknown; contentType?: unknown; eventType?: unknown };

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) || "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  let body: unknown = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const raw = (body || {}) as { events?: InEvent[] } & InEvent;
  const list: InEvent[] = Array.isArray(raw.events) ? raw.events : [raw];

  const events = list.slice(0, MAX_EVENTS).filter((e) =>
    typeof e.contentId === "string" && e.contentId.length > 0 && e.contentId.length <= 200 &&
    (CONTENT_TYPES as readonly string[]).includes(String(e.contentType)) &&
    (EVENT_TYPES as readonly string[]).includes(String(e.eventType))
  ) as { contentId: string; contentType: string; eventType: string }[];

  if (!events.length) {
    res.status(400).json({ ok: false, error: "No valid events" });
    return;
  }

  const kv = await getAnalyticsKv();
  if (!kv) {
    res.status(503).json({ ok: false, error: "Database is not configured." });
    return;
  }

  // Light abuse protection per visitor IP.
  const ip = first(req.headers["x-forwarded-for"]).split(",")[0].trim() || "unknown";
  try {
    const rlKey = `magorium:analytics:rl:${ip}`;
    const count = await kv.incr(rlKey);
    if (count === 1) await kv.expire(rlKey, 60);
    if (count > RATE_LIMIT_PER_MINUTE) {
      res.status(429).json({ ok: false, error: "Too many requests" });
      return;
    }
  } catch { /* never block tracking on the limiter */ }

  const countryCode = first(req.headers["x-vercel-ip-country"]);
  const cityRaw = first(req.headers["x-vercel-ip-city"]);
  let city = "Unknown";
  try { city = cityRaw ? decodeURIComponent(cityRaw) : "Unknown"; } catch { city = cityRaw || "Unknown"; }
  let countryName = "Unknown";
  try {
    countryName = countryCode ? new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) || countryCode : "Unknown";
  } catch {
    countryName = countryCode || "Unknown";
  }
  const locKey = countryCode ? `${city}|${countryName}|${countryCode}` : null;
  const now = new Date().toISOString();

  const ops: Promise<unknown>[] = [];
  const recent: string[] = [];
  for (const e of events) {
    const bucket = e.eventType === "view" ? "views" : "clicks";
    const contentKey = `${e.contentType}:${e.contentId}`;
    ops.push(kv.hincrby(`content:${contentKey}`, bucket, 1));
    ops.push(kv.sadd("content_keys", contentKey));
    ops.push(kv.hincrby("totals", bucket, 1));
    if (locKey) {
      ops.push(kv.hincrby(`location:${locKey}`, bucket, 1));
      ops.push(kv.sadd("location_keys", locKey));
    }
    recent.push(JSON.stringify({
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      contentId: e.contentId,
      contentType: e.contentType,
      eventType: e.eventType,
      timestamp: now,
      metadata: {},
      location: countryCode ? { city, country: countryName, countryCode, region: "" } : undefined,
    }));
  }

  try {
    await Promise.all(ops);
    await kv.lpush("recent_events", ...recent);
    await kv.ltrim("recent_events", 0, 49);
  } catch (error) {
    console.error("[track-event] write failed", error instanceof Error ? error.message : error);
    res.status(500).json({ ok: false, error: "Could not record events" });
    return;
  }

  res.status(200).json({ ok: true, recorded: events.length });
}
