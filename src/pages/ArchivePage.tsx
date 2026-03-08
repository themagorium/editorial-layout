import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import ArticleCard from "@/components/editorial/ArticleCard";
import { getArticles, getHeroes, getEditions, formatEditionLabel } from "@/lib/content-store";
import type { Article, HeroItem } from "@/lib/content-store";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, BookOpen } from "lucide-react";

interface Volume {
  key: string;
  label: string;
  heroes: HeroItem[];
  articles: Article[];
}

function buildVolumes(): Volume[] {
  const allHeroes = getHeroes();
  const allArticles = getArticles();
  const editions = getEditions();

  return editions.map((ed) => ({
    key: ed,
    label: formatEditionLabel(ed),
    heroes: allHeroes.filter((h) => h.edition === ed).slice(0, 3),
    articles: allArticles.filter((a) => a.edition === ed).slice(0, 4),
  }));
}

export default function ArchivePage() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category") || "";
  const [search, setSearch] = useState(categoryFilter);
  const [expandedVolume, setExpandedVolume] = useState<string | null>(null);

  const volumes = useMemo(() => buildVolumes(), []);

  const filtered = useMemo(() => {
    if (!search.trim()) return volumes;
    const q = search.toLowerCase();
    return volumes.filter(
      (v) =>
        v.label.toLowerCase().includes(q) ||
        v.articles.some(
          (a) =>
            a.title.toLowerCase().includes(q) ||
            a.category.toLowerCase().includes(q) ||
            a.author.toLowerCase().includes(q)
        ) ||
        v.heroes.some(
          (h) =>
            h.title.toLowerCase().includes(q) ||
            h.category.toLowerCase().includes(q)
        )
    );
  }, [search, volumes]);

  return (
    <div className="min-h-screen bg-background">
      <EditorialHeader />

      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-3">
            <span className="text-primary">Archive</span>
          </h2>
          <p className="text-muted-foreground font-sans text-sm tracking-wide">
            Browse every volume by month. Search by date, title, category, or author.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-lg mx-auto mb-12 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search volumes — e.g. Feb 2026, Travel, Monaco…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Volume list */}
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground font-sans">No volumes match your search.</p>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {filtered.map((vol) => {
              const isOpen = expandedVolume === vol.key;

              return (
                <div key={vol.key} className="border border-border rounded overflow-hidden">
                  {/* Volume header */}
                  <button
                    onClick={() => setExpandedVolume(isOpen ? null : vol.key)}
                    className="w-full flex items-center justify-between px-6 py-5 bg-card hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-serif text-xl font-semibold text-foreground">
                          {vol.label}
                        </h3>
                        <p className="text-xs text-muted-foreground font-sans mt-0.5">
                          {vol.heroes.length} hero{vol.heroes.length !== 1 ? "es" : ""} · {vol.articles.length} article{vol.articles.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
                    />
                  </button>

                  {/* Expanded content */}
                  {isOpen && (
                    <div className="px-6 py-6 bg-background border-t border-border">
                      {vol.heroes.length > 0 && (
                        <div className="mb-6">
                          <h4 className="category-pill text-[10px] mb-4 inline-block">Heroes</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {vol.heroes.map((h) => (
                              <div key={h.id} className="group relative overflow-hidden rounded aspect-[16/9]">
                                <img
                                  src={h.imageUrl}
                                  alt={h.title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 article-overlay" />
                                <div className="absolute bottom-3 left-3 right-3">
                                  <span className="category-pill text-[9px] mb-1 inline-block">{h.category}</span>
                                  <h5 className="font-serif text-sm font-semibold text-foreground leading-snug">
                                    {h.title}
                                  </h5>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {vol.articles.length > 0 && (
                        <div>
                          <h4 className="category-pill text-[10px] mb-4 inline-block">Editor's Picks</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {vol.articles.map((a) => (
                              <ArticleCard key={a.id} article={a} variant="small" />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <EditorialFooter />
    </div>
  );
}
