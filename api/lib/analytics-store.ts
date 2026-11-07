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

/** Phone / computer family from the browser's user agent. */
export function platformFromUserAgent(ua: string): string {
  const s = ua || "";
  if (/iPhone|iPod/i.test(s)) return "iPhone";
  if (/iPad/i.test(s) || (/Macintosh/i.test(s) && /Mobile\//i.test(s))) return "iPad";
  if (/Android/i.test(s)) return /Mobile/i.test(s) ? "Android phone" : "Android tablet";
  if (/Windows Phone/i.test(s)) return "Other phone";
  if (/Windows NT/i.test(s)) return "Windows computer";
  if (/CrOS/i.test(s)) return "Chromebook";
  if (/Macintosh|Mac OS X/i.test(s)) return "Mac";
  if (/Linux/i.test(s)) return "Linux computer";
  return "Other";
}

const SEARCH_HOSTS: [RegExp, string][] = [
  [/(^|\.)google\./, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)(search\.)?yahoo\./, "Yahoo"],
  [/(^|\.)(ecosia\.org|search\.brave\.com|yandex\.|baidu\.com|qwant\.com|startpage\.com|naver\.com|perplexity\.ai|chatgpt\.com|you\.com)/, "Other web search / AI"],
];
const SOCIAL_HOSTS: [RegExp, string][] = [
  [/(^|\.)instagram\.com$|^l\.instagram\.com$/, "Instagram"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|m\.facebook\.com|l\.facebook\.com)$/, "Facebook"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "LinkedIn"],
  [/(^|\.)(twitter\.com|x\.com|t\.co)$/, "X / Twitter"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)(pinterest\.[a-z.]+|pin\.it)$/, "Pinterest"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "WhatsApp"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube"],
  [/(^|\.)reddit\.com$/, "Reddit"],
  [/(^|\.)threads\.net$/, "Threads"],
];
const EMAIL_HOSTS = /(^|\.)(mail\.google\.com|outlook\.(live|office|office365)\.com|mail\.yahoo\.com|mail\.aol\.com|webmail\.|mail\.proton\.me|mail\.zoho\.|icloud\.com|secureserver\.net)/;

/** Where a visit came from, e.g. "Instagram", "Google", "Email", "Direct". */
export function classifySource(opts: { referrer?: string; utmSource?: string; utmMedium?: string; userAgent?: string; siteHost?: string }): { source: string; host: string } {
  const ua = opts.userAgent || "";
  const utmS = (opts.utmSource || "").toLowerCase();
  const utmM = (opts.utmMedium || "").toLowerCase();
  let host = "";
  try { host = opts.referrer ? new URL(opts.referrer).hostname.toLowerCase().replace(/^www\./, "") : ""; } catch { host = ""; }
  const site = (opts.siteHost || "themagorium.com").toLowerCase().replace(/^www\./, "");
  if (host && (host === site || host.endsWith(`.${site}`))) host = "";

  // 1) Tagged links (utm_...) win.
  if (/newsletter|mailchimp|klaviyo|substack|beehiiv|convertkit|sendinblue|brevo|campaign-monitor/.test(`${utmS} ${utmM}`)) return { source: "Newsletter", host: utmS || utmM || host };
  if (utmM === "email" || /email|e-mail/.test(utmS)) return { source: "Email", host: utmS || host };
  if (utmS) {
    for (const [re, name] of SOCIAL_HOSTS) if (re.test(`${utmS}.com`) || utmS.includes(name.toLowerCase().split(" ")[0])) return { source: name, host: utmS };
    if (/google/.test(utmS)) return { source: "Google", host: utmS };
  }
  // 2) In-app browsers often send no referrer but identify themselves.
  if (/Instagram/i.test(ua)) return { source: "Instagram", host: host || "instagram app" };
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return { source: "Facebook", host: host || "facebook app" };
  if (/LinkedInApp/i.test(ua)) return { source: "LinkedIn", host: host || "linkedin app" };
  if (/musical_ly|BytedanceWebview|TikTok/i.test(ua)) return { source: "TikTok", host: host || "tiktok app" };
  if (/Pinterest/i.test(ua)) return { source: "Pinterest", host: host || "pinterest app" };
  if (/Snapchat/i.test(ua)) return { source: "Snapchat", host: host || "snapchat app" };
  if (/WhatsApp/i.test(ua)) return { source: "WhatsApp", host: host || "whatsapp" };
  // 3) Referring website.
  if (!host) return { source: "Direct (typed, bookmark or app)", host: "" };
  if (/(^|\.)(substack\.com|beehiiv\.com|list-manage\.com|mailchi\.mp|klaviyo\.com|convertkit\.com|campaign-archive\.com)$/.test(host)) return { source: "Newsletter", host };
  if (EMAIL_HOSTS.test(host)) return { source: "Email", host };
  for (const [re, name] of SEARCH_HOSTS) if (re.test(host)) return { source: name, host };
  for (const [re, name] of SOCIAL_HOSTS) if (re.test(host)) return { source: name, host };
  return { source: "Other websites", host };
}
