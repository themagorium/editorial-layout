import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import {
  buildContentPath,
  getPublishedSeoContentSnapshot,
  type Article,
  type HeroItem,
} from "@/lib/content-store";
import { applySeoHistorySeo, canonicalAuthorName, getAuthorPath } from "@/lib/seo";

type SeoHistoryItem = {
  id: string;
  title: string;
  date: string;
  category: string;
  author: string;
  path: string;
  source: "hero" | "article";
};

function mapHero(hero: HeroItem): SeoHistoryItem {
  const author = canonicalAuthorName(hero.author);
  return {
    id: hero.id,
    title: hero.title,
    date: hero.date,
    category: hero.category,
    author,
    path: buildContentPath(hero.id, hero.title),
    source: "hero",
  };
}

function mapArticle(article: Article): SeoHistoryItem {
  const author = canonicalAuthorName(article.author);
  return {
    id: article.id,
    title: article.title,
    date: article.date,
    category: article.category,
    author,
    path: buildContentPath(article.id, article.title),
    source: "article",
  };
}

export default function SeoHistoryPage() {
  const [items, setItems] = useState<SeoHistoryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    applySeoHistorySeo();
  }, []);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const snapshot = await getPublishedSeoContentSnapshot();
      if (!active) return;
      const mapped = [...snapshot.heroes.map(mapHero), ...snapshot.articles.map(mapArticle)]
        .sort((a, b) => +new Date(b.date) - +new Date(a.date));
      setItems(mapped);
      applySeoHistorySeo(
        mapped.map((item) => item.path),
        Array.from(new Set(mapped.map((item) => item.author))),
      );
      setLoaded(true);
    };

    const handleSynced = () => {
      void hydrate();
    };

    void hydrate();
    window.addEventListener("magorium-content-synced", handleSynced);
    return () => {
      active = false;
      window.removeEventListener("magorium-content-synced", handleSynced);
    };
  }, []);

  const byAuthor = useMemo(() => {
    const grouped: Record<string, number> = {};
    items.forEach((item) => {
      grouped[item.author] = (grouped[item.author] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count || a.author.localeCompare(b.author));
  }, [items]);

  return (
    <div className="min-h-screen bg-background">
      <EditorialHeader />
      <main className="container mx-auto px-4 py-10">
        <h1 className="font-editorial text-3xl md:text-5xl text-foreground">SEO History Archive</h1>
        <p className="mt-3 text-sm text-muted-foreground font-sans">
          Every indexed Magorium story with visible writer and journalist credit.
        </p>

        <section className="mt-8">
          <h2 className="font-editorial text-2xl text-foreground">Contributor Credit Ledger</h2>
          {byAuthor.length === 0 && loaded ? (
            <p className="text-sm text-muted-foreground font-sans mt-3">No credited stories published yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {byAuthor.map((entry) => (
                <li key={entry.author} className="text-sm font-sans">
                  <Link to={getAuthorPath(entry.author)} className="text-primary hover:underline">
                    {entry.author}
                  </Link>
                  <span className="text-muted-foreground"> — {entry.count} credited {entry.count === 1 ? "story" : "stories"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-editorial text-2xl text-foreground">Story History</h2>
          {!loaded ? (
            <p className="text-sm text-muted-foreground font-sans mt-3">Loading history...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground font-sans mt-3">No stories available.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {items.map((item) => (
                <li key={`${item.source}:${item.id}`} className="border border-border rounded p-4">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-sans">
                    {item.source} · {item.category} · {new Date(item.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <Link to={item.path} className="block mt-1 font-editorial text-xl text-foreground hover:text-primary transition-colors">
                    {item.title}
                  </Link>
                  <p className="mt-2 text-sm font-sans text-muted-foreground">
                    Credited writer:{" "}
                    <Link to={getAuthorPath(item.author)} className="text-primary hover:underline">
                      {item.author}
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <EditorialFooter />
    </div>
  );
}
