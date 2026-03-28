import { useState, useEffect, useRef, useMemo } from "react";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import ArticleBodyEditor from "@/components/editorial/ArticleBodyEditor";
import {
  getHeroes,
  getArticles,
  getAds,
  saveHeroes,
  saveArticles,
  saveAds,
  resetToDefaults,
  CATEGORIES,
  formatEditionLabel,
} from "@/lib/content-store";
import type { HeroItem, Article, AdSlot, Category } from "@/lib/content-store";
import {
  Trash2,
  Plus,
  Upload,
  RotateCcw,
  Image,
  Video,
  BarChart3,
  Eye,
  MousePointer,
  TrendingUp,
  MapPin,
  Globe,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAnalyticsSummary,
  getTotalStats,
  getRecentEvents,
  getLocationStats,
  clearAnalytics,
  type ContentStats,
} from "@/lib/analytics";
import {
  isAdminAuthenticated,
  setAdminAuthenticated,
  resetAdminPasswordAccess,
} from "@/lib/admin-auth";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function getEditionsFromState(heroes: HeroItem[], articles: Article[]): string[] {
  const editions = new Set<string>();
  heroes.forEach((h) => editions.add(h.edition));
  articles.forEach((a) => editions.add(a.edition));
  return Array.from(editions).sort().reverse();
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(() => {
    return isAdminAuthenticated();
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const resetToken = url.searchParams.get("resetToken");
    if (!resetToken) return;

    resetAdminPasswordAccess();
    setAuthenticated(false);
    setPasswordInput("");
    setPasswordError(false);

    url.searchParams.delete("resetToken");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    toast.success("Reset link used.");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const payload = await response.json().catch(() => ({} as { success?: boolean }));
      if (response.ok && payload.success) {
        setAuthenticated(true);
        setAdminAuthenticated(true);
        setPasswordError(false);
        return;
      }
      setPasswordError(true);
    } catch {
      setPasswordError(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleResetAccess = () => {
    const confirmReset = window.confirm(
      "Reset admin password access? This will sign out any current admin session.",
    );
    if (!confirmReset) return;

    resetAdminPasswordAccess();
    setAuthenticated(false);
    setPasswordInput("");
    setPasswordError(false);
    toast.success("Admin password access reset.");
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <form onSubmit={handleLogin} className="w-full max-w-sm mx-auto p-8 space-y-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight masthead-font">
            <span className="text-foreground">THE </span>
            <span className="text-primary">MAGORIUM</span>
          </h1>
          <p className="text-sm text-muted-foreground uppercase tracking-widest">Content Manager</p>
          <div className="space-y-3">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
              placeholder="Enter password"
              className="w-full h-10 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            {passwordError && (
              <p className="text-sm text-destructive">Incorrect password</p>
            )}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-70"
            >
              {isLoggingIn ? "Signing In..." : "Sign In"}
            </button>
            <button
              type="button"
              onClick={handleResetAccess}
              className="w-full h-10 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset Admin Password Access
            </button>
          </div>
        </form>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [heroes, setHeroes] = useState<HeroItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [ads, setAds] = useState<AdSlot[]>([]);
  const [tab, setTab] = useState<"heroes" | "articles" | "ads" | "analytics">("heroes");
  const [currentEdition, setCurrentEdition] = useState<string>("");
  const [showNewEdition, setShowNewEdition] = useState(false);
  const [newEditionMonth, setNewEditionMonth] = useState("");

  useEffect(() => {
    const initialHeroes = getHeroes();
    const initialArticles = getArticles();
    const initialAds = getAds();

    setHeroes(initialHeroes);
    setArticles(initialArticles);
    setAds(initialAds);

    const initialEditions = getEditionsFromState(initialHeroes, initialArticles);
    if (initialEditions.length > 0) setCurrentEdition(initialEditions[0]);
  }, []);

  const editions = useMemo(() => getEditionsFromState(heroes, articles), [heroes, articles]);
  const filteredHeroes = currentEdition ? heroes.filter((h) => h.edition === currentEdition) : heroes;
  const filteredArticles = currentEdition ? articles.filter((a) => a.edition === currentEdition) : articles;

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

  const deleteCurrentEdition = () => {
    if (!currentEdition) return;

    const label = formatEditionLabel(currentEdition);
    const ok = window.confirm(
      `Delete the entire ${label} edition? This will remove all heroes and articles for that edition.\n\nClick “Save Changes” after deleting to make it permanent.`,
    );
    if (!ok) return;

    const nextHeroes = heroes.filter((h) => h.edition !== currentEdition);
    const nextArticles = articles.filter((a) => a.edition !== currentEdition);

    setHeroes(nextHeroes);
    setArticles(nextArticles);

    const remainingEditions = getEditionsFromState(nextHeroes, nextArticles);
    setCurrentEdition(remainingEditions[0] ?? "");

    toast.success(`Deleted edition: ${label}.`);
  };

  const createNewEdition = () => {
    if (!newEditionMonth) {
      toast.error("Please select a month for the new edition");
      return;
    }

    // Create starter template content for new edition
    const starterHeroes: HeroItem[] = [
      {
        id: `h-${Date.now()}-1`,
        title: "New Hero 1",
        subtitle: "Add your first hero story",
        category: "Travel",
        imageUrl: "",
        author: "Editor",
        date: new Date().toISOString().split("T")[0],
        edition: newEditionMonth,
        body: [{ id: `hb-${Date.now()}-1`, type: "text", content: "" }],
      },
      {
        id: `h-${Date.now()}-2`,
        title: "New Hero 2",
        subtitle: "Add your second hero story",
        category: "Fashion",
        imageUrl: "",
        author: "Editor",
        date: new Date().toISOString().split("T")[0],
        edition: newEditionMonth,
        body: [{ id: `hb-${Date.now()}-2`, type: "text", content: "" }],
      },
      {
        id: `h-${Date.now()}-3`,
        title: "New Hero 3",
        subtitle: "Add your third hero story",
        category: "Art & Design",
        imageUrl: "",
        author: "Editor",
        date: new Date().toISOString().split("T")[0],
        edition: newEditionMonth,
        body: [{ id: `hb-${Date.now()}-3`, type: "text", content: "" }],
      },
    ];

    const starterArticles: Article[] = [
      { id: `a-${Date.now()}-1`, title: "New Article 1", excerpt: "Add your first article", category: "Yachting", imageUrl: "", author: "Editor", date: new Date().toISOString().split("T")[0], edition: newEditionMonth },
      { id: `a-${Date.now()}-2`, title: "New Article 2", excerpt: "Add your second article", category: "Sports", imageUrl: "", author: "Editor", date: new Date().toISOString().split("T")[0], edition: newEditionMonth },
      { id: `a-${Date.now()}-3`, title: "New Article 3", excerpt: "Add your third article", category: "Golf", imageUrl: "", author: "Editor", date: new Date().toISOString().split("T")[0], edition: newEditionMonth },
      { id: `a-${Date.now()}-4`, title: "New Article 4", excerpt: "Add your fourth article", category: "Tennis", imageUrl: "", author: "Editor", date: new Date().toISOString().split("T")[0], edition: newEditionMonth },
    ];

    setHeroes([...heroes, ...starterHeroes]);
    setArticles([...articles, ...starterArticles]);
    setCurrentEdition(newEditionMonth);
    setShowNewEdition(false);
    setNewEditionMonth("");
    toast.success(`Created new edition: ${formatEditionLabel(newEditionMonth)} with starter content!`);
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

        {/* Edition Selector */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-sm font-sans uppercase tracking-wider text-muted-foreground">Current Edition:</span>
              <select
                value={currentEdition}
                onChange={(e) => setCurrentEdition(e.target.value)}
                className="bg-secondary text-foreground px-4 py-2 rounded font-serif text-lg border-0"
              >
                {editions.map((ed) => (
                  <option key={ed} value={ed}>{formatEditionLabel(ed)}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={deleteCurrentEdition}
                disabled={!currentEdition}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-destructive text-destructive rounded hover:bg-destructive/10 transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Delete Edition
              </button>

              {showNewEdition ? (
                <div className="flex items-center gap-2">
                  <input
                    type="month"
                    value={newEditionMonth}
                    onChange={(e) => setNewEditionMonth(e.target.value)}
                    className="bg-secondary text-foreground px-3 py-2 rounded text-sm"
                  />
                  <button onClick={createNewEdition} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded">
                    Create
                  </button>
                  <button onClick={() => setShowNewEdition(false)} className="px-3 py-2 text-sm text-muted-foreground">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewEdition(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
                >
                  <Plus className="w-4 h-4" /> New Edition
                </button>
              )}
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground font-sans">
            {filteredHeroes.length} heroes · {filteredArticles.length} articles in this edition
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
          <HeroesManager heroes={heroes} setHeroes={setHeroes} filteredHeroes={filteredHeroes} currentEdition={currentEdition} />
        )}
        {tab === "articles" && (
          <ArticlesManager articles={articles} setArticles={setArticles} filteredArticles={filteredArticles} currentEdition={currentEdition} />
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
function HeroesManager({ heroes, setHeroes, filteredHeroes, currentEdition }: { heroes: HeroItem[]; setHeroes: (h: HeroItem[]) => void; filteredHeroes: HeroItem[]; currentEdition: string }) {
  const addHero = () => {
    setHeroes([
      {
        id: `h-${Date.now()}`,
        title: "New Hero",
        subtitle: "",
        category: "Travel",
        imageUrl: "",
        author: "",
        body: [],
        date: new Date().toISOString().split("T")[0],
        edition: currentEdition || new Date().toISOString().slice(0, 7),
      },
      ...heroes,
    ]);
  };

  const update = (id: string, patch: Partial<HeroItem>) => {
    setHeroes(heroes.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  };

  const remove = (id: string) => setHeroes(heroes.filter((h) => h.id !== id));

  return (
    <div className="space-y-6">
      <AddButton onClick={addHero} label={`Add Hero to ${currentEdition ? formatEditionLabel(currentEdition) : 'Edition'}`} />
      {filteredHeroes.map((hero) => (
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
              <div className="flex flex-wrap gap-3">
                <select value={hero.category} onChange={(e) => update(hero.id, { category: e.target.value as Category })} className="bg-secondary text-foreground px-3 py-2 rounded text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input value={hero.author || ""} onChange={(e) => update(hero.id, { author: e.target.value })} placeholder="Writer / Journalist / Staff" className="bg-secondary text-foreground px-3 py-2 rounded text-sm" />
                <input type="date" value={hero.date} onChange={(e) => update(hero.id, { date: e.target.value })} className="bg-secondary text-foreground px-3 py-2 rounded text-sm" />
              </div>
              {/* Hero body editor */}
              <div className="mt-4 pt-4 border-t border-border">
                <ArticleBodyEditor
                  blocks={hero.body || []}
                  onChange={(blocks) => update(hero.id, { body: blocks })}
                  label="Hero Body"
                />
              </div>
            </div>
          </div>
        </ContentCard>
      ))}
    </div>
  );
}

/* ---- Articles Manager ---- */
function ArticlesManager({ articles, setArticles, filteredArticles, currentEdition }: { articles: Article[]; setArticles: (a: Article[]) => void; filteredArticles: Article[]; currentEdition: string }) {
  const addArticle = () => {
    setArticles([
      { id: `a-${Date.now()}`, title: "New Article", excerpt: "", category: "Travel", imageUrl: "", author: "", date: new Date().toISOString().split("T")[0], edition: currentEdition || new Date().toISOString().slice(0, 7) },
      ...articles,
    ]);
  };

  const update = (id: string, patch: Partial<Article>) => {
    setArticles(articles.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const remove = (id: string) => setArticles(articles.filter((a) => a.id !== id));

  return (
    <div className="space-y-6">
      <AddButton onClick={addArticle} label={`Add Article to ${currentEdition ? formatEditionLabel(currentEdition) : 'Edition'}`} />
      {filteredArticles.map((article) => (
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
    </div>
  );
}

/* ---- Ads Manager ---- */
function AdsManager({ ads, setAds }: { ads: AdSlot[]; setAds: (a: AdSlot[]) => void }) {
  const addAd = () => {
    setAds([
      ...ads,
      { id: `ad-${Date.now()}`, label: "New Ad Slot", position: "mid-feed", width: 728, height: 90 },
    ]);
  };

  const update = (id: string, patch: Partial<AdSlot>) => {
    setAds(ads.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const remove = (id: string) => setAds(ads.filter((a) => a.id !== id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground font-sans">Upload images or videos for each ad placement. These slots appear throughout the editorial layout.</p>
        <button onClick={addAd} className="px-4 py-2 text-sm border border-primary text-primary rounded hover:bg-primary/10 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Slot
        </button>
      </div>
      {ads.map((ad) => (
        <ContentCard key={ad.id} onRemove={() => remove(ad.id)}>
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
            <MediaUpload
              imageUrl={ad.imageUrl}
              videoUrl={ad.videoUrl}
              onImage={(url) => update(ad.id, { imageUrl: url })}
              onVideo={(url) => update(ad.id, { videoUrl: url })}
            />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <select 
                  value={ad.position} 
                  onChange={(e) => update(ad.id, { position: e.target.value as any })} 
                  className="category-pill bg-secondary text-foreground border-none"
                >
                  <option value="hero-sidebar">Hero Sidebar</option>
                  <option value="mid-feed">Mid Feed</option>
                  <option value="bottom-banner">Bottom Banner</option>
                  <option value="sidebar">Sidebar</option>
                </select>
                <span className="text-xs text-muted-foreground">
                  W: <input type="number" value={ad.width} onChange={(e) => update(ad.id, { width: parseInt(e.target.value) || 0 })} className="w-16 bg-secondary text-foreground px-1 py-0.5 rounded" />
                  × H: <input type="number" value={ad.height} onChange={(e) => update(ad.id, { height: parseInt(e.target.value) || 0 })} className="w-16 bg-secondary text-foreground px-1 py-0.5 rounded" />
                </span>
              </div>
              <input value={ad.label} onChange={(e) => update(ad.id, { label: e.target.value })} placeholder="Ad label (internal use)" className="w-full bg-secondary text-foreground px-3 py-2 rounded text-sm" />
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
