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
  publishEditorialContent,
  getPublishedContentSnapshot,
  DEFAULT_PUBLISHED_CONTENT,
  resetToDefaults,
  clearLocalDraftStorage,
  isStorageQuotaExceededError,
  CATEGORIES,
  formatEditionLabel,
} from "@/lib/content-store";
import type { HeroItem, Article, AdSlot, Category, ArticleBodyBlock } from "@/lib/content-store";
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
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAnalyticsSummary,
  getTotalStats,
  getRecentEvents,
  getLocationStats,
  clearAnalytics,
} from "@/lib/analytics";
import {
  getAdminPublishToken,
  isAdminAuthenticated,
  setAdminPublishToken,
  setAdminAuthenticated,
  resetAdminPasswordAccess,
} from "@/lib/admin-auth";
import { fileToOptimizedDataUrl } from "@/lib/media-optimizer";

const STORAGE_KEY = "magorium_page_content";

function getEditionsFromState(heroes: HeroItem[], articles: Article[]): string[] {
  const editions = new Set<string>();
  heroes.forEach((h) => editions.add(h.edition));
  articles.forEach((a) => editions.add(a.edition));
  return Array.from(editions).sort().reverse();
}

function createOctoberPatternBody(seed: string): ArticleBodyBlock[] {
  return [
    { id: `${seed}-t1`, type: "text", content: "Add first body paragraph" },
    { id: `${seed}-m1`, type: "image", content: "", imageAlign: "center", imageWidth: "full", caption: "Upload photo or video" },
    { id: `${seed}-t2`, type: "text", content: "Add second body paragraph" },
    { id: `${seed}-m2`, type: "image", content: "", imageAlign: "center", imageWidth: "full", caption: "Upload photo or video" },
    { id: `${seed}-t3`, type: "text", content: "Add third body paragraph" },
    { id: `${seed}-m3`, type: "image", content: "", imageAlign: "center", imageWidth: "full", caption: "Upload photo or video" },
  ];
}

function parseSeoTagsInput(value: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  value.split(",").map((token) => token.replace(/\s+/g, " ").trim()).filter(Boolean).forEach((token) => {
    const key = token.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    tags.push(token);
  });
  return tags.slice(0, 25);
}

type EditableContentPayload = { heroes: HeroItem[]; articles: Article[]; ads: AdSlot[] };

type PageContent = {
  editorsLetter: { quote: string; body1: string; body2: string; body3: string; signoff: string; logoUrl: string };
  about: { heading: string; body: string };
  masthead: { editorInChief: string; contributors: string; contact: string };
  contributors: { logoUrl: string; images: string[] };
  partnerships: { logoUrl: string; images: string[] };
};

const DEFAULT_PAGE_CONTENT: PageContent = {
  editorsLetter: {
    quote: "The world is full of extraordinary things quietly waiting for our wits to grow sharper.",
    body1: "Welcome to The Magorium — a private-view journal for those who believe luxury is not a price point but a perspective. Each month, we curate a single volume of the events, destinations, and cultural moments that define the season.",
    body2: "From the frozen polo fields of St. Moritz to the fashion ateliers of Paris, from the tech salons of Davos to the design studios of Cape Town. We seek the stories behind the spectacle. Our editorial lens is deliberate: fewer stories, told with greater depth.",
    body3: "This is not a news publication. It is a curated companion for the globally curious — those who travel with intention, collect with knowledge, and engage with culture as participants, not spectators.",
    signoff: "With warm regards,\nThe Editorial Desk",
    logoUrl: "",
  },
  about: { heading: "About The Magorium", body: "The Magorium is a private-view journal covering luxury, travel, culture, sport, and design. Where Curated Becomes Legend." },
  masthead: { editorInChief: "", contributors: "", contact: "" },
  contributors: { logoUrl: "", images: [] },
  partnerships: { logoUrl: "", images: [] },
};

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(() => isAdminAuthenticated());
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
      const payload = await response.json().catch(() => ({} as { success?: boolean; token?: string }));
      if (response.ok && payload.success) {
        setAuthenticated(true);
        setAdminAuthenticated(true);
        setAdminPublishToken(typeof payload.token === "string" ? payload.token : passwordInput.trim());
        setPasswordInput("");
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
    if (!window.confirm("Reset admin password access? This will sign out any current admin session.")) return;
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
            {passwordError && <p className="text-sm text-destructive">Incorrect password</p>}
            <button type="submit" disabled={isLoggingIn} className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-70">
              {isLoggingIn ? "Signing In..." : "Sign In"}
            </button>
            <button type="button" onClick={handleResetAccess} className="w-full h-10 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
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
  const [tab, setTab] = useState<"heroes" | "articles" | "ads" | "analytics" | "pages">("heroes");
  const [currentEdition, setCurrentEdition] = useState<string>("");
  const [showNewEdition, setShowNewEdition] = useState(false);
  const [newEditionMonth, setNewEditionMonth] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pageContent, setPageContent] = useState<PageContent>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_PAGE_CONTENT, ...JSON.parse(raw) };
    } catch {}
    return DEFAULT_PAGE_CONTENT;
  });

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      const snapshot = await getPublishedContentSnapshot({ allowLocalDraft: true });
      if (!active) return;
      setHeroes(snapshot.heroes);
      setArticles(snapshot.articles);
      setAds(snapshot.ads);
      const initialEditions = getEditionsFromState(snapshot.heroes, snapshot.articles);
      if (initialEditions.length > 0) setCurrentEdition(initialEditions[0]);
    };
    void initialize();
    return () => { active = false; };
  }, []);

  const editions = useMemo(() => getEditionsFromState(heroes, articles), [heroes, articles]);
  const filteredHeroes = currentEdition ? heroes.filter((h) => h.edition === currentEdition) : heroes;
  const filteredArticles = currentEdition ? articles.filter((a) => a.edition === currentEdition) : articles;

  const save = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const publishToken = getAdminPublishToken();
      if (!publishToken) { toast.error("Admin session expired. Please sign in again to publish live."); return; }
      clearLocalDraftStorage();
      const contentToPublish: EditableContentPayload = { heroes, articles, ads };
      const published = await publishEditorialContent(contentToPublish, publishToken);
      if (!published.success) {
        const fallbackMessage = published.error || "Could not publish content to live";
        let draftStored = true;
        try {
          saveHeroes(contentToPublish.heroes);
          saveArticles(contentToPublish.articles);
          saveAds(contentToPublish.ads);
        } catch (error) {
          if (!isStorageQuotaExceededError(error)) throw error;
          draftStored = false;
          clearLocalDraftStorage();
        }
        if (draftStored) { toast.warning(`${fallbackMessage}. Local draft was still saved in this browser.`); return; }
        toast.error(`${fallbackMessage}. Browser storage is full, so local draft backup could not be saved.`);
        return;
      }
      clearLocalDraftStorage();
      toast.success("Content published to live.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save content");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    resetToDefaults();
    setHeroes(getHeroes());
    setArticles(getArticles());
    setAds(getAds());
    toast.success("Reset to defaults.");
  };

  const handleRestoreBackup = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const restoredHeroes = DEFAULT_PUBLISHED_CONTENT.heroes.map((h) => ({ ...h, body: (h.body || []).map((b) => ({ ...b })), seoTags: [...(h.seoTags || [])] }));
      const restoredArticles = DEFAULT_PUBLISHED_CONTENT.articles.map((a) => ({ ...a, body: (a.body || []).map((b) => ({ ...b })), seoTags: [...(a.seoTags || [])] }));
      const restoredAds = DEFAULT_PUBLISHED_CONTENT.ads.map((a) => ({ ...a }));
      setHeroes(restoredHeroes);
      setArticles(restoredArticles);
      setAds(restoredAds);
      const restoredEditions = getEditionsFromState(restoredHeroes, restoredArticles);
      if (restoredEditions.length > 0) setCurrentEdition(restoredEditions[0]);
      const publishToken = getAdminPublishToken();
      if (!publishToken) { toast.error("Admin session expired. Please sign in again to publish live."); return; }
      const published = await publishEditorialContent({ heroes: restoredHeroes, articles: restoredArticles, ads: restoredAds }, publishToken);
      if (!published.success) { toast.warning(`${published.error || "Could not publish restored backup to live"}. Backup loaded but publish did not complete.`); return; }
      clearLocalDraftStorage();
      toast.success("Baseline backup restored and published.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not restore backup");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCurrentEdition = () => {
    if (!currentEdition) return;
    const label = formatEditionLabel(currentEdition);
    if (!window.confirm(`Delete the entire ${label} edition? This will remove all heroes and articles for that edition.\n\nClick "Save Changes" after deleting to make it permanent.`)) return;
    const nextHeroes = heroes.filter((h) => h.edition !== currentEdition);
    const nextArticles = articles.filter((a) => a.edition !== currentEdition);
    setHeroes(nextHeroes);
    setArticles(nextArticles);
    setCurrentEdition(getEditionsFromState(nextHeroes, nextArticles)[0] ?? "");
    toast.success(`Deleted edition: ${label}.`);
  };

  const createNewEdition = () => {
    if (!newEditionMonth) { toast.error("Please select a month for the new edition"); return; }
    const stamp = Date.now();
    const today = new Date().toISOString().split("T")[0];
    const starterHeroes: HeroItem[] = [
      { id: `h-${stamp}-1`, title: "New Hero 1", subtitle: "Add your first hero story", seoTags: [], category: "Travel", imageUrl: "", author: "Editor", body: createOctoberPatternBody(`h-${stamp}-1`), date: today, edition: newEditionMonth },
      { id: `h-${stamp}-2`, title: "New Hero 2", subtitle: "Add your second hero story", seoTags: [], category: "Fashion", imageUrl: "", author: "Editor", body: createOctoberPatternBody(`h-${stamp}-2`), date: today, edition: newEditionMonth },
      { id: `h-${stamp}-3`, title: "New Hero 3", subtitle: "Add your third hero story", seoTags: [], category: "Art & Design", imageUrl: "", author: "Editor", body: createOctoberPatternBody(`h-${stamp}-3`), date: today, edition: newEditionMonth },
    ];
    const starterArticles: Article[] = [
      { id: `a-${stamp}-1`, title: "New Article 1", excerpt: "Add your first article", seoTags: [], category: "Yachting", imageUrl: "", author: "Editor", body: createOctoberPatternBody(`a-${stamp}-1`), date: today, edition: newEditionMonth },
      { id: `a-${stamp}-2`, title: "New Article 2", excerpt: "Add your second article", seoTags: [], category: "Sports", imageUrl: "", author: "Editor", body: createOctoberPatternBody(`a-${stamp}-2`), date: today, edition: newEditionMonth },
      { id: `a-${stamp}-3`, title: "New Article 3", excerpt: "Add your third article", seoTags: [], category: "Golf", imageUrl: "", author: "Editor", body: createOctoberPatternBody(`a-${stamp}-3`), date: today, edition: newEditionMonth },
      { id: `a-${stamp}-4`, title: "New Article 4", excerpt: "Add your fourth article", seoTags: [], category: "Tennis", imageUrl: "", author: "Editor", body: createOctoberPatternBody(`a-${stamp}-4`), date: today, edition: newEditionMonth },
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
            <button onClick={handleRestoreBackup} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 text-sm border border-primary rounded text-primary hover:bg-primary/10 transition-colors disabled:opacity-70">
              <RotateCcw className="w-4 h-4" /> Restore Backup
            </button>
            <button onClick={save} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-70">
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {tab !== "pages" && (
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-sm font-sans uppercase tracking-wider text-muted-foreground">Current Edition:</span>
                <select value={currentEdition} onChange={(e) => setCurrentEdition(e.target.value)} className="bg-secondary text-foreground px-4 py-2 rounded font-serif text-lg border-0">
                  {editions.map((ed) => <option key={ed} value={ed}>{formatEditionLabel(ed)}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={deleteCurrentEdition} disabled={!currentEdition} className="flex items-center gap-2 px-4 py-2 text-sm border border-destructive text-destructive rounded hover:bg-destructive/10 transition-colors disabled:pointer-events-none disabled:opacity-50">
                  <Trash2 className="w-4 h-4" /> Delete Edition
                </button>
                {showNewEdition ? (
                  <div className="flex items-center gap-2">
                    <input type="month" value={newEditionMonth} onChange={(e) => setNewEditionMonth(e.target.value)} className="bg-secondary text-foreground px-3 py-2 rounded text-sm" />
                    <button onClick={createNewEdition} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded">Create</button>
                    <button onClick={() => setShowNewEdition(false)} className="px-3 py-2 text-sm text-muted-foreground">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setShowNewEdition(true)} className="flex items-center gap-2 px-4 py-2 text-sm border border-primary text-primary rounded hover:bg-primary/10 transition-colors">
                    <Plus className="w-4 h-4" /> New Edition
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground font-sans">
              {filteredHeroes.length} heroes · {filteredArticles.length} articles in this edition
            </div>
          </div>
        )}

        <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
          {(["heroes", "articles", "ads", "analytics", "pages"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-sans uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "analytics" && <BarChart3 className="w-4 h-4" />}
              {t === "pages" && <FileText className="w-4 h-4" />}
              {t === "ads" ? "Advertising" : t === "analytics" ? "Analytics" : t === "pages" ? "Pages" : t}
            </button>
          ))}
        </div>

        {tab === "heroes" && <HeroesManager heroes={heroes} setHeroes={setHeroes} filteredHeroes={filteredHeroes} currentEdition={currentEdition} />}
        {tab === "articles" && <ArticlesManager articles={articles} setArticles={setArticles} filteredArticles={filteredArticles} currentEdition={currentEdition} />}
        {tab === "ads" && <AdsManager ads={ads} setAds={setAds} />}
        {tab === "analytics" && <AnalyticsDashboard articles={articles} heroes={heroes} ads={ads} />}
        {tab === "pages" && <PagesManager pageContent={pageContent} setPageContent={setPageContent} />}
      </div>
    </div>
  );
}

/* ---- Heroes Manager ---- */
function HeroesManager({ heroes, setHeroes, filteredHeroes, currentEdition }: { heroes: HeroItem[]; setHeroes: (h: HeroItem[]) => void; filteredHeroes: HeroItem[]; currentEdition: string }) {
  const addHero = () => setHeroes([{ id: `h-${Date.now()}`, title: "New Hero", subtitle: "", seoTags: [], category: "Travel", imageUrl: "", author: "", body: [], date: new Date().toISOString().split("T")[0], edition: currentEdition || new Date().toISOString().slice(0, 7) }, ...heroes]);
  const update = (id: string, patch: Partial<HeroItem>) => setHeroes(heroes.map((h) => (h.id === id ? { ...h, ...patch } : h)));
  const remove = (id: string) => setHeroes(heroes.filter((h) => h.id !== id));
  return (
    <div className="space-y-6">
      <AddButton onClick={addHero} label={`Add Hero to ${currentEdition ? formatEditionLabel(currentEdition) : "Edition"}`} />
      {filteredHeroes.map((hero) => (
        <ContentCard key={hero.id} onRemove={() => remove(hero.id)}>
          <EditableStoryForm
            kind="hero"
            title={hero.title}
            summary={hero.subtitle}
            category={hero.category}
            author={hero.author || ""}
            seoTags={hero.seoTags || []}
            date={hero.date}
            featured={hero.featured}
            imageUrl={hero.imageUrl}
            videoUrl={hero.videoUrl}
            secondaryImageUrl={hero.secondaryImageUrl || ""}
            secondaryImageCaption={hero.secondaryImageCaption || ""}
            secondaryImageCitation={hero.secondaryImageCitation || ""}
            body={hero.body || []}
            onTitleChange={(v) => update(hero.id, { title: v })}
            onSummaryChange={(v) => update(hero.id, { subtitle: v })}
            onCategoryChange={(v) => update(hero.id, { category: v })}
            onAuthorChange={(v) => update(hero.id, { author: v })}
            onSeoTagsChange={(v) => update(hero.id, { seoTags: v })}
            onDateChange={(v) => update(hero.id, { date: v })}
            onFeaturedChange={(v) => update(hero.id, { featured: v })}
            onImageChange={(v) => update(hero.id, { imageUrl: v })}
            onVideoChange={(v) => update(hero.id, { videoUrl: v })}
            onSecondaryImageChange={(v) => update(hero.id, { secondaryImageUrl: v })}
            onSecondaryImageCaptionChange={(v) => update(hero.id, { secondaryImageCaption: v })}
            onSecondaryImageCitationChange={(v) => update(hero.id, { secondaryImageCitation: v })}
            onBodyChange={(v) => update(hero.id, { body: v })}
            onNormalizeBody={() => update(hero.id, { body: normalizeBodyFlow(hero.body || [], hero.imageUrl, hero.videoUrl) })}
            sources={hero.sources || ""}
            onSourcesChange={(v) => update(hero.id, { sources: v })}
          />
        </ContentCard>
      ))}
    </div>
  );
}

/* ---- Articles Manager ---- */
function ArticlesManager({ articles, setArticles, filteredArticles, currentEdition }: { articles: Article[]; setArticles: (a: Article[]) => void; filteredArticles: Article[]; currentEdition: string }) {
  const addArticle = () => setArticles([{ id: `a-${Date.now()}`, title: "New Article", excerpt: "", seoTags: [], category: "Travel", imageUrl: "", author: "", date: new Date().toISOString().split("T")[0], edition: currentEdition || new Date().toISOString().slice(0, 7) }, ...articles]);
  const update = (id: string, patch: Partial<Article>) => setArticles(articles.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const remove = (id: string) => setArticles(articles.filter((a) => a.id !== id));
  return (
    <div className="space-y-6">
      <AddButton onClick={addArticle} label={`Add Article to ${currentEdition ? formatEditionLabel(currentEdition) : "Edition"}`} />
      {filteredArticles.map((article) => (
        <ContentCard key={article.id} onRemove={() => remove(article.id)}>
          <EditableStoryForm
            kind="article"
            title={article.title}
            summary={article.excerpt}
            category={article.category}
            author={article.author}
            seoTags={article.seoTags || []}
            date={article.date}
            featured={article.featured}
            imageUrl={article.imageUrl}
            videoUrl={article.videoUrl}
            secondaryImageUrl={article.secondaryImageUrl || ""}
            secondaryImageCaption={article.secondaryImageCaption || ""}
            secondaryImageCitation={article.secondaryImageCitation || ""}
            body={article.body || []}
            onTitleChange={(v) => update(article.id, { title: v })}
            onSummaryChange={(v) => update(article.id, { excerpt: v })}
            onCategoryChange={(v) => update(article.id, { category: v })}
            onAuthorChange={(v) => update(article.id, { author: v })}
            onSeoTagsChange={(v) => update(article.id, { seoTags: v })}
            onDateChange={(v) => update(article.id, { date: v })}
            onFeaturedChange={(v) => update(article.id, { featured: v })}
            onImageChange={(v) => update(article.id, { imageUrl: v })}
            onVideoChange={(v) => update(article.id, { videoUrl: v })}
            onSecondaryImageChange={(v) => update(article.id, { secondaryImageUrl: v })}
            onSecondaryImageCaptionChange={(v) => update(article.id, { secondaryImageCaption: v })}
            onSecondaryImageCitationChange={(v) => update(article.id, { secondaryImageCitation: v })}
            onBodyChange={(v) => update(article.id, { body: v })}
            onNormalizeBody={() => update(article.id, { body: normalizeBodyFlow(article.body || [], article.imageUrl, article.videoUrl) })}
            sources={article.sources || ""}
            onSourcesChange={(v) => update(article.id, { sources: v })}
          />
        </ContentCard>
      ))}
    </div>
  );
}

/* ---- Editable Story Form ---- */
function EditableStoryForm({
  kind, title, summary, category, author, seoTags, date, featured,
  imageUrl, videoUrl,
  secondaryImageUrl, secondaryImageCaption, secondaryImageCitation,
  body,
  onTitleChange, onSummaryChange, onCategoryChange, onAuthorChange,
  onSeoTagsChange, onDateChange, onFeaturedChange,
  onImageChange, onVideoChange,
  onSecondaryImageChange, onSecondaryImageCaptionChange, onSecondaryImageCitationChange,
  onBodyChange, onNormalizeBody,
  sources, onSourcesChange,
}: {
  kind: "hero" | "article";
  title: string; summary: string; category: Category; author: string;
  seoTags: string[]; date: string; featured?: boolean;
  imageUrl?: string; videoUrl?: string;
  secondaryImageUrl?: string; secondaryImageCaption?: string; secondaryImageCitation?: string;
  body: ArticleBodyBlock[];
  onTitleChange: (v: string) => void; onSummaryChange: (v: string) => void;
  onCategoryChange: (v: Category) => void; onAuthorChange: (v: string) => void;
  onSeoTagsChange: (v: string[]) => void; onDateChange: (v: string) => void;
  onFeaturedChange: (v: boolean) => void;
  onImageChange: (v: string) => void; onVideoChange: (v: string) => void;
  onSecondaryImageChange: (v: string) => void;
  onSecondaryImageCaptionChange: (v: string) => void;
  onSecondaryImageCitationChange: (v: string) => void;
  onBodyChange: (v: ArticleBodyBlock[]) => void; onNormalizeBody: () => void;
  sources?: string; onSourcesChange?: (v: string) => void;
}) {
  const isArticle = kind === "article";
  const [seoTagDraft, setSeoTagDraft] = useState("");
  const secondaryImgRef = useRef<HTMLInputElement>(null);

  const addSeoTagsFromDraft = () => {
    const draftTags = parseSeoTagsInput(seoTagDraft);
    if (draftTags.length === 0) { setSeoTagDraft(""); return; }
    const existing = new Set(seoTags.map((t) => t.toLowerCase()));
    const merged = [...seoTags];
    draftTags.forEach((tag) => {
      const key = tag.toLowerCase();
      if (existing.has(key) || merged.length >= 25) return;
      existing.add(key); merged.push(tag);
    });
    onSeoTagsChange(merged);
    setSeoTagDraft("");
  };

  const handleSecondaryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSecondaryImageChange(await fileToOptimizedDataUrl(file));
    e.target.value = "";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
      <MediaUpload imageUrl={imageUrl} videoUrl={videoUrl} onImage={onImageChange} onVideo={onVideoChange} />
      <div className="space-y-3">
        <input value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder={isArticle ? "Article title" : "Hero title"} className="w-full bg-secondary text-foreground px-3 py-2 rounded font-serif text-lg" />
        <textarea value={summary} onChange={(e) => onSummaryChange(e.target.value)} placeholder={isArticle ? "Excerpt" : "Subtitle / deck"} rows={2} className="w-full bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans resize-none" />
        <div className="flex flex-wrap gap-3">
          <select value={category} onChange={(e) => onCategoryChange(e.target.value as Category)} className="bg-secondary text-foreground px-3 py-2 rounded text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={author} onChange={(e) => onAuthorChange(e.target.value)} placeholder="Writer / Journalist Name" className="bg-secondary text-foreground px-3 py-2 rounded text-sm" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans">Published</span>
            <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} className="bg-secondary text-foreground px-3 py-2 rounded text-sm" />
            <button type="button" onClick={() => onDateChange(new Date().toISOString().split("T")[0])} className="px-2 py-1 text-[10px] uppercase tracking-wider border border-border rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors">Today</button>
          </div>
          {isArticle && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={featured || false} onChange={(e) => onFeaturedChange(e.target.checked)} className="accent-primary" /> Featured
            </label>
          )}
        </div>

        {/* ── SECONDARY IMAGE UPLOAD ── */}
        {/* This photo appears on the article page between the headline and the first paragraph */}
        <div className="mt-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-primary font-sans">Article Opening Photo</h4>
              <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
                Appears below the headline, above the first paragraph. Leave empty to skip.
              </p>
            </div>
            {secondaryImageUrl && (
              <button
                type="button"
                onClick={() => { onSecondaryImageChange(""); onSecondaryImageCaptionChange(""); onSecondaryImageCitationChange(""); }}
                className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider border border-destructive/40 text-destructive rounded hover:bg-destructive/10 transition-colors shrink-0"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            )}
          </div>

          {secondaryImageUrl ? (
            <img src={secondaryImageUrl} alt="Opening photo preview" className="w-full max-h-48 object-cover rounded border border-border" />
          ) : (
            <div className="w-full h-24 rounded border-2 border-dashed border-border bg-secondary flex items-center justify-center text-xs text-muted-foreground font-sans">
              No opening photo uploaded
            </div>
          )}

          <button
            type="button"
            onClick={() => secondaryImgRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-primary text-primary rounded hover:bg-primary/10 transition-colors"
          >
            <Upload className="w-4 h-4" /> Upload Opening Photo
          </button>
          <input ref={secondaryImgRef} type="file" accept="image/*" className="hidden" onChange={handleSecondaryImageUpload} />

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={secondaryImageCaption || ""}
              onChange={(e) => onSecondaryImageCaptionChange(e.target.value)}
              placeholder="Caption (optional)"
              className="flex-1 bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans"
            />
            <input
              value={secondaryImageCitation || ""}
              onChange={(e) => onSecondaryImageCitationChange(e.target.value)}
              placeholder="Photo credit (optional)"
              className="flex-1 bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans"
            />
          </div>
        </div>

        <section className="rounded-lg border-2 border-primary/35 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-primary font-sans">Dedicated SEO Tag Box</h4>
              <p className="text-[11px] text-muted-foreground font-sans mt-1">Add and manage search keywords for this story.</p>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans bg-background px-2 py-1 rounded border border-border">{seoTags.length}/25</span>
          </div>
          <div className="rounded-md border border-border bg-background/80 p-3 min-h-[44px]">
            <div className="flex flex-wrap gap-2">
              {seoTags.length > 0 ? seoTags.map((tag) => (
                <button key={tag} type="button" onClick={() => onSeoTagsChange(seoTags.filter((t) => t.toLowerCase() !== tag.toLowerCase()))} className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs font-sans hover:bg-primary/15">
                  #{tag}<span className="text-[10px]">x</span>
                </button>
              )) : <p className="text-xs text-muted-foreground font-sans">No SEO tags added yet.</p>}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={seoTagDraft} onChange={(e) => setSeoTagDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSeoTagsFromDraft(); } }} placeholder="Add tag(s), comma-separated" className="flex-1 bg-secondary text-foreground px-3 py-2 rounded text-sm" />
            <button type="button" onClick={addSeoTagsFromDraft} className="px-3 py-2 text-xs uppercase tracking-wider border border-primary text-primary rounded hover:bg-primary/10 transition-colors">Add Tag</button>
          </div>
          <p className="text-[10px] text-muted-foreground font-sans">Tip: click any bubble to remove it.</p>
        </section>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans">Preferred flow: photo/video → text → photo/video → text</p>
            <button type="button" onClick={onNormalizeBody} className="px-2 py-1 text-[10px] uppercase tracking-wider border border-border rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors">Auto Arrange</button>
          </div>
          <ArticleBodyEditor blocks={body} heading={isArticle ? "Article Body" : "Hero Body"} onChange={onBodyChange} />
        </div>

        {onSourcesChange && (
          <div className="mt-4 pt-4 border-t border-border">
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-sans mb-2">Sources & Verification</label>
            <textarea value={sources || ""} onChange={(e) => onSourcesChange(e.target.value)} placeholder="List your sources here, e.g. The Guardian (May 2026), Reuters (Apr 15)…" rows={3} className="w-full bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans resize-none" />
            <p className="text-[10px] text-muted-foreground font-sans mt-1">Appears as footnote at the bottom of the live article. Hidden if empty.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Ads Manager ---- */
function AdsManager({ ads, setAds }: { ads: AdSlot[]; setAds: (a: AdSlot[]) => void }) {
  const addAd = () => setAds([...ads, { id: `ad-${Date.now()}`, label: "New Ad Slot", position: "mid-feed", width: 728, height: 90 }]);
  const update = (id: string, patch: Partial<AdSlot>) => setAds(ads.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const remove = (id: string) => setAds(ads.filter((a) => a.id !== id));
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground font-sans">Upload images or videos for each ad placement.</p>
        <button onClick={addAd} className="px-4 py-2 text-sm border border-primary text-primary rounded hover:bg-primary/10 transition-colors flex items-center gap-2"><Plus className="w-4 h-4" /> Add Slot</button>
      </div>
      {ads.map((ad) => (
        <ContentCard key={ad.id} onRemove={() => remove(ad.id)}>
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
            <MediaUpload imageUrl={ad.imageUrl} videoUrl={ad.videoUrl} onImage={(url) => update(ad.id, { imageUrl: url })} onVideo={(url) => update(ad.id, { videoUrl: url })} />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <select value={ad.position} onChange={(e) => update(ad.id, { position: e.target.value as AdSlot["position"] })} className="category-pill bg-secondary text-foreground border-none">
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

/* ---- Pages Manager ---- */
function PagesManager({ pageContent, setPageContent }: { pageContent: PageContent; setPageContent: (c: PageContent) => void }) {
  const [activePage, setActivePage] = useState<"editorsLetter" | "contributors" | "partnerships" | "masthead">("editorsLetter");
  const logoRef = useRef<HTMLInputElement>(null);
  const contribLogoRef = useRef<HTMLInputElement>(null);
  const partnerLogoRef = useRef<HTMLInputElement>(null);
  const contribImgRef = useRef<HTMLInputElement>(null);
  const partnerImgRef = useRef<HTMLInputElement>(null);

  const persist = (updated: PageContent) => {
    setPageContent(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
    toast.success("Page saved.");
  };

  const updateEL = (patch: Partial<PageContent["editorsLetter"]>) => persist({ ...pageContent, editorsLetter: { ...pageContent.editorsLetter, ...patch } });
  const updateMasthead = (patch: Partial<PageContent["masthead"]>) => persist({ ...pageContent, masthead: { ...pageContent.masthead, ...patch } });
  const updateContribs = (patch: Partial<PageContent["contributors"]>) => persist({ ...pageContent, contributors: { ...pageContent.contributors, ...patch } });
  const updatePartners = (patch: Partial<PageContent["partnerships"]>) => persist({ ...pageContent, partnerships: { ...pageContent.partnerships, ...patch } });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, onUrl: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) onUrl(await fileToOptimizedDataUrl(file));
    e.target.value = "";
  };

  const addImage = async (e: React.ChangeEvent<HTMLInputElement>, current: string[], onUpdate: (imgs: string[]) => void) => {
    const file = e.target.files?.[0];
    if (file) onUpdate(
