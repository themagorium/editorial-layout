// Analytics tracking system — localStorage-backed, easily swappable to a real DB.

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

const STORAGE_KEY = "editorial_analytics";
const GEO_CACHE_KEY = "editorial_geo_cache";
const GEO_CACHE_TTL = 1000 * 60 * 30; // 30 min

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

// Cache geo result to avoid excessive API calls
let geoPromise: Promise<GeoLocation | null> | null = null;

async function fetchGeoLocation(): Promise<GeoLocation | null> {
  try {
    // Check cache first
    const cached = localStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < GEO_CACHE_TTL) return data as GeoLocation;
    }

    // Use free ip-api.com (no key required, 45 req/min)
    const res = await fetch("http://ip-api.com/json/?fields=status,city,country,countryCode,regionName");
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== "success") return null;

    const geo: GeoLocation = {
      city: json.city || "Unknown",
      country: json.country || "Unknown",
      countryCode: json.countryCode || "??",
      region: json.regionName || "",
    };

    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ data: geo, ts: Date.now() }));
    return geo;
  } catch {
    return null;
  }
}

function getGeoLocation(): Promise<GeoLocation | null> {
  if (!geoPromise) {
    geoPromise = fetchGeoLocation();
    // Reset after resolution so next call after TTL will re-fetch
    geoPromise.finally(() => { setTimeout(() => { geoPromise = null; }, 5000); });
  }
  return geoPromise;
}

export function trackEvent(
  contentId: string,
  contentType: ContentType,
  eventType: EventType,
  metadata?: Record<string, string>
) {
  const eventId = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const event: AnalyticsEvent = {
    id: eventId,
    contentId,
    contentType,
    eventType,
    timestamp: new Date().toISOString(),
    metadata,
  };

  // Save immediately without location, then update async
  const events = getEvents();
  events.push(event);
  saveEvents(events);

  // Async geo enrichment
  getGeoLocation().then((geo) => {
    if (!geo) return;
    const current = getEvents();
    const idx = current.findIndex((e) => e.id === eventId);
    if (idx !== -1) {
      current[idx].location = geo;
      saveEvents(current);
    }
  });
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

export function getLocationStats(): LocationStats[] {
  const events = getEvents();
  const map = new Map<string, LocationStats>();

  for (const ev of events) {
    if (!ev.location) continue;
    const key = `${ev.location.city}|${ev.location.country}`;
    if (!map.has(key)) {
      map.set(key, {
        city: ev.location.city,
        country: ev.location.country,
        countryCode: ev.location.countryCode,
        views: 0,
        clicks: 0,
      });
    }
    const entry = map.get(key)!;
    if (ev.eventType === "view") entry.views++;
    if (ev.eventType === "click") entry.clicks++;
  }

  return Array.from(map.values()).sort((a, b) => (b.views + b.clicks) - (a.views + a.clicks));
}

export function getTotalStats() {
  const events = getEvents();
  const uniqueLocations = new Set<string>();
  for (const ev of events) {
    if (ev.location) uniqueLocations.add(`${ev.location.city}|${ev.location.country}`);
  }
  return {
    totalViews: events.filter((e) => e.eventType === "view").length,
    totalClicks: events.filter((e) => e.eventType === "click").length,
    totalEvents: events.length,
    uniqueLocations: uniqueLocations.size,
  };
}

export function getRecentEvents(limit = 20): AnalyticsEvent[] {
  return getEvents().slice(-limit).reverse();
}

export function clearAnalytics() {
  localStorage.removeItem(STORAGE_KEY);
}
