// Shared database access for the admin Analytics tab.
// Same Upstash/Vercel KV database the rest of the site uses.

export type AnalyticsKv = {
  hincrby: (key: string, field: string, increment: number) => Promise<number>;
  hgetall: <T>(key: string) => Promise<Record<string, T> | null>;
  sadd: (key: string, ...members: string[]) => Promise<number>;
  smembers: (key: string) => Promise<string[]>;
  lpush: (key: string, ...values: string[]) => Promise<number>;
  ltrim: (key: string, start: number, stop: number) => Promise<unknown>;
  lrange: <T>(key: string, start: number, stop: number) => Promise<T[]>;
  del: (...keys: string[]) => Promise<number>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<unknown>;
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
