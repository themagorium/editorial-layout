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

export function trackEvent(
  contentId: string,
  contentType: ContentType,
  eventType: EventType,
  metadata?: Record<string, string>
) {
  fetch("/api/track-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentId, contentType, eventType, metadata }),
    keepalive: true,
  }).catch(() => {});
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
