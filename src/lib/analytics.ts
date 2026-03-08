// Analytics tracking system — localStorage-backed, easily swappable to a real DB.

export type EventType = "view" | "click";
export type ContentType = "article" | "hero" | "ad";

export interface AnalyticsEvent {
  id: string;
  contentId: string;
  contentType: ContentType;
  eventType: EventType;
  timestamp: string;
  metadata?: Record<string, string>;
}

export interface ContentStats {
  contentId: string;
  contentType: ContentType;
  views: number;
  clicks: number;
  label: string;
}

const STORAGE_KEY = "editorial_analytics";

function getEvents(): AnalyticsEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: AnalyticsEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function trackEvent(
  contentId: string,
  contentType: ContentType,
  eventType: EventType,
  metadata?: Record<string, string>
) {
  const events = getEvents();
  events.push({
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    contentId,
    contentType,
    eventType,
    timestamp: new Date().toISOString(),
    metadata,
  });
  saveEvents(events);
}

export function getAnalyticsSummary(
  articles: { id: string; title: string }[],
  heroes: { id: string; title: string }[],
  ads: { id: string; label: string }[]
): ContentStats[] {
  const events = getEvents();

  const countMap = new Map<string, { views: number; clicks: number }>();
  for (const ev of events) {
    const key = `${ev.contentType}:${ev.contentId}`;
    if (!countMap.has(key)) countMap.set(key, { views: 0, clicks: 0 });
    const entry = countMap.get(key)!;
    if (ev.eventType === "view") entry.views++;
    if (ev.eventType === "click") entry.clicks++;
  }

  const stats: ContentStats[] = [];

  for (const a of articles) {
    const key = `article:${a.id}`;
    const counts = countMap.get(key) || { views: 0, clicks: 0 };
    stats.push({ contentId: a.id, contentType: "article", label: a.title, ...counts });
  }
  for (const h of heroes) {
    const key = `hero:${h.id}`;
    const counts = countMap.get(key) || { views: 0, clicks: 0 };
    stats.push({ contentId: h.id, contentType: "hero", label: h.title, ...counts });
  }
  for (const ad of ads) {
    const key = `ad:${ad.id}`;
    const counts = countMap.get(key) || { views: 0, clicks: 0 };
    stats.push({ contentId: ad.id, contentType: "ad", label: ad.label, ...counts });
  }

  return stats;
}

export function getTotalStats() {
  const events = getEvents();
  return {
    totalViews: events.filter((e) => e.eventType === "view").length,
    totalClicks: events.filter((e) => e.eventType === "click").length,
    totalEvents: events.length,
  };
}

export function getRecentEvents(limit = 20): AnalyticsEvent[] {
  return getEvents().slice(-limit).reverse();
}

export function clearAnalytics() {
  localStorage.removeItem(STORAGE_KEY);
}
