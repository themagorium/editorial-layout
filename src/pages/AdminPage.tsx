import { useState, useEffect, useRef } from "react";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import ArticleBodyEditor from "@/components/editorial/ArticleBodyEditor";
import {
  getHeroes, getArticles, getAds,
  saveHeroes, saveArticles, saveAds, resetToDefaults,
  CATEGORIES, getEditions, formatEditionLabel,
} from "@/lib/content-store";
import type { HeroItem, Article, AdSlot, Category, ArticleBodyBlock } from "@/lib/content-store";
import { Trash2, Plus, Upload, RotateCcw, Image, Video, BarChart3, Eye, MousePointer, TrendingUp, MapPin, Globe, Calendar, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { getAnalyticsSummary, getTotalStats, getRecentEvents, getLocationStats, clearAnalytics, type ContentStats } from "@/lib/analytics";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export default function AdminPage() {
  const [heroes, setHeroes] = useState<HeroItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [ads, setAds] = useState<AdSlot[]>([]);
  const [tab, setTab] = useState<"heroes" | "articles" | "ads" | "analytics">("heroes");

  useEffect(() => {
    setHeroes(getHeroes());
    setArticles(getArticles());
    setAds(getAds());
  }, []);

  const save = () => {
    saveHeroes(heroes);
    saveArticles(articles);
    saveAds(ads);
    toast.success("Content saved successfully!");
  };

  const handleReset = () => {
    resetToDefaults();
    setHeroes(getHeroes());
    setArticles(getArticles());
    setAds(getAds());
    toast.success("Reset to defaults.");
  };

  return (
    <div className="min-h-screen bg-background">
      <EditorialHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="font-serif text-3xl font-bold">Content Manager</h2>
            <p className="text-sm text-muted-foreground font-sans mt-1">Upload and manage articles, heroes, and advertising</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded text-muted-foreground hover:text-foreground transition-colors">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button onClick={save} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity">
              Save Changes
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-8">
          {(["heroes", "articles", "ads", "analytics"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-sans uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "analytics" && <BarChart3 className="w-4 h-4" />}
              {t === "ads" ? "Advertising" : t === "analytics" ? "Analytics" : t}
            </button>
          ))}
        </div>

        {tab === "heroes" && (
          <HeroesManager heroes={heroes} setHeroes={setHeroes} />
        )}
        {tab === "articles" && (
          <ArticlesManager articles={articles} setArticles={setArticles} />
        )}
        {tab === "ads" && (
          <AdsManager ads={ads} setAds={setAds} />
        )}
        {tab === "analytics" && (
          <AnalyticsDashboard articles={articles} heroes={heroes} ads={ads} />
        )}
      </div>
    </div>
  );
}

/* ---- Heroes Manager ---- */
function HeroesManager({ heroes, setHeroes }: { heroes: HeroItem[]; setHeroes: (h: HeroItem[]) => void }) {
  const addHero = () => {
    setHeroes([
      ...heroes,
      { id: `h-${Date.now()}`, title: "New Hero", subtitle: "", category: "Travel", imageUrl: "", date: new Date().toISOString().split("T")[0], edition: new Date().toISOString().slice(0, 7) },
    ]);
  };

  const update = (id: string, patch: Partial<HeroItem>) => {
    setHeroes(heroes.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  };

  const remove = (id: string) => setHeroes(heroes.filter((h) => h.id !== id));

  return (
    <div className="space-y-6">
      {heroes.map((hero) => (
        <ContentCard key={hero.id} onRemove={() => remove(hero.id)}>
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
            <MediaUpload
              imageUrl={hero.imageUrl}
              videoUrl={hero.videoUrl}
              onImage={(url) => update(hero.id, { imageUrl: url })}
              onVideo={(url) => update(hero.id, { videoUrl: url })}
            />
            <div className="space-y-3">
              <input value={hero.title} onChange={(e) => update(hero.id, { title: e.target.value })} placeholder="Hero title" className="w-full bg-secondary text-foreground px-3 py-2 rounded font-serif text-lg" />
              <input value={hero.subtitle} onChange={(e) => update(hero.id, { subtitle: e.target.value })} placeholder="Subtitle" className="w-full bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans" />
              <div className="flex gap-3">
                <select value={hero.category} onChange={(e) => update(hero.id, { category: e.target.value as Category })} className="bg-secondary text-foreground px-3 py-2 rounded text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="date" value={hero.date} onChange={(e) => update(hero.id, { date: e.target.value })} className="bg-secondary text-foreground px-3 py-2 rounded text-sm" />
              </div>
            </div>
          </div>
        </ContentCard>
      ))}
      <AddButton onClick={addHero} label="Add Hero" />
    </div>
  );
}

/* ---- Articles Manager ---- */
function ArticlesManager({ articles, setArticles }: { articles: Article[]; setArticles: (a: Article[]) => void }) {
  const addArticle = () => {
    setArticles([
      ...articles,
      { id: `a-${Date.now()}`, title: "New Article", excerpt: "", category: "Travel", imageUrl: "", author: "", date: new Date().toISOString().split("T")[0], edition: new Date().toISOString().slice(0, 7) },
    ]);
  };

  const update = (id: string, patch: Partial<Article>) => {
    setArticles(articles.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const remove = (id: string) => setArticles(articles.filter((a) => a.id !== id));

  return (
    <div className="space-y-6">
      {articles.map((article) => (
        <ContentCard key={article.id} onRemove={() => remove(article.id)}>
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
            <MediaUpload
              imageUrl={article.imageUrl}
              videoUrl={article.videoUrl}
              onImage={(url) => update(article.id, { imageUrl: url })}
              onVideo={(url) => update(article.id, { videoUrl: url })}
            />
            <div className="space-y-3">
              <input value={article.title} onChange={(e) => update(article.id, { title: e.target.value })} placeholder="Article title" className="w-full bg-secondary text-foreground px-3 py-2 rounded font-serif text-lg" />
              <textarea value={article.excerpt} onChange={(e) => update(article.id, { excerpt: e.target.value })} placeholder="Excerpt" rows={2} className="w-full bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans resize-none" />
              <div className="flex flex-wrap gap-3">
                <select value={article.category} onChange={(e) => update(article.id, { category: e.target.value as Category })} className="bg-secondary text-foreground px-3 py-2 rounded text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input value={article.author} onChange={(e) => update(article.id, { author: e.target.value })} placeholder="Author" className="bg-secondary text-foreground px-3 py-2 rounded text-sm" />
                <input type="date" value={article.date} onChange={(e) => update(article.id, { date: e.target.value })} className="bg-secondary text-foreground px-3 py-2 rounded text-sm" />
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={article.featured || false} onChange={(e) => update(article.id, { featured: e.target.checked })} className="accent-primary" />
                  Featured
                </label>
              </div>
              {/* Article body editor */}
              <div className="mt-4 pt-4 border-t border-border">
                <ArticleBodyEditor
                  blocks={article.body || []}
                  onChange={(blocks) => update(article.id, { body: blocks })}
                />
              </div>
            </div>
          </div>
        </ContentCard>
      ))}
      <AddButton onClick={addArticle} label="Add Article" />
    </div>
  );
}

/* ---- Ads Manager ---- */
function AdsManager({ ads, setAds }: { ads: AdSlot[]; setAds: (a: AdSlot[]) => void }) {
  const update = (id: string, patch: Partial<AdSlot>) => {
    setAds(ads.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground font-sans">Upload images or videos for each ad placement. These slots appear throughout the editorial layout.</p>
      {ads.map((ad) => (
        <ContentCard key={ad.id}>
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
            <MediaUpload
              imageUrl={ad.imageUrl}
              videoUrl={ad.videoUrl}
              onImage={(url) => update(ad.id, { imageUrl: url })}
              onVideo={(url) => update(ad.id, { videoUrl: url })}
            />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="category-pill">{ad.position}</span>
                <span className="text-xs text-muted-foreground">{ad.width}×{ad.height}</span>
              </div>
              <input value={ad.label} onChange={(e) => update(ad.id, { label: e.target.value })} placeholder="Ad label" className="w-full bg-secondary text-foreground px-3 py-2 rounded text-sm" />
              <input value={ad.linkUrl || ""} onChange={(e) => update(ad.id, { linkUrl: e.target.value })} placeholder="Click-through URL" className="w-full bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans" />
            </div>
          </div>
        </ContentCard>
      ))}
    </div>
  );
}

/* ---- Shared Components ---- */
function ContentCard({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <div className="bg-card border border-border rounded p-5 relative group">
      {children}
      {onRemove && (
        <button onClick={onRemove} className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="w-full border border-dashed border-border rounded p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors">
      <Plus className="w-4 h-4" /> {label}
    </button>
  );
}

function MediaUpload({ imageUrl, videoUrl, onImage, onVideo }: {
  imageUrl?: string; videoUrl?: string;
  onImage: (url: string) => void; onVideo: (url: string) => void;
}) {
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImage(await fileToDataUrl(file));
  };

  const handleVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onVideo(await fileToDataUrl(file));
  };

  return (
    <div className="space-y-2">
      <div className="aspect-video bg-secondary rounded overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <Image className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={() => imgRef.current?.click()} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] uppercase tracking-wider border border-border rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors">
          <Upload className="w-3 h-3" /> Photo
        </button>
        <button onClick={() => vidRef.current?.click()} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] uppercase tracking-wider border border-border rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors">
          <Video className="w-3 h-3" /> Video
        </button>
      </div>
      {videoUrl && <p className="text-[10px] text-primary truncate">Video attached ✓</p>}
      <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
      <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={handleVideo} />
    </div>
  );
}

/* ---- Analytics Dashboard ---- */
function AnalyticsDashboard({ articles, heroes, ads }: { articles: Article[]; heroes: HeroItem[]; ads: AdSlot[] }) {
  const [filter, setFilter] = useState<"all" | "article" | "hero" | "ad">("all");
  const totals = getTotalStats();
  const summary = getAnalyticsSummary(articles, heroes, ads);
  const recent = getRecentEvents(30);
  const locations = getLocationStats();

  const filtered = filter === "all" ? summary : summary.filter((s) => s.contentType === filter);
  const sorted = [...filtered].sort((a, b) => b.views - a.views);

  const handleClear = () => {
    clearAnalytics();
    toast.success("Analytics data cleared.");
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Eye className="w-5 h-5" />} label="Total Views" value={totals.totalViews} />
        <StatCard icon={<MousePointer className="w-5 h-5" />} label="Total Clicks" value={totals.totalClicks} />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Click-Through Rate"
          value={totals.totalViews > 0 ? `${((totals.totalClicks / totals.totalViews) * 100).toFixed(1)}%` : "—"}
        />
        <StatCard icon={<Globe className="w-5 h-5" />} label="Unique Locations" value={totals.uniqueLocations} />
      </div>

      {/* Filter + clear */}
      <div className="flex flex-wrap items-center gap-3">
        {(["all", "article", "hero", "ad"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs uppercase tracking-widest font-sans border rounded transition-colors ${
              filter === f
                ? "border-primary text-primary bg-primary/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All Content" : f === "ad" ? "Ads" : `${f}s`}
          </button>
        ))}
        <button
          onClick={handleClear}
          className="ml-auto px-4 py-2 text-xs uppercase tracking-widest font-sans border border-destructive/30 text-destructive rounded hover:bg-destructive/10 transition-colors"
        >
          Clear Data
        </button>
      </div>

      {/* Content table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-2 px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-sans border-b border-border">
          <span>Content</span>
          <span className="text-center">Type</span>
          <span className="text-center">Views</span>
          <span className="text-center">Clicks</span>
          <span className="text-center">CTR</span>
        </div>
        {sorted.length === 0 ? (
          <div className="px-5 py-8 text-center text-muted-foreground text-sm font-sans">No data yet. Views and clicks are tracked as visitors interact with content.</div>
        ) : (
          sorted.map((item) => {
            const ctr = item.views > 0 ? ((item.clicks / item.views) * 100).toFixed(1) : "0.0";
            return (
              <div
                key={`${item.contentType}:${item.contentId}`}
                className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-2 px-5 py-3 text-sm font-sans border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <span className="truncate text-foreground">{item.label || item.contentId}</span>
                <span className="text-center">
                  <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider rounded ${
                    item.contentType === "article" ? "bg-primary/10 text-primary" :
                    item.contentType === "hero" ? "bg-accent/10 text-accent" :
                    "bg-muted text-muted-foreground"
                  }`}>{item.contentType}</span>
                </span>
                <span className="text-center text-foreground font-medium">{item.views}</span>
                <span className="text-center text-foreground font-medium">{item.clicks}</span>
                <span className="text-center text-primary font-medium">{ctr}%</span>
              </div>
            );
          })
        )}
      </div>

      {/* Viewer Locations */}
      <div>
        <h3 className="font-serif text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" /> Viewer Locations
        </h3>
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_80px_80px] gap-2 px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground font-sans border-b border-border">
            <span>City</span>
            <span>Country</span>
            <span className="text-center">Views</span>
            <span className="text-center">Clicks</span>
          </div>
          {locations.length === 0 ? (
            <div className="px-5 py-6 text-center text-muted-foreground text-sm font-sans">
              No location data yet. Locations are captured automatically from viewer IP addresses.
            </div>
          ) : (
            locations.map((loc) => (
              <div
                key={`${loc.city}|${loc.country}`}
                className="grid grid-cols-[1fr_120px_80px_80px] gap-2 px-5 py-3 text-sm font-sans border-b border-border/50 hover:bg-secondary/30 transition-colors"
              >
                <span className="text-foreground flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-primary shrink-0" />
                  {loc.city}
                </span>
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="text-xs">{loc.countryCode}</span>
                  {loc.country}
                </span>
                <span className="text-center text-foreground font-medium">{loc.views}</span>
                <span className="text-center text-foreground font-medium">{loc.clicks}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent events log */}
      <div>
        <h3 className="font-serif text-lg font-semibold mb-3 text-foreground">Recent Events</h3>
        <div className="bg-card border border-border rounded max-h-72 overflow-y-auto">
          {recent.length === 0 ? (
            <div className="px-5 py-6 text-center text-muted-foreground text-sm font-sans">No events recorded yet.</div>
          ) : (
            recent.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5 text-xs font-sans border-b border-border/30">
                <span className={`w-2 h-2 rounded-full shrink-0 ${ev.eventType === "view" ? "bg-primary/50" : "bg-primary"}`} />
                <span className="text-muted-foreground w-36 shrink-0">
                  {new Date(ev.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-foreground">{ev.eventType}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground truncate">{ev.contentType} — {ev.contentId}</span>
                {ev.location && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-primary/70 shrink-0 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {ev.location.city}, {ev.location.countryCode}
                    </span>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded flex items-center justify-center bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-serif font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground font-sans uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}
