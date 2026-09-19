import { useState, useEffect, useRef, useMemo } from "react";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import ArticleBodyEditor from "@/components/editorial/ArticleBodyEditor";
import {
  getHeroes, getArticles, getAds, saveHeroes, saveArticles, saveAds,
  publishEditorialContent, publishEdition, getPublishedContentSnapshot, DEFAULT_PUBLISHED_CONTENT,
  resetToDefaults, clearLocalDraftStorage, isStorageQuotaExceededError,
  CATEGORIES, formatEditionLabel, publishStory,
} from "@/lib/content-store";
import type { HeroItem, Article, AdSlot, Category, ArticleBodyBlock } from "@/lib/content-store";
import { Trash2, Plus, Upload, RotateCcw, Image, Video, BarChart3, Eye, MousePointer, TrendingUp, MapPin, Globe, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import { fetchAnalytics, mergeContentStats, clearAnalytics, type AnalyticsPayload } from "@/lib/analytics";
import { getAdminPublishToken, isAdminAuthenticated, setAdminPublishToken, setAdminAuthenticated, resetAdminPasswordAccess } from "@/lib/admin-auth";
import { fileToOptimizedDataUrl } from "@/lib/media-optimizer";

const STORAGE_KEY = "magorium_page_content";
const DRAFT_EDITIONS_KEY = "magorium_draft_editions";

function getDraftEditions(): string[] {
  try {
    const raw = localStorage.getItem(DRAFT_EDITIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function markEditionAsDraft(edition: string) {
  const current = new Set(getDraftEditions());
  current.add(edition);
  try {
    localStorage.setItem(DRAFT_EDITIONS_KEY, JSON.stringify([...current]));
  } catch {}
}

function markEditionAsPublished(edition: string) {
  const current = new Set(getDraftEditions());
  current.delete(edition);
  try {
    localStorage.setItem(DRAFT_EDITIONS_KEY, JSON.stringify([...current]));
  } catch {}
}

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
            <input type="password" value={passwordInput} onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }} placeholder="Enter password" className="w-full h-10 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" autoFocus />
            {passwordError && <p className="text-sm text-destructive">Incorrect password</p>}
            <button type="submit" disabled={isLoggingIn} className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-70">{isLoggingIn ? "Signing In..." : "Sign In"}</button>
            <button type="button" onClick={handleResetAccess} className="w-full h-10 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Reset Admin Password Access</button>
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
  const [isPublishingEdition, setIsPublishingEdition] = useState(false);
  const [draftEditions, setDraftEditions] = useState<string[]>(() => getDraftEditions());
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
  if (!window.confirm("This will publish EVERYTHING currently loaded — every edition, including any unpublished drafts — straight to your live site. Continue?")) return;
  setIsSaving(true);
  try {
    const publishToken = getAdminPublishToken();
    if (!publishToken) {
      toast.error("Admin session expired. Please sign in again to publish live.");
      return;
    }

    let successCount = 0;
    let failCount = 0;
    const failedTitles: string[] = [];

    for (const hero of heroes) {
      const result = await publishStory(hero.edition, "hero", hero, publishToken);
      if (result.success) successCount += 1;
      else { failCount += 1; failedTitles.push(hero.title); }
    }
    for (const article of articles) {
      const result = await publishStory(article.edition, "article", article, publishToken);
      if (result.success) successCount += 1;
      else { failCount += 1; failedTitles.push(article.title); }
    }

    if (failCount === 0) {
      getEditionsFromState(heroes, articles).forEach((ed) => markEditionAsPublished(ed));
      setDraftEditions(getDraftEditions());
      toast.success(`All ${successCount} items published live.`);
    } else {
      toast.error(`${successCount} published, ${failCount} FAILED to publish live: ${failedTitles.join(", ")}. Nothing was silently saved to local storage — please retry the failed items.`);
    }
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Could not save content");
  } finally {
    setIsSaving(false);
  }
};

  const publishCurrentEditionLive = async () => {
    if (!currentEdition || isPublishingEdition) return;
    setIsPublishingEdition(true);
    try {
      const publishToken = getAdminPublishToken();
      if (!publishToken) { toast.error("Admin session expired. Please sign in again to publish live."); return; }
      const result = await publishEdition(currentEdition, filteredHeroes, filteredArticles, ads, publishToken);
      if (!result.success) {
        toast.error(result.error || "Could not publish this edition to live.");
        return;
      }
      markEditionAsPublished(currentEdition);
      setDraftEditions(getDraftEditions());
      toast.success(`${formatEditionLabel(currentEdition)} is now live.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish this edition.");
    } finally {
      setIsPublishingEdition(false);
    }
  };

  const handleLogout = () => {
    if (!window.confirm("Log out of the admin panel? You'll need your password to sign back in.")) return;
    resetAdminPasswordAccess();
    window.location.reload();
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
    const nextHeroes = [...heroes, ...starterHeroes];
    const nextArticles = [...articles, ...starterArticles];
    setHeroes(nextHeroes);
    setArticles(nextArticles);
    try {
      saveHeroes(nextHeroes);
      saveArticles(nextArticles);
    } catch {
      toast.warning("New edition created, but the local safety backup couldn't save (storage full). Publish soon to be safe.");
    }
    markEditionAsDraft(newEditionMonth);
    setDraftEditions(getDraftEditions());
    setCurrentEdition(newEditionMonth);
    setShowNewEdition(false);
    setNewEditionMonth("");
    toast.success(`Created new edition: ${formatEditionLabel(newEditionMonth)} with starter content — it's a private draft until you click "Publish Edition Live."`);
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
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm border border-destructive/40 rounded text-destructive hover:bg-destructive/10 transition-colors">Log Out</button>
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded text-muted-foreground hover:text-foreground transition-colors"><RotateCcw className="w-4 h-4" /> Reset</button>
            <button onClick={handleRestoreBackup} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 text-sm border border-primary rounded text-primary hover:bg-primary/10 transition-colors disabled:opacity-70"><RotateCcw className="w-4 h-4" /> Restore Backup</button>
            <button onClick={save} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-70">{isSaving ? "Saving..." : "Save Changes"}</button>
            <button onClick={publishCurrentEditionLive} disabled={isPublishingEdition || !currentEdition} className="flex items-center gap-2 px-5 py-2 text-sm font-medium border border-primary text-primary rounded hover:bg-primary/10 transition-colors disabled:opacity-70">{isPublishingEdition ? "Publishing..." : "Publish Edition Live"}</button>
          </div>
        </div>

        {tab !== "pages" && (
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-sm font-sans uppercase tracking-wider text-muted-foreground">Current Edition:</span>
                <select value={currentEdition} onChange={(e) => setCurrentEdition(e.target.value)} className="bg-secondary text-foreground px-4 py-2 rounded font-serif text-lg border-0">
                  {editions.map((ed) => <option key={ed} value={ed}>{formatEditionLabel(ed)}{draftEditions.includes(ed) ? " (Draft)" : ""}</option>)}
                </select>
                {currentEdition && draftEditions.includes(currentEdition) && (
                  <span className="px-2 py-1 text-[10px] uppercase tracking-wider font-sans border border-yellow-500/50 text-yellow-500 rounded">Draft — not live</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={deleteCurrentEdition} disabled={!currentEdition} className="flex items-center gap-2 px-4 py-2 text-sm border border-destructive text-destructive rounded hover:bg-destructive/10 transition-colors disabled:pointer-events-none disabled:opacity-50"><Trash2 className="w-4 h-4" /> Delete Edition</button>
                {showNewEdition ? (
                  <div className="flex items-center gap-2">
                    <input type="month" value={newEditionMonth} onChange={(e) => setNewEditionMonth(e.target.value)} className="bg-secondary text-foreground px-3 py-2 rounded text-sm" />
                    <button onClick={createNewEdition} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded">Create</button>
                    <button onClick={() => setShowNewEdition(false)} className="px-3 py-2 text-sm text-muted-foreground">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setShowNewEdition(true)} className="flex items-center gap-2 px-4 py-2 text-sm border border-primary text-primary rounded hover:bg-primary/10 transition-colors"><Plus className="w-4 h-4" /> New Edition</button>
                )}
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground font-sans">{filteredHeroes.length} heroes · {filteredArticles.length} articles in this edition</div>
          </div>
        )}

        <div className="flex gap-1 border-b border-border mb-8 overflow-x-auto">
          {(["heroes", "articles", "ads", "analytics", "pages"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-3 text-sm font-sans uppercase tracking-wider transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t === "analytics" && <BarChart3 className="w-4 h-4" />}
              {t === "pages" && <FileText className="w-4 h-4" />}
              {t === "ads" ? "Advertising" : t === "analytics" ? "Analytics" : t === "pages" ? "Pages" : t}
            </button>
          ))}
        </div>

        {tab === "heroes" && <HeroesManager heroes={heroes} setHeroes={setHeroes} filteredHeroes={filteredHeroes} currentEdition={currentEdition} />}
       {tab === "articles" && <ArticlesManager articles={articles} setArticles={setArticles} filteredArticles={filteredArticles} currentEdition={currentEdition} publishToken={getAdminPublishToken()} />}
        {tab === "ads" && <AdsManager ads={ads} setAds={setAds} />}
        {tab === "analytics" && <AnalyticsDashboard articles={articles} heroes={heroes} ads={ads} />}
        {tab === "pages" && <PagesManager pageContent={pageContent} setPageContent={setPageContent} />}
      </div>
    </div>
  );
}

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
            kind="hero" title={hero.title} summary={hero.subtitle} category={hero.category} author={hero.author || ""} seoTags={hero.seoTags || []} date={hero.date} featured={hero.featured} imageUrl={hero.imageUrl} videoUrl={hero.videoUrl} secondaryImageUrl={hero.secondaryImageUrl || ""} secondaryImageCaption={hero.secondaryImageCaption || ""} secondaryImageCitation={hero.secondaryImageCitation || ""} secondaryImageAlign={hero.secondaryImageAlign || "center"} secondaryImageWidth={hero.secondaryImageWidth || "full"} body={hero.body || []}
            onTitleChange={(v) => update(hero.id, { title: v })} onSummaryChange={(v) => update(hero.id, { subtitle: v })} onCategoryChange={(v) => update(hero.id, { category: v })} onAuthorChange={(v) => update(hero.id, { author: v })} onSeoTagsChange={(v) => update(hero.id, { seoTags: v })} onDateChange={(v) => update(hero.id, { date: v })} onFeaturedChange={(v) => update(hero.id, { featured: v })} onImageChange={(v) => update(hero.id, { imageUrl: v })} onVideoChange={(v) => update(hero.id, { videoUrl: v })} onSecondaryImageChange={(v) => update(hero.id, { secondaryImageUrl: v })} onSecondaryImageCaptionChange={(v) => update(hero.id, { secondaryImageCaption: v })} onSecondaryImageCitationChange={(v) => update(hero.id, { secondaryImageCitation: v })} onSecondaryImageAlignChange={(v) => update(hero.id, { secondaryImageAlign: v })} onSecondaryImageWidthChange={(v) => update(hero.id, { secondaryImageWidth: v })} onBodyChange={(v) => update(hero.id, { body: v })} onNormalizeBody={() => update(hero.id, { body: normalizeBodyFlow(hero.body || [], hero.imageUrl, hero.videoUrl) })} sources={hero.sources || ""} onSourcesChange={(v) => update(hero.id, { sources: v })} ad={hero.ad} onAdChange={(v) => update(hero.id, { ad: v })}
          />
        </ContentCard>
      ))}
    </div>
  );
}

function ArticlesManager({ articles, setArticles, filteredArticles, currentEdition, publishToken }: { articles: Article[]; setArticles: (a: Article[]) => void; filteredArticles: Article[]; currentEdition: string; publishToken: string | null }) {
  const addArticle = () => setArticles([{ id: `a-${Date.now()}`, title: "New Article", excerpt: "", seoTags: [], category: "Travel", imageUrl: "", author: "", date: new Date().toISOString().split("T")[0], edition: currentEdition || new Date().toISOString().slice(0, 7) }, ...articles]);
  const update = (id: string, patch: Partial<Article>) => setArticles(articles.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  const remove = (id: string) => setArticles(articles.filter((a) => a.id !== id));
  const saveArticleLive = async (article: Article) => {
    if (!publishToken) { toast.error("Admin session expired. Please sign in again to publish live."); return; }
    const result = await publishStory(currentEdition, "article", article, publishToken);
    if (result.success) toast.success(`"${article.title}" published.`);
    else toast.error(result.error || "Could not publish this article.");
  };
  return (
    <div className="space-y-6">
      <AddButton onClick={addArticle} label={`Add Article to ${currentEdition ? formatEditionLabel(currentEdition) : "Edition"}`} />
      {filteredArticles.map((article) => (
        <ContentCard key={article.id} onRemove={() => remove(article.id)}>
          <EditableStoryForm
            kind="article" title={article.title} summary={article.excerpt} category={article.category} author={article.author} seoTags={article.seoTags || []} date={article.date} featured={article.featured} imageUrl={article.imageUrl} videoUrl={article.videoUrl} secondaryImageUrl={article.secondaryImageUrl || ""} secondaryImageCaption={article.secondaryImageCaption || ""} secondaryImageCitation={article.secondaryImageCitation || ""} secondaryImageAlign={article.secondaryImageAlign || "center"} secondaryImageWidth={article.secondaryImageWidth || "full"} body={article.body || []}
            onTitleChange={(v) => update(article.id, { title: v })} onSummaryChange={(v) => update(article.id, { excerpt: v })} onCategoryChange={(v) => update(article.id, { category: v })} onAuthorChange={(v) => update(article.id, { author: v })} onSeoTagsChange={(v) => update(article.id, { seoTags: v })} onDateChange={(v) => update(article.id, { date: v })} onFeaturedChange={(v) => update(article.id, { featured: v })} onImageChange={(v) => update(article.id, { imageUrl: v })} onVideoChange={(v) => update(article.id, { videoUrl: v })} onSecondaryImageChange={(v) => update(article.id, { secondaryImageUrl: v })} onSecondaryImageCaptionChange={(v) => update(article.id, { secondaryImageCaption: v })} onSecondaryImageCitationChange={(v) => update(article.id, { secondaryImageCitation: v })} onSecondaryImageAlignChange={(v) => update(article.id, { secondaryImageAlign: v })} onSecondaryImageWidthChange={(v) => update(article.id, { secondaryImageWidth: v })} onBodyChange={(v) => update(article.id, { body: v })} onNormalizeBody={() => update(article.id, { body: normalizeBodyFlow(article.body || [], article.imageUrl, article.videoUrl) })} sources={article.sources || ""} onSourcesChange={(v) => update(article.id, { sources: v })} ad={article.ad} onAdChange={(v) => update(article.id, { ad: v })}
          />
          <button type="button" onClick={() => saveArticleLive(article)} className="mt-3 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity">
            Save This Article
          </button>
        </ContentCard>
      ))}
    </div>
  );
}

function EditableStoryForm({
  kind, title, summary, category, author, seoTags, date, featured,
  imageUrl, videoUrl, secondaryImageUrl, secondaryImageCaption, secondaryImageCitation,
  secondaryImageAlign, secondaryImageWidth,
  body, onTitleChange, onSummaryChange, onCategoryChange, onAuthorChange,
  onSeoTagsChange, onDateChange, onFeaturedChange, onImageChange, onVideoChange,
  onSecondaryImageChange, onSecondaryImageCaptionChange, onSecondaryImageCitationChange,
  onSecondaryImageAlignChange, onSecondaryImageWidthChange,
  onBodyChange, onNormalizeBody, sources, onSourcesChange,ad, onAdChange,
}: {
  kind: "hero" | "article"; title: string; summary: string; category: Category; author: string;
  seoTags: string[]; date: string; featured?: boolean; imageUrl?: string; videoUrl?: string;
  secondaryImageUrl?: string; secondaryImageCaption?: string; secondaryImageCitation?: string;
  secondaryImageAlign?: "left" | "center" | "right"; secondaryImageWidth?: "small" | "medium" | "large" | "full";
  body: ArticleBodyBlock[];
  onTitleChange: (v: string) => void; onSummaryChange: (v: string) => void;
  onCategoryChange: (v: Category) => void; onAuthorChange: (v: string) => void;
  onSeoTagsChange: (v: string[]) => void; onDateChange: (v: string) => void;
  onFeaturedChange: (v: boolean) => void; onImageChange: (v: string) => void;
  onVideoChange: (v: string) => void; onSecondaryImageChange: (v: string) => void;
  onSecondaryImageCaptionChange: (v: string) => void; onSecondaryImageCitationChange: (v: string) => void;
  onSecondaryImageAlignChange: (v: "left" | "center" | "right") => void;
  onSecondaryImageWidthChange: (v: "small" | "medium" | "large" | "full") => void;
  onBodyChange: (v: ArticleBodyBlock[]) => void; onNormalizeBody: () => void;
sources?: string; onSourcesChange?: (v: string) => void;
  ad?: AdSlot; onAdChange: (v: AdSlot | undefined) => void;
}) {
  const isArticle = kind === "article";
  const [seoTagDraft, setSeoTagDraft] = useState("");
  const [localSecondaryUrl, setLocalSecondaryUrl] = useState(secondaryImageUrl || "");
  const secondaryImgRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalSecondaryUrl(secondaryImageUrl || ""); }, [secondaryImageUrl]);

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
    if (file) {
      const url = await fileToOptimizedDataUrl(file);
      setLocalSecondaryUrl(url);
      onSecondaryImageChange(url);
    }
    e.target.value = "";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
      <MediaUpload imageUrl={imageUrl} videoUrl={videoUrl} onImage={onImageChange} onVideo={onVideoChange} />
      <div className="space-y-3">
        <FormattableField value={title} onChange={onTitleChange} placeholder={isArticle ? "Article title" : "Hero title"} className="w-full bg-secondary text-foreground px-3 py-2 rounded font-serif text-lg" as="input" />
        <FormattableField value={summary} onChange={onSummaryChange} placeholder={isArticle ? "Excerpt" : "Subtitle / deck"} className="w-full bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans resize-none" as="textarea" />
        <div className="flex flex-wrap gap-3">
          <select value={category} onChange={(e) => onCategoryChange(e.target.value as Category)} className="bg-secondary text-foreground px-3 py-2 rounded text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
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

        <div className="mt-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-primary font-sans">Article Opening Photo</h4>
            <p className="text-[11px] text-muted-foreground font-sans mt-0.5">Appears below the headline, above the first paragraph. Leave empty to skip.</p>
          </div>
          {localSecondaryUrl ? (
            <div className="relative">
              <img src={localSecondaryUrl} alt="Opening photo preview" className="w-full max-h-48 object-cover rounded border border-border" />
              <button type="button" onClick={() => { setLocalSecondaryUrl(""); onSecondaryImageChange(""); onSecondaryImageCaptionChange(""); onSecondaryImageCitationChange(""); }} className="absolute top-2 right-2 flex items-center gap-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-destructive text-white rounded shadow hover:bg-destructive/90 transition-colors">
                <Trash2 className="w-3 h-3" /> Remove Photo
              </button>
            </div>
          ) : (
            <div className="w-full h-24 rounded border-2 border-dashed border-border bg-secondary flex items-center justify-center text-xs text-muted-foreground font-sans">No opening photo uploaded</div>
          )}
       <button type="button" onClick={() => secondaryImgRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm border border-primary text-primary rounded hover:bg-primary/10 transition-colors"><Upload className="w-4 h-4" /> Upload Opening Photo</button>
          <input ref={secondaryImgRef} type="file" accept="image/*" className="hidden" onChange={handleSecondaryImageUpload} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select value={secondaryImageAlign || "center"} onChange={(e) => onSecondaryImageAlignChange(e.target.value as "left" | "center" | "right")} className="bg-secondary text-foreground px-3 py-1.5 rounded text-xs font-sans">
              <option value="left">Align: Left</option>
              <option value="center">Align: Center</option>
              <option value="right">Align: Right</option>
            </select>
            <select value={secondaryImageWidth || "full"} onChange={(e) => onSecondaryImageWidthChange(e.target.value as "small" | "medium" | "large" | "full")} className="bg-secondary text-foreground px-3 py-1.5 rounded text-xs font-sans">
              <option value="small">Size: Small</option>
              <option value="medium">Size: Medium</option>
              <option value="large">Size: Large</option>
              <option value="full">Size: Full Width</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={secondaryImageCaption || ""} onChange={(e) => onSecondaryImageCaptionChange(e.target.value)} placeholder="Caption (optional)" className="flex-1 bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans" />
            <input value={secondaryImageCitation || ""} onChange={(e) => onSecondaryImageCitationChange(e.target.value)} placeholder="Photo credit (optional)" className="flex-1 bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans" />
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
                <button key={tag} type="button" onClick={() => onSeoTagsChange(seoTags.filter((t) => t.toLowerCase() !== tag.toLowerCase()))} className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs font-sans hover:bg-primary/15">#{tag}<span className="text-[10px]">x</span></button>
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

        <div className="mt-4 pt-4 border-t border-border">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(ad)}
              onChange={(e) => {
               if (e.target.checked) {
                  onAdChange({
                    id: `inline-ad-${Date.now()}`,
                    label: isArticle ? "Article Ad" : "Hero Ad",
                    position: isArticle ? "inline-article" : "inline-hero",
                    placement: "center",
                    width: 300,
                    height: 250,
                  });
                } else {
                  onAdChange(undefined);
                }
              }}
              className="accent-primary"
            />
            Attach an ad to this {isArticle ? "article" : "hero"}
          </label>

          {ad && (
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 mt-3">
              <MediaUpload
                imageUrl={ad.imageUrl}
                videoUrl={ad.videoUrl}
                onImage={(url) => onAdChange({ ...ad, imageUrl: url })}
                onVideo={(url) => onAdChange({ ...ad, videoUrl: url })}
              />
              <div className="space-y-3">
                <span className="text-xs text-muted-foreground">
                  W: <input type="number" value={ad.width} onChange={(e) => onAdChange({ ...ad, width: parseInt(e.target.value) || 0 })} className="w-16 bg-secondary text-foreground px-1 py-0.5 rounded" />
                  {" "}× H: <input type="number" value={ad.height} onChange={(e) => onAdChange({ ...ad, height: parseInt(e.target.value) || 0 })} className="w-16 bg-secondary text-foreground px-1 py-0.5 rounded" />
                </span>
                <input value={ad.linkUrl || ""} onChange={(e) => onAdChange({ ...ad, linkUrl: e.target.value })} placeholder="Click-through URL" className="w-full bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
                <span className="text-xs text-muted-foreground">W: <input type="number" value={ad.width} onChange={(e) => update(ad.id, { width: parseInt(e.target.value) || 0 })} className="w-16 bg-secondary text-foreground px-1 py-0.5 rounded" /> × H: <input type="number" value={ad.height} onChange={(e) => update(ad.id, { height: parseInt(e.target.value) || 0 })} className="w-16 bg-secondary text-foreground px-1 py-0.5 rounded" /></span>
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
    if (file) onUpdate([...current, await fileToOptimizedDataUrl(file)]);
    e.target.value = "";
  };

  const removeImage = (index: number, current: string[], onUpdate: (imgs: string[]) => void) => onUpdate(current.filter((_, i) => i !== index));

  const pages = [
    { key: "editorsLetter" as const, label: "Editor's Letter" },
    { key: "contributors" as const, label: "Contributors" },
    { key: "partnerships" as const, label: "Partnerships" },
    { key: "masthead" as const, label: "Masthead" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground font-sans">Edit static pages. Changes save instantly to the live site.</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {pages.map(({ key, label }) => (
          <button key={key} onClick={() => setActivePage(key)} className={`px-5 py-2.5 text-sm rounded font-sans transition-colors ${activePage === key ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}>{label}</button>
        ))}
      </div>

      {activePage === "editorsLetter" && (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-lg p-5">
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-sans mb-3">Logo / Brand Image — Admin Only</label>
            <div className="flex items-center gap-4 flex-wrap">
              {pageContent.editorsLetter.logoUrl ? <img src={pageContent.editorsLetter.logoUrl} alt="Logo" className="h-16 object-contain rounded border border-border bg-secondary p-2" /> : <div className="h-16 w-48 rounded border-2 border-dashed border-border bg-secondary flex items-center justify-center text-xs text-muted-foreground font-sans">No logo uploaded</div>}
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => logoRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm border border-primary text-primary rounded hover:bg-primary/10 transition-colors"><Upload className="w-4 h-4" /> Upload Logo</button>
                {pageContent.editorsLetter.logoUrl && <button type="button" onClick={() => updateEL({ logoUrl: "" })} className="flex items-center gap-2 px-4 py-2 text-sm border border-destructive/40 text-destructive rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4" /> Remove</button>}
              </div>
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, (url) => updateEL({ logoUrl: url }))} />
            <p className="text-[10px] text-muted-foreground font-sans mt-3">Shown at the top of the Editor's Letter page. Leave empty to hide.</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-sans mb-2">Opening Quote</label>
            <textarea value={pageContent.editorsLetter.quote} onChange={(e) => updateEL({ quote: e.target.value })} rows={2} className="w-full bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans resize-none" />
          </div>
          {(["body1", "body2", "body3"] as const).map((field, i) => (
            <div key={field} className="bg-card border border-border rounded-lg p-5">
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-sans mb-2">Paragraph {i + 1}</label>
              <textarea value={pageContent.editorsLetter[field]} onChange={(e) => updateEL({ [field]: e.target.value })} rows={4} className="w-full bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans resize-none" />
            </div>
          ))}
          <div className="bg-card border border-border rounded-lg p-5">
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-sans mb-2">Sign-off</label>
            <textarea value={pageContent.editorsLetter.signoff} onChange={(e) => updateEL({ signoff: e.target.value })} rows={2} className="w-full bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans resize-none" />
          </div>
        </div>
      )}

      {activePage === "contributors" && (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-lg p-5">
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-sans mb-3">Logo / Brand Image</label>
            <div className="flex items-center gap-4 flex-wrap">
              {pageContent.contributors.logoUrl ? <img src={pageContent.contributors.logoUrl} alt="Logo" className="h-16 object-contain rounded border border-border bg-secondary p-2" /> : <div className="h-16 w-48 rounded border-2 border-dashed border-border bg-secondary flex items-center justify-center text-xs text-muted-foreground font-sans">No logo uploaded</div>}
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => contribLogoRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm border border-primary text-primary rounded hover:bg-primary/10 transition-colors"><Upload className="w-4 h-4" /> Upload Logo</button>
                {pageContent.contributors.logoUrl && <button type="button" onClick={() => updateContribs({ logoUrl: "" })} className="flex items-center gap-2 px-4 py-2 text-sm border border-destructive/40 text-destructive rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4" /> Remove</button>}
              </div>
            </div>
            <input ref={contribLogoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, (url) => updateContribs({ logoUrl: url }))} />
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-sans mb-3">Additional Photos</label>
            {pageContent.contributors.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {pageContent.contributors.images.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt="" className="w-full h-32 object-cover rounded-lg border border-border" />
                    <button type="button" onClick={() => removeImage(i, pageContent.contributors.images, (imgs) => updateContribs({ images: imgs }))} className="absolute top-1 right-1 p-1 bg-destructive text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={() => contribImgRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm border border-primary text-primary rounded hover:bg-primary/10 transition-colors"><Plus className="w-4 h-4" /> Add Photo</button>
            <input ref={contribImgRef} type="file" accept="image/*" className="hidden" onChange={(e) => addImage(e, pageContent.contributors.images, (imgs) => updateContribs({ images: imgs }))} />
            <p className="text-[10px] text-muted-foreground font-sans mt-2">Photos appear as a grid at the top of the Contributors page.</p>
          </div>
        </div>
      )}

      {activePage === "partnerships" && (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-lg p-5">
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-sans mb-3">Partner Logo / Brand Image</label>
            <div className="flex items-center gap-4 flex-wrap">
              {pageContent.partnerships.logoUrl ? <img src={pageContent.partnerships.logoUrl} alt="Logo" className="h-16 object-contain rounded border border-border bg-secondary p-2" /> : <div className="h-16 w-48 rounded border-2 border-dashed border-border bg-secondary flex items-center justify-center text-xs text-muted-foreground font-sans">No logo uploaded</div>}
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => partnerLogoRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm border border-primary text-primary rounded hover:bg-primary/10 transition-colors"><Upload className="w-4 h-4" /> Upload Logo</button>
                {pageContent.partnerships.logoUrl && <button type="button" onClick={() => updatePartners({ logoUrl: "" })} className="flex items-center gap-2 px-4 py-2 text-sm border border-destructive/40 text-destructive rounded hover:bg-destructive/10 transition-colors"><Trash2 className="w-4 h-4" /> Remove</button>}
              </div>
            </div>
            <input ref={partnerLogoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e, (url) => updatePartners({ logoUrl: url }))} />
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-sans mb-3">Partner Photos</label>
            {pageContent.partnerships.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {pageContent.partnerships.images.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt="" className="w-full h-32 object-cover rounded-lg border border-border" />
                    <button type="button" onClick={() => removeImage(i, pageContent.partnerships.images, (imgs) => updatePartners({ images: imgs }))} className="absolute top-1 right-1 p-1 bg-destructive text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={() => partnerImgRef.current?.click()} className="flex items-center gap-2 px-4 py-2 text-sm border border-primary text-primary rounded hover:bg-primary/10 transition-colors"><Plus className="w-4 h-4" /> Add Photo</button>
            <input ref={partnerImgRef} type="file" accept="image/*" className="hidden" onChange={(e) => addImage(e, pageContent.partnerships.images, (imgs) => updatePartners({ images: imgs }))} />
            <p className="text-[10px] text-muted-foreground font-sans mt-2">Photos appear as a grid at the top of the Partnerships page.</p>
          </div>
        </div>
      )}

      {activePage === "masthead" && (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-lg p-5">
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-sans mb-2">Editor in Chief</label>
            <input value={pageContent.masthead.editorInChief} onChange={(e) => updateMasthead({ editorInChief: e.target.value })} className="w-full bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans" placeholder="Name" />
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-sans mb-2">Contributors</label>
            <textarea value={pageContent.masthead.contributors} onChange={(e) => updateMasthead({ contributors: e.target.value })} rows={8} className="w-full bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans resize-none" placeholder="One contributor per line..." />
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <label className="block text-[10px] uppercase tracking-wider text-muted-foreground font-sans mb-2">Contact / Editorial Enquiries</label>
            <input value={pageContent.masthead.contact} onChange={(e) => updateMasthead({ contact: e.target.value })} className="w-full bg-secondary text-foreground px-3 py-2 rounded text-sm font-sans" placeholder="editorial@themagorium.com" />
          </div>
        </div>
      )}
    </div>
  );
}

function ContentCard({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <div className="bg-card border border-border rounded p-5 relative group">
      {children}
      {onRemove && (
        <button onClick={onRemove} className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
      )}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="w-full border border-dashed border-border rounded p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors"><Plus className="w-4 h-4" /> {label}</button>
  );
}

function normalizeBodyFlow(blocks: ArticleBodyBlock[], imageUrl?: string, videoUrl?: string): ArticleBodyBlock[] {
  const source = blocks.filter(Boolean);
  const textBlocks = source.filter((b) => b.type === "text" || b.type === "heading");
  const mediaBlocks = source.filter((b) => b.type === "image" || b.type === "video");
  const ordered: ArticleBodyBlock[] = [];
  if (textBlocks.length === 0) {
    ordered.push({ id: `auto-t-${Date.now()}`, type: "text", content: "Add body text" });
    if (videoUrl) ordered.push({ id: `auto-v-${Date.now()}`, type: "video", content: videoUrl, caption: "Featured video" });
    else ordered.push({ id: `auto-i-${Date.now()}`, type: "image", content: imageUrl || "", imageAlign: "center", imageWidth: "full", caption: imageUrl ? "Featured image" : "Upload photo or video" });
    return ordered;
  }
  const max = Math.max(textBlocks.length, mediaBlocks.length || 1);
  for (let i = 0; i < max; i += 1) {
    if (textBlocks[i]) ordered.push(textBlocks[i]);
    if (mediaBlocks[i]) ordered.push(mediaBlocks[i]);
    else if (i < textBlocks.length) {
      if (videoUrl) ordered.push({ id: `auto-v-${Date.now()}-${i}`, type: "video", content: videoUrl, caption: "Featured video" });
      else ordered.push({ id: `auto-i-${Date.now()}-${i}`, type: "image", content: imageUrl || "", imageAlign: "center", imageWidth: "full", caption: imageUrl ? "Featured image" : "Upload photo or video" });
    }
  }
  return ordered;
}

function FormattableField({
  value, onChange, placeholder, className, as,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string; as: "input" | "textarea";
}) {
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  const wrapSelection = (marker: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const before = value.slice(0, start);
    const selected = value.slice(start, end);
    const after = value.slice(end);
    const next = selected
      ? `${before}${marker}${selected}${marker}${after}`
      : `${before}${marker}${marker}${after}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = selected ? start + marker.length + selected.length + marker.length : start + marker.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const Tag = as as any;

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        <button type="button" onClick={() => wrapSelection("**")} className="px-2 py-0.5 text-xs font-bold border border-border rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors">B</button>
        <button type="button" onClick={() => wrapSelection("*")} className="px-2 py-0.5 text-xs italic border border-border rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors">I</button>
      </div>
      <Tag
        ref={ref}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        {...(as === "textarea" ? { rows: 2 } : {})}
      />
    </div>
  );
}

function MediaUpload({ imageUrl, videoUrl, onImage, onVideo }: { imageUrl?: string; videoUrl?: string; onImage: (url: string) => void; onVideo: (url: string) => void }) {
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) onImage(await fileToOptimizedDataUrl(file)); e.target.value = ""; };
  const handleVideo = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) onVideo(await fileToOptimizedDataUrl(file)); e.target.value = ""; };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground font-sans">
        <span>Featured Media</span><span>Click Photo or Video to Upload</span>
      </div>
      <div className="aspect-video bg-secondary rounded overflow-hidden flex items-center justify-center">
        {imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> : <Image className="w-8 h-8 text-muted-foreground" />}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => imgRef.current?.click()} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] uppercase tracking-wider border border-border rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors"><Upload className="w-3 h-3" /> Photo</button>
        <button type="button" onClick={() => vidRef.current?.click()} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] uppercase tracking-wider border border-border rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors"><Video className="w-3 h-3" /> Video</button>
      </div>
      <p className="text-[10px] text-muted-foreground font-sans">Supported uploads: image/* and video/* files from your device.</p>
      {videoUrl && <p className="text-[10px] text-primary truncate">Video attached ✓</p>}
      <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
      <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={handleVideo} />
    </div>
  );
}

function AnalyticsDashboard({ articles, heroes, ads }: { articles: Article[]; heroes: HeroItem[]; ads: AdSlot[] }) {
  const [filter, setFilter] = useState<"all" | "article" | "hero" | "ad">("all");
  const totals = getTotalStats();
  const summary = getAnalyticsSummary(articles, heroes, ads);
  const recent = getRecentEvents(30);
  const locations = getLocationStats();
  const filtered = filter === "all" ? summary : summary.filter((s) => s.contentType === filter);
  const sorted = [...filtered].sort((a, b) => b.views - a.views);
  const handleClear = () => {
    if (!window.confirm("Clear ALL analytics data? This cannot be undone.")) return;
    clearAnalytics();
    toast.success("Analytics data cleared.");
    window.location.reload();
  };
  const handlePrint = () => window.print();
  const reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const scopeLabel = filter === "all" ? "All Content" : filter === "ad" ? "Ads" : `${filter}s`;

  return (
    <div id="analytics-print-area" className="space-y-8 bg-white text-black rounded-lg p-6 border border-gray-200 print:border-0 print:p-0 print:rounded-none">
      <style>{`
        .print-report-header { display: none; }
        @media print {
          body * { visibility: hidden; }
          #analytics-print-area, #analytics-print-area * { visibility: visible; }
          #analytics-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
          .print-report-header { display: block !important; margin-bottom: 24px; }
          @page { margin: 18mm; }
        }
      `}</style>

      <div className="print-report-header">
        <h1 className="text-2xl font-serif font-bold text-black">The Magorium — Analytics Report</h1>
        <p className="text-sm text-blue-700 mt-1">Scope: {scopeLabel} &nbsp;·&nbsp; Generated: {reportDate}</p>
      </div>

      <div className="flex justify-end print:hidden">
        <button onClick={handlePrint} className="px-4 py-2 text-xs uppercase tracking-widest font-sans border border-blue-600 text-blue-700 rounded hover:bg-blue-50 transition-colors">
          Print Report
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Eye className="w-5 h-5" />} label="Total Views" value={totals.totalViews} />
        <StatCard icon={<MousePointer className="w-5 h-5" />} label="Total Clicks" value={totals.totalClicks} />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Click-Through Rate" value={totals.totalViews > 0 ? `${((totals.totalClicks / totals.totalViews) * 100).toFixed(1)}%` : "—"} />
        <StatCard icon={<Globe className="w-5 h-5" />} label="Unique Locations" value={totals.uniqueLocations} />
      </div>

      <div className="flex flex-wrap items-center gap-3 print:hidden">
        {(["all", "article", "hero", "ad"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs uppercase tracking-widest font-sans border rounded transition-colors ${
              filter === f ? "border-blue-600 text-blue-700 bg-blue-50" : "border-gray-300 text-blue-700 hover:bg-blue-50"
            }`}
          >
            {f === "all" ? "All Content" : f === "ad" ? "Ads" : `${f}s`}
          </button>
        ))}
        <button onClick={handleClear} className="ml-auto px-4 py-2 text-xs uppercase tracking-widest font-sans border border-red-400 text-red-600 rounded hover:bg-red-50 transition-colors">
          Clear Data
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-2 px-5 py-3 text-[10px] uppercase tracking-widest text-blue-700 font-sans border-b border-gray-200">
          <span>Content</span><span className="text-center">Type</span><span className="text-center">Views</span><span className="text-center">Clicks</span><span className="text-center">CTR</span>
        </div>
        {sorted.length === 0 ? (
          <div className="px-5 py-8 text-center text-black text-sm font-sans">No data yet.</div>
        ) : sorted.map((item) => {
          const ctr = item.views > 0 ? ((item.clicks / item.views) * 100).toFixed(1) : "0.0";
          return (
            <div key={`${item.contentType}:${item.contentId}`} className="grid grid-cols-[1fr_80px_80px_80px_100px] gap-2 px-5 py-3 text-sm font-sans border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
              <span className="truncate text-black">{item.label || item.contentId}</span>
              <span className="text-center">
                <span className="inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider rounded bg-blue-100 text-blue-700">
                  {item.contentType}
                </span>
              </span>
              <span className="text-center text-black font-medium">{item.views}</span>
              <span className="text-center text-black font-medium">{item.clicks}</span>
              <span className="text-center text-black font-medium">{ctr}%</span>
            </div>
          );
        })}
      </div>

      <div>
        <h3 className="font-serif text-lg font-semibold mb-3 text-blue-700 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-700" /> Viewer Locations
        </h3>
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_80px_80px] gap-2 px-5 py-3 text-[10px] uppercase tracking-widest text-blue-700 font-sans border-b border-gray-200">
            <span>City</span><span>Country</span><span className="text-center">Views</span><span className="text-center">Clicks</span>
          </div>
          {locations.length === 0 ? (
            <div className="px-5 py-6 text-center text-black text-sm font-sans">No location data yet.</div>
          ) : locations.map((loc) => (
            <div key={`${loc.city}|${loc.country}`} className="grid grid-cols-[1fr_120px_80px_80px] gap-2 px-5 py-3 text-sm font-sans border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
              <span className="text-black flex items-center gap-2">
                <MapPin className="w-3 h-3 text-blue-700 shrink-0" />{loc.city}
              </span>
              <span className="text-black flex items-center gap-1.5">
                <span className="text-xs">{loc.countryCode}</span>{loc.country}
              </span>
              <span className="text-center text-black font-medium">{loc.views}</span>
              <span className="text-center text-black font-medium">{loc.clicks}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-serif text-lg font-semibold mb-3 text-blue-700">Recent Events</h3>
        <div className="bg-white border border-gray-200 rounded max-h-72 overflow-y-auto">
          {recent.length === 0 ? (
            <div className="px-5 py-6 text-center text-black text-sm font-sans">No events recorded yet.</div>
          ) : recent.map((ev) => (
            <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5 text-xs font-sans border-b border-gray-100">
              <span className={`w-2 h-2 rounded-full shrink-0 ${ev.eventType === "view" ? "bg-blue-300" : "bg-blue-600"}`} />
              <span className="text-black w-36 shrink-0">
                {new Date(ev.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-black">{ev.eventType}</span>
              <span className="text-blue-700">·</span>
              <span className="text-black truncate">{ev.contentType} — {ev.contentId}</span>
              {ev.location && (
                <>
                  <span className="text-blue-700">·</span>
                  <span className="text-black shrink-0 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-700" />{ev.location.city}, {ev.location.countryCode}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white border border-gray-200 rounded p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded flex items-center justify-center bg-blue-100 text-blue-700">{icon}</div>
      <div>
        <p className="text-2xl font-serif font-bold text-black">{value}</p>
        <p className="text-xs text-blue-700 font-sans uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}
