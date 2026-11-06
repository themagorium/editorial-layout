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

export interface ContentStats {
  contentId: string;
  contentType: ContentType;
  views: number;
  clicks: number;
  label: string;
}

export interface LocationStats {
  city: string;
  country: string;
  countryCode: string;
  views: number;
  clicks: number;
}

export interface AnalyticsTotals {
  totalViews: number;
  totalClicks: number;
  totalEvents: number;
  uniqueLocations: number;
}

export interface AnalyticsPayload {
  totals: AnalyticsTotals;
  content: { contentId: string; contentType: ContentType; views: number; clicks: number }[];
  locations: LocationStats[];
  recent: AnalyticsEvent[];
}



export async function fetchAnalytics(publishToken: string): Promise<AnalyticsPayload | null> {
  try {
    const res = await fetch("/api/analytics-data", {
      headers: { Authorization: `Bearer ${publishToken}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Views and clicks are queued and sent in ONE small request after the page has
// settled (or when the visitor leaves), so tracking never slows the page down.
// Each item's view is counted once per visit (browser tab session).
type QueuedEvent = { contentId: string; contentType: ContentType; eventType: EventType };
const queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersAdded = false;
const seenViews = new Set<string>();

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

function flush() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (!queue.length) return;
  const events = queue.splice(0, queue.length);
  const body = JSON.stringify({ events });
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const ok = navigator.sendBeacon("/api/track-event", new Blob([body], { type: "application/json" }));
      if (ok) return;
    }
  } catch { /* fall through to fetch */ }
  fetch("/api/track-event", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
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

export function trackEvent(
  contentId: string,
  contentType: ContentType,
  eventType: EventType,
  _metadata?: Record<string, string>
) {
  if (typeof window === "undefined" || !contentId) return;
  if (window.location.pathname.startsWith("/admin")) return; // don't count the editor's own previews
  if (eventType === "view" && alreadyViewed(`${contentType}:${contentId}`)) return;
  queue.push({ contentId, contentType, eventType });
  // Clicks usually navigate away: send soon. Views: wait for the page to settle.
  scheduleFlush(eventType === "click" ? 50 : 3000);
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

export function mergeContentStats(
  content: AnalyticsPayload["content"],
  articles: { id: string; title: string }[],
  heroes: { id: string; title: string }[],
  ads: { id: string; label: string }[]
): ContentStats[] {
  const labelFor = (contentType: ContentType, contentId: string): string => {
    if (contentType === "article") return articles.find((a) => a.id === contentId)?.title || contentId;
    if (contentType === "hero") return heroes.find((h) => h.id === contentId)?.title || contentId;
    return ads.find((a) => a.id === contentId)?.label || contentId;
  };
  return content.map((c) => ({ ...c, label: labelFor(c.contentType, c.contentId) }));
}
