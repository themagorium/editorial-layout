export type EventType = "view" | "click";
export type ContentType = "article" | "hero" | "ad";

export interface GeoLocation {
  city: string;
  country: string;
  countryCode: string;
  region: string;
}

export interface AnalyticsEvent {
  id: string;
  contentId: string;
  contentType: ContentType;
  eventType: EventType;
  timestamp: string;
  metadata?: Record<string, string>;
  location?: GeoLocation;
}

export interface Counts { pageviews: number; views: number; clicks: number }
export interface LocationRow extends Counts { city: string; country: string; countryCode: string }
export interface DeviceRow extends Counts { device: string }
export interface AdDetail {
  locations: LocationRow[];
  pages: { page: string; views: number; clicks: number }[];
  devices: DeviceRow[];
}

export interface AnalyticsPayload {
  range: { from: string; to: string; days: number };
  totals: { pageviews: number; visitors: number; views: number; clicks: number };
  content: { contentId: string; contentType: ContentType; views: number; clicks: number }[];
  locations: LocationRow[];
  devices: DeviceRow[];
  ads: Record<string, AdDetail>;
  daily: { date: string; pageviews: number; views: number; clicks: number; visitors: number }[];
  recent: AnalyticsEvent[];
}

export async function fetchAnalytics(publishToken: string, from?: string, to?: string): Promise<AnalyticsPayload | null> {
  try {
    const qs = new URLSearchParams();
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const res = await fetch(`/api/analytics-data${qs.toString() ? `?${qs}` : ""}`, {
      headers: { Authorization: `Bearer ${publishToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function clearAnalytics(publishToken: string): Promise<boolean> {
  try {
    const res = await fetch("/api/clear-analytics", {
      method: "POST",
      headers: { Authorization: `Bearer ${publishToken}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Tracking. Page visits, views and clicks are queued and sent in ONE small
// request after the page has settled (or when the visitor leaves), so tracking
// never slows the page down. Each item's view is counted once per visit, and a
// random anonymous id (no personal data) lets us count unique visitors.

type QueuedEvent = { contentId: string; contentType: ContentType; eventType: EventType };
const queue: QueuedEvent[] = [];
let pendingPageviews = 0;
let queuedPage = "";
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersAdded = false;
const seenViews = new Set<string>();

function isAdminPath(): boolean {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
}

function visitorId(): string {
  try {
    let id = localStorage.getItem("magorium:vid") || "";
    if (!/^[a-z0-9]{8,40}$/i.test(id)) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem("magorium:vid", id);
    }
    return id;
  } catch {
    return "";
  }
}

function alreadyViewed(key: string): boolean {
  if (seenViews.has(key)) return true;
  seenViews.add(key);
  try {
    const stored = JSON.parse(sessionStorage.getItem("magorium:viewed") || "[]") as string[];
    if (stored.includes(key)) return true;
    stored.push(key);
    sessionStorage.setItem("magorium:viewed", JSON.stringify(stored.slice(-500)));
  } catch { /* storage unavailable: in-memory de-dupe only */ }
  return false;
}

function send(body: string) {
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      if (navigator.sendBeacon("/api/track-event", new Blob([body], { type: "application/json" }))) return;
    }
  } catch { /* fall through to fetch */ }
  fetch("/api/track-event", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
}

function flush() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (!queue.length && !pendingPageviews) return;
  const events = queue.splice(0, queue.length);
  const pageviews = pendingPageviews;
  pendingPageviews = 0;
  const page = queuedPage || window.location.pathname;
  send(JSON.stringify({ vid: visitorId(), page, pageviews, events }));
}

function scheduleFlush(delay: number) {
  if (typeof window === "undefined") return;
  if (!listenersAdded) {
    listenersAdded = true;
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
  }
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
    if (idle) idle(flush, { timeout: 2000 }); else flush();
  }, delay);
}

/** Count one page visit (called on every route change). */
export function trackPageView() {
  if (typeof window === "undefined" || isAdminPath()) return;
  const path = window.location.pathname;
  // A new page: send anything queued for the previous page first, so brand
  // placements are credited to the page they actually appeared on.
  if (queuedPage && queuedPage !== path) flush();
  queuedPage = path;
  pendingPageviews += 1;
  scheduleFlush(3000);
}

export function trackEvent(
  contentId: string,
  contentType: ContentType,
  eventType: EventType,
  _metadata?: Record<string, string>
) {
  if (typeof window === "undefined" || !contentId || isAdminPath()) return;
  if (eventType === "view" && alreadyViewed(`${contentType}:${contentId}`)) return;
  const path = window.location.pathname;
  if (queuedPage && queuedPage !== path) flush();
  queuedPage = path;
  queue.push({ contentId, contentType, eventType });
  // Clicks usually navigate away: send soon. Views: wait for the page to settle.
  scheduleFlush(eventType === "click" ? 50 : 3000);
}

/** Add tracking tags to a brand link so the brand's own analytics credits The Magorium. */
export function withBrandTracking(url: string | undefined, campaign: string): string {
  if (!url || url === "#") return url || "#";
  try {
    const u = new URL(url, window.location.origin);
    if (u.origin === window.location.origin || !/^https?:$/.test(u.protocol)) return url;
    if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", "themagorium");
    if (!u.searchParams.has("utm_medium")) u.searchParams.set("utm_medium", "display");
    if (!u.searchParams.has("utm_campaign")) {
      u.searchParams.set("utm_campaign", campaign.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "brand");
    }
    return u.toString();
  } catch {
    return url;
  }
}
