import { useState, useEffect, useRef } from "react";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import {
  getHeroes, getArticles, getAds,
  saveHeroes, saveArticles, saveAds, resetToDefaults,
  CATEGORIES,
} from "@/lib/content-store";
import type { HeroItem, Article, AdSlot, Category } from "@/lib/content-store";
import { Trash2, Plus, Upload, RotateCcw, Image, Video } from "lucide-react";
import { toast } from "sonner";

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
  const [tab, setTab] = useState<"heroes" | "articles" | "ads">("heroes");

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
          {(["heroes", "articles", "ads"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-sans uppercase tracking-wider transition-colors border-b-2 ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "ads" ? "Advertising" : t}
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
      </div>
    </div>
  );
}

/* ---- Heroes Manager ---- */
function HeroesManager({ heroes, setHeroes }: { heroes: HeroItem[]; setHeroes: (h: HeroItem[]) => void }) {
  const addHero = () => {
    setHeroes([
      ...heroes,
      { id: `h-${Date.now()}`, title: "New Hero", subtitle: "", category: "Travel", imageUrl: "", date: new Date().toISOString().split("T")[0] },
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
      { id: `a-${Date.now()}`, title: "New Article", excerpt: "", category: "Travel", imageUrl: "", author: "", date: new Date().toISOString().split("T")[0] },
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
