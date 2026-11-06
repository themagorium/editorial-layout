import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, MousePointer, TrendingUp, Users, MapPin, Printer, RotateCcw, Briefcase, BarChart3 } from "lucide-react";
import type { HeroItem, Article, AdSlot } from "@/lib/content-store";
import { CATEGORIES } from "@/lib/content-store";
import { fetchAnalytics, clearAnalytics, type AnalyticsPayload, type LocationRow, type DeviceRow } from "@/lib/analytics";
import { getAdminPublishToken } from "@/lib/admin-auth";

// Admin > Analytics. White page, black text. Pick a date range, see every
// category, hero, article and brand, then choose exactly what goes on the
// printout. "Brand report" gives a one-page printable report for one brand.

type SectionKey =
  | "summary" | "daily" | "cities" | "countries" | "devices"
  | "categories" | "heroes" | "articles" | "brands" | "recent";

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "summary", label: "Summary (visitors, page views, views, clicks)" },
  { key: "daily", label: "Day by day" },
  { key: "cities", label: "Cities" },
  { key: "countries", label: "Countries" },
  { key: "devices", label: "Devices (mobile / tablet / desktop)" },
  { key: "categories", label: "Categories" },
  { key: "heroes", label: "Heroes" },
  { key: "articles", label: "Articles" },
  { key: "brands", label: "Brands / advertising" },
  { key: "recent", label: "Recent activity" },
];

const PREFS_KEY = "magorium:analytics:print";

function iso(d: Date) { return d.toISOString().slice(0, 10); }
function daysAgo(n: number) { return iso(new Date(Date.now() - n * 86400000)); }
function pct(clicks: number, views: number) { return views > 0 ? `${((clicks / views) * 100).toFixed(1)}%` : "—"; }
function fmtDate(d: string) {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function loadPrefs(): { sections: Record<SectionKey, boolean>; categories: Record<string, boolean> } {
  const sections = Object.fromEntries(SECTIONS.map((s) => [s.key, s.key !== "recent"])) as Record<SectionKey, boolean>;
  const categories = Object.fromEntries(CATEGORIES.map((c) => [c, true])) as Record<string, boolean>;
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    return { sections: { ...sections, ...(saved.sections || {}) }, categories: { ...categories, ...(saved.categories || {}) } };
  } catch {
    return { sections, categories };
  }
}

type Row = { id: string; label: string; category: string; views: number; clicks: number };

export default function AnalyticsDashboard({ articles, heroes, ads }: { articles: Article[]; heroes: HeroItem[]; ads: AdSlot[] }) {
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(iso(new Date()));
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"overview" | "brand">("overview");
  const [brandId, setBrandId] = useState("");
  const [prefs, setPrefs] = useState(loadPrefs);
  const [showChecklist, setShowChecklist] = useState(false);

  useEffect(() => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* ignore */ } }, [prefs]);

  const load = useCallback(async () => {
    setLoading(true);
    const token = getAdminPublishToken();
    if (!token) { toast.error("Admin session expired. Please sign in again."); setLoading(false); return; }
    const result = await fetchAnalytics(token, from, to);
    if (!result) toast.error("Could not load analytics. Sign out and back in if this continues.");
    setData(result);
    setLoading(false);
  }, [from, to]);

  useEffect(() => { void load(); }, [load]);

  const handleClear = async () => {
    if (!window.confirm("Clear ALL analytics data, for every date? This cannot be undone.")) return;
    const token = getAdminPublishToken();
    if (!token) { toast.error("Admin session expired. Please sign in again."); return; }
    if (await clearAnalytics(token)) { toast.success("Analytics data cleared."); void load(); }
    else toast.error("Could not clear analytics data.");
  };

  const preset = (days: number) => { setFrom(daysAgo(days - 1)); setTo(iso(new Date())); };

  // Look-ups for names and categories.
  const articleById = useMemo(() => new Map(articles.map((a) => [a.id, a])), [articles]);
  const heroById = useMemo(() => new Map(heroes.map((h) => [h.id, h])), [heroes]);
  const adById = useMemo(() => new Map(ads.map((a) => [a.id, a])), [ads]);

  const pageLabel = useCallback((path: string) => {
    if (path === "/" || path === "") return "Homepage";
    const m = path.match(/--([^/]+)$/);
    if (m) {
      const id = decodeURIComponent(m[1]);
      const item = articleById.get(id) || heroById.get(id);
      if (item) return item.title;
    }
    return path;
  }, [articleById, heroById]);

  const rows = useMemo(() => {
    const heroesRows: Row[] = [];
    const articleRows: Row[] = [];
    const brandRows: Row[] = [];
    for (const c of data?.content || []) {
      if (c.contentType === "hero") {
        const h = heroById.get(c.contentId);
        heroesRows.push({ id: c.contentId, label: h?.title || c.contentId, category: h?.category || "Other", views: c.views, clicks: c.clicks });
      } else if (c.contentType === "article") {
        const a = articleById.get(c.contentId);
        articleRows.push({ id: c.contentId, label: a?.title || c.contentId, category: a?.category || "Other", views: c.views, clicks: c.clicks });
      } else {
        const ad = adById.get(c.contentId);
        brandRows.push({ id: c.contentId, label: ad?.label || c.contentId, category: ad?.position || "", views: c.views, clicks: c.clicks });
      }
    }
    const byViews = (a: Row, b: Row) => b.views - a.views || b.clicks - a.clicks;
    return { heroes: heroesRows.sort(byViews), articles: articleRows.sort(byViews), brands: brandRows.sort(byViews) };
  }, [data, articleById, heroById, adById]);

  const categories = useMemo(() => {
    const all = [...rows.heroes.map((r) => ({ ...r, kind: "Hero" })), ...rows.articles.map((r) => ({ ...r, kind: "Article" }))];
    const names = [...CATEGORIES, ...new Set(all.map((r) => r.category).filter((c) => !(CATEGORIES as string[]).includes(c)))];
    return names.map((name) => {
      const items = all.filter((r) => r.category === name).sort((a, b) => b.views - a.views);
      return { name, items, views: items.reduce((s, r) => s + r.views, 0), clicks: items.reduce((s, r) => s + r.clicks, 0) };
    });
  }, [rows]);

  const countries = useMemo(() => {
    const m = new Map<string, { country: string; countryCode: string; pageviews: number; views: number; clicks: number }>();
    for (const l of data?.locations || []) {
      const k = l.countryCode || l.country;
      const c = m.get(k) || { country: l.country, countryCode: l.countryCode, pageviews: 0, views: 0, clicks: 0 };
      c.pageviews += l.pageviews; c.views += l.views; c.clicks += l.clicks;
      m.set(k, c);
    }
    return [...m.values()].sort((a, b) => (b.pageviews + b.views) - (a.pageviews + a.views));
  }, [data]);

  const brandOptions = useMemo(() => {
    const ids = new Set([...ads.map((a) => a.id), ...rows.brands.map((r) => r.id)]);
    return [...ids].map((id) => ({ id, label: adById.get(id)?.label || id }));
  }, [ads, rows.brands, adById]);

  useEffect(() => { if (!brandId && brandOptions.length) setBrandId(brandOptions[0].id); }, [brandOptions, brandId]);

  const inc = (k: SectionKey) => prefs.sections[k];
  const hideInPrint = (k: SectionKey) => (inc(k) ? "" : " print:hidden");
  const rangeLabel = `${fmtDate(from)} – ${fmtDate(to)}`;
  const generated = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div id="analytics-print-area" className="space-y-8 bg-white text-black rounded-lg p-6 border border-gray-200 print:border-0 print:p-0 print:rounded-none">
      <style>{`
        .print-only { display: none; }
        @media print {
          body * { visibility: hidden; }
          #analytics-print-area, #analytics-print-area * { visibility: visible; color: #000 !important; }
          #analytics-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
          .print-only { display: block !important; }
          .avoid-break { break-inside: avoid; page-break-inside: avoid; }
          #analytics-print-area h3, #analytics-print-area h4 { break-after: avoid; page-break-after: avoid; }
          @page { margin: 16mm; }
        }
      `}</style>

      {/* Printed header */}
      <div className="print-only mb-6">
        <h1 className="text-2xl font-serif font-bold">
          The Magorium — {mode === "brand" ? `Brand Performance Report: ${adById.get(brandId)?.label || brandId}` : "Analytics Report"}
        </h1>
        <p className="text-sm mt-1">Period: {rangeLabel} &nbsp;·&nbsp; Generated: {generated}</p>
      </div>

      {/* Controls (screen only) */}
      <div className="space-y-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setMode("overview")} className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest font-sans border rounded ${mode === "overview" ? "border-black bg-gray-200 font-semibold" : "border-gray-300 hover:bg-gray-50"}`}>
            <BarChart3 className="w-4 h-4" /> Overview
          </button>
          <button onClick={() => setMode("brand")} className={`flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest font-sans border rounded ${mode === "brand" ? "border-black bg-gray-200 font-semibold" : "border-gray-300 hover:bg-gray-50"}`}>
            <Briefcase className="w-4 h-4" /> Brand report
          </button>
          <div className="ml-auto flex gap-2">
            <button onClick={() => void load()} className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest font-sans border border-gray-300 rounded hover:bg-gray-50"><RotateCcw className="w-3 h-3" /> Refresh</button>
            {mode === "overview" && (
              <button onClick={() => setShowChecklist((v) => !v)} className="px-4 py-2 text-xs uppercase tracking-widest font-sans border border-gray-300 rounded hover:bg-gray-50">
                {showChecklist ? "Hide print checklist" : "Print checklist"}
              </button>
            )}
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest font-sans border border-black rounded hover:bg-gray-50"><Printer className="w-4 h-4" /> Print</button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 font-sans text-sm">
          <label className="flex flex-col gap-1"><span className="text-[10px] uppercase tracking-widest">From</span>
            <input type="date" value={from} max={to} onChange={(e) => e.target.value && setFrom(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 bg-white text-black" />
          </label>
          <label className="flex flex-col gap-1"><span className="text-[10px] uppercase tracking-widest">To</span>
            <input type="date" value={to} min={from} max={iso(new Date())} onChange={(e) => e.target.value && setTo(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 bg-white text-black" />
          </label>
          {[["Today", 1], ["7 days", 7], ["30 days", 30], ["90 days", 90], ["12 months", 365]].map(([label, n]) => (
            <button key={label} onClick={() => preset(n as number)} className="px-3 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50">{label}</button>
          ))}
          {mode === "brand" && (
            <label className="flex flex-col gap-1 ml-auto"><span className="text-[10px] uppercase tracking-widest">Brand</span>
              <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 bg-white text-black min-w-[220px]">
                {brandOptions.length === 0 && <option value="">No brands yet</option>}
                {brandOptions.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </label>
          )}
        </div>
        <p className="text-xs font-sans">Dates are in UTC. Day-by-day figures start from 6 November 2026, when daily tracking began.</p>

        {mode === "overview" && showChecklist && (
          <div className="border border-gray-300 rounded p-4 font-sans text-sm">
            <p className="font-semibold mb-3">Include in printout</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {SECTIONS.map((s) => (
                <label key={s.key} className="flex items-center gap-2">
                  <input type="checkbox" checked={prefs.sections[s.key]} onChange={(e) => setPrefs((p) => ({ ...p, sections: { ...p.sections, [s.key]: e.target.checked } }))} />
                  {s.label}
                </label>
              ))}
            </div>
            {prefs.sections.categories && (
              <>
                <p className="font-semibold mt-4 mb-2">Categories to include</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {categories.map((c) => (
                    <label key={c.name} className="flex items-center gap-2">
                      <input type="checkbox" checked={prefs.categories[c.name] !== false} onChange={(e) => setPrefs((p) => ({ ...p, categories: { ...p.categories, [c.name]: e.target.checked } }))} />
                      {c.name}
                    </label>
                  ))}
                </div>
              </>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPrefs((p) => ({ sections: Object.fromEntries(SECTIONS.map((s) => [s.key, true])) as Record<SectionKey, boolean>, categories: Object.fromEntries(Object.keys(p.categories).map((c) => [c, true])) }))} className="px-3 py-1.5 text-xs border border-gray-300 rounded">Select all</button>
              <button onClick={() => setPrefs((p) => ({ ...p, sections: Object.fromEntries(SECTIONS.map((s) => [s.key, false])) as Record<SectionKey, boolean> }))} className="px-3 py-1.5 text-xs border border-gray-300 rounded">Clear all</button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 font-sans">Loading analytics…</div>
      ) : !data ? (
        <div className="text-center py-16 font-sans">Analytics unavailable. Try Refresh, or sign out and back in.</div>
      ) : mode === "brand" ? (
        <BrandReport id={brandId} ad={adById.get(brandId)} data={data} row={rows.brands.find((r) => r.id === brandId)} pageLabel={pageLabel} />
      ) : (
        <>
          <section className={`avoid-break${hideInPrint("summary")}`}>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <Stat icon={<Users className="w-5 h-5" />} label="Unique visitors" value={data.totals.visitors} />
              <Stat icon={<Eye className="w-5 h-5" />} label="Page views" value={data.totals.pageviews} />
              <Stat icon={<Eye className="w-5 h-5" />} label="Content views" value={data.totals.views} />
              <Stat icon={<MousePointer className="w-5 h-5" />} label="Clicks" value={data.totals.clicks} />
              <Stat icon={<TrendingUp className="w-5 h-5" />} label="Click rate" value={pct(data.totals.clicks, data.totals.views)} />
            </div>
          </section>

          <Section title="Day by day" className={hideInPrint("daily")}>
            <Table head={["Date", "Visitors", "Page views", "Content views", "Clicks"]}
              rows={data.daily.filter((d) => d.pageviews || d.views || d.clicks || d.visitors).reverse().map((d) => [fmtDate(d.date), d.visitors, d.pageviews, d.views, d.clicks])} empty="No visits in this period yet." />
          </Section>

          <Section title="Cities" icon={<MapPin className="w-4 h-4" />} className={hideInPrint("cities")}>
            <LocationTable rows={data.locations} />
          </Section>

          <Section title="Countries" className={hideInPrint("countries")}>
            <Table head={["Country", "Page views", "Content views", "Clicks"]} rows={countries.map((c) => [`${c.country}${c.countryCode ? ` (${c.countryCode})` : ""}`, c.pageviews, c.views, c.clicks])} empty="No location data yet." />
          </Section>

          <Section title="Devices" className={hideInPrint("devices")}>
            <DeviceTable rows={data.devices} />
          </Section>

          <Section title="Categories" className={hideInPrint("categories")}>
            <Table head={["Category", "Items", "Views", "Clicks", "Click rate"]}
              rows={categories.filter((c) => c.items.length).map((c) => [c.name, c.items.length, c.views, c.clicks, pct(c.clicks, c.views)])} empty="No category data yet." />
            <div className="space-y-6 mt-6">
              {categories.filter((c) => c.items.length).map((c) => (
                <div key={c.name} className={`avoid-break${prefs.categories[c.name] === false ? " print:hidden" : ""}`}>
                  <h4 className="font-serif font-semibold mb-2">{c.name}</h4>
                  <Table head={["Title", "Type", "Views", "Clicks", "Click rate"]} rows={c.items.map((r) => [r.label, r.kind, r.views, r.clicks, pct(r.clicks, r.views)])} />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Heroes" className={hideInPrint("heroes")}>
            <Table head={["Hero", "Category", "Views", "Clicks", "Click rate"]} rows={rows.heroes.map((r) => [r.label, r.category, r.views, r.clicks, pct(r.clicks, r.views)])} empty="No hero data in this period." />
          </Section>

          <Section title="Articles" className={hideInPrint("articles")}>
            <Table head={["Article", "Category", "Views", "Clicks", "Click rate"]} rows={rows.articles.map((r) => [r.label, r.category, r.views, r.clicks, pct(r.clicks, r.views)])} empty="No article data in this period." />
          </Section>

          <Section title="Brands / advertising" className={hideInPrint("brands")}>
            <Table head={["Brand", "Placement", "Impressions", "Clicks", "Click rate"]} rows={rows.brands.map((r) => [r.label, r.category, r.views, r.clicks, pct(r.clicks, r.views)])} empty="No brand impressions in this period." />
          </Section>

          <Section title="Recent activity" className={hideInPrint("recent")}>
            <Table head={["When", "Event", "Item", "Location"]} rows={(data.recent || []).map((ev) => [
              new Date(ev.timestamp).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
              ev.eventType,
              `${ev.contentType}: ${ev.contentType === "ad" ? adById.get(ev.contentId)?.label || ev.contentId : (articleById.get(ev.contentId) || heroById.get(ev.contentId))?.title || ev.contentId}`,
              ev.location ? `${ev.location.city}, ${ev.location.countryCode}` : "—",
            ])} empty="No activity yet." />
          </Section>

          <div className="flex justify-end print:hidden">
            <button onClick={handleClear} className="px-4 py-2 text-xs uppercase tracking-widest font-sans border border-red-400 text-red-600 rounded hover:bg-red-50">Clear all data</button>
          </div>
        </>
      )}
    </div>
  );
}

function BrandReport({ id, ad, data, row, pageLabel }: {
  id: string; ad?: AdSlot; data: AnalyticsPayload; row?: Row; pageLabel: (p: string) => string;
}) {
  if (!id) return <div className="py-12 text-center font-sans">Add a brand under Advertising to see its report.</div>;
  const detail = data.ads?.[id] || { locations: [], pages: [], devices: [] };
  const impressions = row?.views || 0;
  const clicks = row?.clicks || 0;
  const countries = new Map<string, { label: string; views: number; clicks: number }>();
  for (const l of detail.locations) {
    const k = l.countryCode || l.country;
    const c = countries.get(k) || { label: `${l.country}${l.countryCode ? ` (${l.countryCode})` : ""}`, views: 0, clicks: 0 };
    c.views += l.views; c.clicks += l.clicks; countries.set(k, c);
  }
  return (
    <div className="space-y-8">
      <section className="avoid-break">
        <h2 className="text-xl font-serif font-bold">{ad?.label || id}</h2>
        <p className="text-sm font-sans mt-1">
          Placement: {ad?.position || "—"}{ad?.linkUrl ? <> &nbsp;·&nbsp; Links to: {ad.linkUrl}</> : null}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <Stat icon={<Eye className="w-5 h-5" />} label="Impressions" value={impressions} />
          <Stat icon={<MousePointer className="w-5 h-5" />} label="Clicks" value={clicks} />
          <Stat icon={<TrendingUp className="w-5 h-5" />} label="Click rate" value={pct(clicks, impressions)} />
          <Stat icon={<Users className="w-5 h-5" />} label="Site visitors (period)" value={data.totals.visitors} />
        </div>
      </section>
      <Section title="Top cities" icon={<MapPin className="w-4 h-4" />}>
        <Table head={["City", "Country", "Impressions", "Clicks", "Click rate"]} rows={detail.locations.map((l) => [l.city, l.country, l.views, l.clicks, pct(l.clicks, l.views)])} empty="No impressions in this period." />
      </Section>
      <Section title="Countries">
        <Table head={["Country", "Impressions", "Clicks", "Click rate"]} rows={[...countries.values()].sort((a, b) => b.views - a.views).map((c) => [c.label, c.views, c.clicks, pct(c.clicks, c.views)])} empty="No impressions in this period." />
      </Section>
      <Section title="Devices">
        <Table head={["Device", "Impressions", "Clicks", "Click rate"]} rows={detail.devices.map((d) => [cap(d.device), d.views, d.clicks, pct(d.clicks, d.views)])} empty="No impressions in this period." />
      </Section>
      <Section title="Appeared alongside">
        <Table head={["Page / story", "Impressions", "Clicks", "Click rate"]} rows={detail.pages.map((p) => [pageLabel(p.page), p.views, p.clicks, pct(p.clicks, p.views)])} empty="No impressions in this period." />
      </Section>
      <p className="text-xs font-sans">Impressions = times the placement was shown (counted once per visit). Click rate = clicks ÷ impressions. Links carry utm_source=themagorium so visits also appear in the brand's own analytics.</p>
    </div>
  );
}

function cap(s: string) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white border border-gray-300 rounded p-4 flex items-center gap-3 avoid-break">
      <div className="w-9 h-9 rounded flex items-center justify-center bg-gray-100">{icon}</div>
      <div>
        <p className="text-2xl font-serif font-bold">{value}</p>
        <p className="text-[10px] font-sans uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

function Section({ title, icon, className = "", children }: { title: string; icon?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <section className={className}>
      <h3 className="font-serif text-lg font-semibold mb-3 flex items-center gap-2">{icon}{title}</h3>
      {children}
    </section>
  );
}

function Table({ head, rows, empty = "No data." }: { head: string[]; rows: (string | number)[][]; empty?: string }) {
  return (
    <div className="border border-gray-300 rounded overflow-hidden">
      <table className="w-full text-sm font-sans">
        <thead>
          <tr className="border-b border-gray-300 bg-gray-50">
            {head.map((h, i) => <th key={h} className={`px-3 py-2 text-[10px] uppercase tracking-widest font-semibold ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={head.length} className="px-3 py-6 text-center">{empty}</td></tr>
          ) : rows.map((r, i) => (
            <tr key={i} className="border-b border-gray-200 last:border-0 avoid-break">
              {r.map((cell, j) => <td key={j} className={`px-3 py-2 ${j === 0 ? "text-left" : "text-right tabular-nums"}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LocationTable({ rows }: { rows: LocationRow[] }) {
  return <Table head={["City", "Country", "Page views", "Content views", "Clicks"]} rows={rows.map((l) => [l.city, `${l.country}${l.countryCode ? ` (${l.countryCode})` : ""}`, l.pageviews, l.views, l.clicks])} empty="No location data yet." />;
}

function DeviceTable({ rows }: { rows: DeviceRow[] }) {
  return <Table head={["Device", "Page views", "Content views", "Clicks"]} rows={rows.map((d) => [cap(d.device), d.pageviews, d.views, d.clicks])} empty="No device data yet." />;
}
