import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAdminRequest } from "./lib/admin-auth-store.js";
import { getAnalyticsKv, daysBetween, dayKey } from "./lib/analytics-store.js";

// Admin only: everything the Analytics tab shows, for a date range.
// GET /api/analytics-data?from=YYYY-MM-DD&to=YYYY-MM-DD   (default: last 30 days, UTC)

type Num = number | string;
type Bucket = { pageviews: number; views: number; clicks: number };

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) || "";
}

function validDate(v: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime());
}

function add(map: Map<string, Bucket>, key: string, field: string, n: number) {
  const b = map.get(key) || { pageviews: 0, views: 0, clicks: 0 };
  if (field === "pageviews" || field === "views" || field === "clicks") b[field] += n;
  map.set(key, b);
}

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

  const today = dayKey();
  let to = first(req.query?.to as string | string[]);
  let from = first(req.query?.from as string | string[]);
  if (!validDate(to)) to = today;
  if (!validDate(from)) from = dayKey(new Date(new Date(`${to}T00:00:00Z`).getTime() - 29 * 86400000));
  if (from > to) [from, to] = [to, from];
  const days = daysBetween(from, to, 400);

  // One round trip for every daily hash in the range.
  const p = kv.pipeline();
  for (const d of days) {
    p.hgetall(`a:d:${d}`);
    p.hgetall(`a:loc:${d}`);
    p.hgetall(`a:dev:${d}`);
    p.hgetall(`a:adloc:${d}`);
    p.hgetall(`a:adctx:${d}`);
    p.hgetall(`a:addev:${d}`);
    p.hgetall(`a:pv:${d}`);
  }
  const results = days.length ? await p.exec<(Record<string, Num> | null)[]>() : [];

  const content = new Map<string, { views: number; clicks: number }>();
  const locations = new Map<string, Bucket>();
  const devices = new Map<string, Bucket>();
  const adLoc = new Map<string, Map<string, Bucket>>();
  const adCtx = new Map<string, Map<string, Bucket>>();
  const adDev = new Map<string, Map<string, Bucket>>();
  const pages = new Map<string, number>();
  const daily: { date: string; pageviews: number; views: number; clicks: number; visitors: number }[] = [];
  let pageviews = 0, views = 0, clicks = 0;

  const nested = (m: Map<string, Map<string, Bucket>>, id: string) => {
    let inner = m.get(id);
    if (!inner) { inner = new Map(); m.set(id, inner); }
    return inner;
  };

  days.forEach((d, i) => {
    const [dHash, locHash, devHash, adLocHash, adCtxHash, adDevHash, pvHash] = results.slice(i * 7, i * 7 + 7).map((r) => r || {});
    const day = { date: d, pageviews: 0, views: 0, clicks: 0, visitors: 0 };
    for (const [field, raw] of Object.entries(dHash)) {
      const n = Number(raw) || 0;
      if (field === "_pageviews") { day.pageviews += n; continue; }
      if (field === "_total:views") { day.views += n; continue; }
      if (field === "_total:clicks") { day.clicks += n; continue; }
      const cut = field.lastIndexOf(":");
      const key = field.slice(0, cut);
      const bucket = field.slice(cut + 1);
      const c = content.get(key) || { views: 0, clicks: 0 };
      if (bucket === "views") c.views += n; else if (bucket === "clicks") c.clicks += n;
      content.set(key, c);
    }
    for (const [field, raw] of Object.entries(locHash)) {
      const [loc, bucket] = field.split("#");
      add(locations, loc, bucket, Number(raw) || 0);
    }
    for (const [field, raw] of Object.entries(devHash)) {
      const [dev, bucket] = field.split("#");
      add(devices, dev, bucket, Number(raw) || 0);
    }
    for (const [field, raw] of Object.entries(adLocHash)) {
      const [id, loc, bucket] = field.split("#");
      add(nested(adLoc, id), loc, bucket, Number(raw) || 0);
    }
    for (const [field, raw] of Object.entries(adCtxHash)) {
      const [id, page, bucket] = field.split("#");
      add(nested(adCtx, id), page, bucket, Number(raw) || 0);
    }
    for (const [field, raw] of Object.entries(adDevHash)) {
      const [id, dev, bucket] = field.split("#");
      add(nested(adDev, id), dev, bucket, Number(raw) || 0);
    }
    for (const [page, raw] of Object.entries(pvHash)) pages.set(page, (pages.get(page) || 0) + (Number(raw) || 0));
    pageviews += day.pageviews; views += day.views; clicks += day.clicks;
    daily.push(day);
  });

  // Unique visitors: per day, and across the whole range.
  let visitors = 0;
  try {
    const vp = kv.pipeline();
    for (const d of days) vp.scard(`a:vis:${d}`);
    const counts = days.length ? await vp.exec<number[]>() : [];
    counts.forEach((n, i) => { daily[i].visitors = Number(n) || 0; });
    const keys = days.map((d) => `a:vis:${d}`);
    if (keys.length) visitors = (await kv.sunion(...keys)).length;
  } catch { /* visitors stay 0 */ }

  const locRows = (m: Map<string, Bucket>) => [...m.entries()].map(([key, b]) => {
    const [city, country, countryCode] = key.split("|");
    return { city: city || "Unknown", country: country || "Unknown", countryCode: countryCode || "", ...b };
  }).sort((a, b) => (b.pageviews + b.views + b.clicks) - (a.pageviews + a.views + a.clicks));

  const devRows = (m: Map<string, Bucket>) => [...m.entries()].map(([device, b]) => ({ device, ...b }))
    .sort((a, b) => (b.pageviews + b.views) - (a.pageviews + a.views));

  const ads: Record<string, unknown> = {};
  const adIds = new Set([...adLoc.keys(), ...adCtx.keys(), ...adDev.keys()]);
  for (const id of adIds) {
    ads[id] = {
      locations: locRows(adLoc.get(id) || new Map()),
      pages: [...(adCtx.get(id) || new Map()).entries()].map(([page, b]) => ({ page, views: b.views, clicks: b.clicks }))
        .sort((a, b) => b.views - a.views),
      devices: devRows(adDev.get(id) || new Map()),
    };
  }

  const recentRaw = await kv.lrange<unknown>("recent_events", 0, 29).catch(() => []);

  res.status(200).json({
    range: { from, to, days: days.length },
    totals: { pageviews, visitors, views, clicks },
    content: [...content.entries()].map(([key, c]) => {
      const i = key.indexOf(":");
      return { contentType: key.slice(0, i), contentId: key.slice(i + 1), views: c.views, clicks: c.clicks };
    }),
    locations: locRows(locations),
    devices: devRows(devices),
    pages: [...pages.entries()].map(([page, n]) => ({ page, pageviews: n })).sort((a, b) => b.pageviews - a.pageviews),
    ads,
    daily,
    recent: (recentRaw || []).map(parseEvent).filter(Boolean),
  });
}
