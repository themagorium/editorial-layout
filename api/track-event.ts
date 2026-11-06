import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAnalyticsKv, CONTENT_TYPES, EVENT_TYPES, dayKey, deviceFromUserAgent } from "./lib/analytics-store.js";

// Public: records page visits plus article / hero / ad views and clicks for the
// admin Analytics tab. The site batches everything into one small request.
// POST { vid?, page?, pageviews?, events?: [{ contentId, contentType, eventType }] }

const MAX_EVENTS = 60;
const RATE_LIMIT_PER_MINUTE = 120;

type InEvent = { contentId?: unknown; contentType?: unknown; eventType?: unknown };

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) || "";
}

function cleanPage(value: unknown): string {
  if (typeof value !== "string") return "";
  const path = value.split(/[?#]/)[0].slice(0, 300);
  return path.startsWith("/") ? path.replace(/#/g, "") : "";
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
  const raw = (body || {}) as { events?: InEvent[]; vid?: unknown; page?: unknown; pageviews?: unknown } & InEvent;
  const list: InEvent[] = Array.isArray(raw.events) ? raw.events : raw.contentId ? [raw] : [];

  const events = list.slice(0, MAX_EVENTS).filter((e) =>
    typeof e.contentId === "string" && e.contentId.length > 0 && e.contentId.length <= 200 && !/[#|]/.test(e.contentId) &&
    (CONTENT_TYPES as readonly string[]).includes(String(e.contentType)) &&
    (EVENT_TYPES as readonly string[]).includes(String(e.eventType))
  ) as { contentId: string; contentType: string; eventType: string }[];

  const pageviews = Math.max(0, Math.min(20, Math.floor(Number(raw.pageviews) || 0)));
  const vid = typeof raw.vid === "string" && /^[a-z0-9]{8,40}$/i.test(raw.vid) ? raw.vid : "";
  const page = cleanPage(raw.page);

  if (!events.length && !pageviews) {
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
  city = city.replace(/[#|]/g, " ");
  countryName = countryName.replace(/[#|]/g, " ");
  const locKey = countryCode ? `${city}|${countryName}|${countryCode}` : "Unknown|Unknown|";
  const device = deviceFromUserAgent(first(req.headers["user-agent"]));
  const day = dayKey();
  const now = new Date().toISOString();

  const p = kv.pipeline();
  const recent: string[] = [];

  if (pageviews) {
    p.hincrby(`a:d:${day}`, "_pageviews", pageviews);
    p.hincrby(`a:loc:${day}`, `${locKey}#pageviews`, pageviews);
    p.hincrby(`a:dev:${day}`, `${device}#pageviews`, pageviews);
  }
  if (vid) p.sadd(`a:vis:${day}`, vid);

  for (const e of events) {
    const bucket = e.eventType === "view" ? "views" : "clicks";
    const contentKey = `${e.contentType}:${e.contentId}`;
    // All-time (legacy) counters.
    p.hincrby(`content:${contentKey}`, bucket, 1);
    p.sadd("content_keys", contentKey);
    p.hincrby("totals", bucket, 1);
    if (countryCode) {
      p.hincrby(`location:${locKey}`, bucket, 1);
      p.sadd("location_keys", locKey);
    }
    // Per-day counters (for date ranges).
    p.hincrby(`a:d:${day}`, `${contentKey}:${bucket}`, 1);
    p.hincrby(`a:d:${day}`, `_total:${bucket}`, 1);
    p.hincrby(`a:loc:${day}`, `${locKey}#${bucket}`, 1);
    p.hincrby(`a:dev:${day}`, `${device}#${bucket}`, 1);
    if (e.contentType === "ad") {
      p.hincrby(`a:adloc:${day}`, `${e.contentId}#${locKey}#${bucket}`, 1);
      p.hincrby(`a:addev:${day}`, `${e.contentId}#${device}#${bucket}`, 1);
      if (page) p.hincrby(`a:adctx:${day}`, `${e.contentId}#${page}#${bucket}`, 1);
    }
    recent.push(JSON.stringify({
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      contentId: e.contentId,
      contentType: e.contentType,
      eventType: e.eventType,
      timestamp: now,
      metadata: page ? { page } : {},
      location: countryCode ? { city, country: countryName, countryCode, region: "" } : undefined,
    }));
  }

  try {
    await p.exec();
    if (recent.length) {
      await kv.lpush("recent_events", ...recent);
      await kv.ltrim("recent_events", 0, 49);
    }
  } catch (error) {
    console.error("[track-event] write failed", error instanceof Error ? error.message : error);
    res.status(500).json({ ok: false, error: "Could not record events" });
    return;
  }

  res.status(200).json({ ok: true, recorded: events.length, pageviews });
}
