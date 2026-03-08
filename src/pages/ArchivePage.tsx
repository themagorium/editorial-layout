import { useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import { getEditions, formatEditionLabel, getHeroesByEdition, getArticlesByEdition } from "@/lib/content-store";
import { Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function ArchivePage() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category") || "";
  const [search, setSearch] = useState(categoryFilter);

  const editions = useMemo(() => {
    return getEditions().map((ed) => ({
      key: ed,
      label: formatEditionLabel(ed),
      heroCount: getHeroesByEdition(ed).slice(0, 3).length,
      articleCount: getArticlesByEdition(ed).slice(0, 4).length,
      // Use first hero image as cover
      coverImage: getHeroesByEdition(ed)[0]?.imageUrl,
    }));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return editions;
    const q = search.toLowerCase();
    return editions.filter((e) => {
      if (e.label.toLowerCase().includes(q)) return true;
      const heroes = getHeroesByEdition(e.key);
      const articles = getArticlesByEdition(e.key);
      return (
        heroes.some((h) => h.title.toLowerCase().includes(q) || h.category.toLowerCase().includes(q)) ||
        articles.some((a) => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || a.author.toLowerCase().includes(q))
      );
    });
  }, [search, editions]);

  return (
    <div className="min-h-screen bg-background">
      <EditorialHeader />

      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="font-editorial text-4xl md:text-5xl font-bold text-foreground mb-3">
            <span className="text-primary">Archive</span>
          </h2>
          <p className="text-muted-foreground font-sans text-sm tracking-wide">
            Search by volume or category.
          </p>
        </div>

        <div className="max-w-lg mx-auto mb-12 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search volumes — e.g. February 2026, Travel, Fashion…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground font-sans">No volumes match your search.</p>
        ) : (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((ed) => (
              <Link
                key={ed.key}
                to={`/archive/${ed.key}`}
                className="group block border border-border rounded overflow-hidden hover:border-primary transition-colors"
              >
                {ed.coverImage && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={ed.coverImage}
                      alt={ed.label}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-5 bg-card">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <h3 className="font-editorial text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {ed.label}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground font-sans">
                    {ed.heroCount} heroes · {ed.articleCount} editor's picks
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <EditorialFooter />
    </div>
  );
}
