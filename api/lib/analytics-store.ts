// Shared database access for the admin Analytics tab.
// Same Upstash/Vercel KV database the rest of the site uses.
//
// Storage (all dates are UTC, YYYY-MM-DD):
//   a:d:<date>       hash  "<type>:<id>:views|clicks" -> n, "_total:views|clicks", "_pageviews"
//   a:loc:<date>     hash  "<city>|<country>|<code>#views|clicks|pageviews" -> n
//   a:dev:<date>     hash  "<device>#views|clicks|pageviews" -> n
//   a:pv:<date>      hash  "<page path>" -> page views
//   a:vis:<date>     set   anonymous visitor ids (random, no personal data)
//   a:adloc:<date>   hash  "<adId>#<city>|<country>|<code>#views|clicks" -> n
//   a:adctx:<date>   hash  "<adId>#<page path>#views|clicks" -> n
//   a:addev:<date>   hash  "<adId>#<device>#views|clicks" -> n
// Legacy all-time keys (totals, content:*, location:*, recent_events) are kept up to date too.

export type AnalyticsKv = {
  hincrby: (key: string, field: string, increment: number) => Promise<number>;
  hgetall: <T>(key: string) => Promise<Record<string, T> | null>;
  sadd: (key: string, ...members: string[]) => Promise<number>;
  smembers: (key: string) => Promise<string[]>;
  sunion: (...keys: string[]) => Promise<string[]>;
  lpush: (key: string, ...values: string[]) => Promise<number>;
  ltrim: (key: string, start: number, stop: number) => Promise<unknown>;
  lrange: <T>(key: string, start: number, stop: number) => Promise<T[]>;
  del: (...keys: string[]) => Promise<number>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<unknown>;
  pipeline: () => {
    hincrby: (key: string, field: string, increment: number) => unknown;
    sadd: (key: string, ...members: string[]) => unknown;
    hgetall: (key: string) => unknown;
    scard: (key: string) => unknown;
    exec: <T = unknown[]>() => Promise<T>;
  };
};

export async function getAnalyticsKv(): Promise<AnalyticsKv | null> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  try {
    const mod = await import("@vercel/kv");
    return mod.kv as unknown as AnalyticsKv;
  } catch {
    return null;
  }
}

export const CONTENT_TYPES = ["article", "hero", "ad"] as const;
export const EVENT_TYPES = ["view", "click"] as const;

export function dayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Every UTC date from `from` to `to` inclusive (at most `max` days, newest kept). */
export function daysBetween(from: string, to: string, max = 400): string[] {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return [];
  const out: string[] = [];
  for (let t = end.getTime(); t >= start.getTime() && out.length < max; t -= 86400000) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out.reverse();
}

export function deviceFromUserAgent(ua: string): "mobile" | "tablet" | "desktop" {
  const s = ua || "";
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(s)) return "tablet";
  if (/Mobi|iPhone|iPod|Android.*Mobile|Windows Phone|BlackBerry|Opera Mini/i.test(s)) return "mobile";
  return "desktop";
}
