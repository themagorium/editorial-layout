import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import {
  buildContentPath,
  getPublishedContentSnapshot,
  slugifyText,
  type Article,
  type HeroItem,
} from "@/lib/content-store";
import { applyCollectionSeo, canonicalAuthorName, getAuthorPath } from "@/lib/seo";
import { useSyncPublishedContent } from "@/hooks/useSyncPublishedContent";

type CategoryStory = {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  category: string;
  author: string;
  path: string;
};

function normalizeCategoryLabel(raw: string): string {
  const slug = slugifyText(raw || "");
  const aliases: Record<string, string> = {
    "art": "Art & Design",
    "art-design": "Art & Design",
    "polo": "Equestrian",
    "horse": "Equestrian",
    "horses": "Equestrian",
    "wellbeing": "Wellness",
  };
  if (aliases[slug]) return aliases[slug];
  return (raw || "")
    .replace(/-/g, " ")
    .trim()
    .replace(/\b\w/g, (token) => token.toUpperCase());
}

function mapHero(hero: HeroItem): CategoryStory {
  return {
    id: hero.id,
    title: hero.title,
    excerpt: hero.excerpt || hero.subtitle,
    imageUrl: hero.imageUrl,
    date: hero.date,
    category: hero.category,
    author: canonicalAuthorName(hero.author),
    path: buildContentPath(hero.id, hero.title),
  };
}

function mapArticle(article: Article): CategoryStory {
  return {
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    imageUrl: article.imageUrl,
    date: article.date,
    category: article.category,
    author: canonicalAuthorName(article.author),
    path: buildContentPath(article.id, article.title),
  };
}

export default function CategoryPage() {
  useSyncPublishedContent();
  const { slug = "" } = useParams<{ slug: string }>();
  const normalizedLabel = normalizeCategoryLabel(slug);
  const [stories, setStories] = useState<CategoryStory[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const snapshot = await getPublishedContentSnapshot();
      if (!active) return;
      const allStories = [...snapshot.heroes.map(mapHero), ...snapshot.articles.map(mapArticle)];
      const normalizedSlug = slugifyText(normalizedLabel);
      const filtered = allStories
        .filter((story) => slugifyText(story.category) === normalizedSlug)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date));

      setStories(filtered);
      setLoaded(true);
      applyCollectionSeo(
        `${normalizedLabel} | ${filtered.length > 0 ? filtered[0].author : "Category"} | The Magorium`,
        `Browse ${normalizedLabel} stories on The Magorium with credited writers and journalists.`,
        `/category/${slugifyText(normalizedLabel)}`,
      );
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
  }, [normalizedLabel]);

  return (
    <div className="min-h-screen bg-background">
      <EditorialHeader />
      <main className="container mx-auto px-4 py-10">
        <Link to="/archive" className="text-xs font-sans text-muted-foreground hover:text-primary transition-colors">
          ← Back to Archive
        </Link>
        <h1 className="font-editorial text-4xl md:text-5xl mt-4 text-foreground">{normalizedLabel}</h1>
        <p className="text-sm text-muted-foreground font-sans mt-3">
          {stories.length} published {stories.length === 1 ? "story" : "stories"} in {normalizedLabel}
        </p>

        {!loaded ? (
          <p className="text-sm text-muted-foreground font-sans mt-10">Loading stories...</p>
        ) : stories.length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans mt-10">
            No stories found in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            {stories.map((story) => (
              <article key={story.id} className="group border border-border rounded overflow-hidden hover:border-primary transition-colors">
                <Link to={story.path}>
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <span className="category-pill text-[10px]">{story.category}</span>
                  <Link to={story.path} className="block">
                    <h2 className="font-editorial text-xl mt-2 group-hover:text-primary transition-colors">
                      {story.title}
                    </h2>
                  </Link>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{story.excerpt}</p>
                  <p className="text-xs mt-3 text-muted-foreground">
                    Written by{" "}
                    <Link to={getAuthorPath(story.author)} className="text-primary hover:underline">
                      {story.author}
                    </Link>
                    {" · "}
                    {new Date(story.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <EditorialFooter />
    </div>
  );
}
