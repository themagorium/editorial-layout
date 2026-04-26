import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import {
  buildContentPath,
  formatEditionLabel,
  getPublishedContentSnapshot,
  type Article,
  type HeroItem,
} from "@/lib/content-store";
import {
  applyHomeSeo,
  applyMagoriumBrandSeo,
  canonicalAuthorName,
  getAuthorPath,
} from "@/lib/seo";
import { useSyncPublishedContent } from "@/hooks/useSyncPublishedContent";

type StoryFeedPageProps = {
  seoHint?: string;
  canonicalAliasPath?: string;
};

type StoryItem = {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  category: string;
  author: string;
  contentType: "hero" | "article";
};

function toHeroStoryItem(hero: HeroItem): StoryItem {
  return {
    id: hero.id,
    title: hero.title,
    excerpt: hero.subtitle,
    imageUrl: hero.imageUrl,
    date: hero.date,
    category: hero.category,
    author: canonicalAuthorName(hero.author),
    contentType: "hero",
  };
}

function toArticleStoryItem(article: Article): StoryItem {
  return {
    id: article.id,
    title: article.title,
    excerpt: article.excerpt,
    imageUrl: article.imageUrl,
    date: article.date,
    category: article.category,
    author: canonicalAuthorName(article.author),
    contentType: "article",
  };
}

export default function StoryFeedPage({
  seoHint,
  canonicalAliasPath = "/magorium",
}: StoryFeedPageProps) {
  useSyncPublishedContent();
  const [heroes, setHeroes] = useState<HeroItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [editionLabel, setEditionLabel] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const snapshot = await getPublishedContentSnapshot();
      if (!active) return;

      const editions = new Set<string>();
      snapshot.heroes.forEach((h) => editions.add(h.edition));
      snapshot.articles.forEach((a) => editions.add(a.edition));
      const latestEdition = Array.from(editions).sort().reverse()[0];

      const latestHeroes = latestEdition
        ? snapshot.heroes.filter((h) => h.edition === latestEdition).slice(0, 3)
        : snapshot.heroes.slice(0, 3);
      const latestArticles = latestEdition
        ? snapshot.articles.filter((a) => a.edition === latestEdition).slice(0, 8)
        : snapshot.articles.slice(0, 8);

      setHeroes(latestHeroes);
      setArticles(latestArticles);
      setEditionLabel(latestEdition ? formatEditionLabel(latestEdition) : "");
      const storyPaths = [...latestHeroes, ...latestArticles].map((item) =>
        buildContentPath(item.id, item.title),
      );
      setLoaded(true);
      applyHomeSeo(seoHint, storyPaths);
      applyMagoriumBrandSeo(canonicalAliasPath);
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
  }, [canonicalAliasPath, seoHint]);

  const stories = useMemo(() => {
    const mapped = [
      ...heroes.map(toHeroStoryItem),
      ...articles.map(toArticleStoryItem),
    ];
    return mapped.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [articles, heroes]);

  return (
    <div className="min-h-screen bg-background">
      <EditorialHeader />
      <main className="container mx-auto px-4 py-8">
        <h1 className="font-editorial text-3xl md:text-5xl text-foreground">
          Magorium Stories
        </h1>
        <p className="mt-3 text-sm text-muted-foreground font-sans">
          Latest hero features and editor picks from The Magorium
          {editionLabel ? ` · ${editionLabel} Edition` : ""}.
        </p>

        {!loaded ? (
          <p className="mt-10 text-sm text-muted-foreground font-sans">Loading stories...</p>
        ) : stories.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground font-sans">
            No stories available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
            {stories.map((story) => (
              <article key={`${story.contentType}:${story.id}`} className="border border-border rounded overflow-hidden">
                <Link to={buildContentPath(story.id, story.title)} className="group block">
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={story.imageUrl}
                      alt={story.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <span className="category-pill text-[10px]">{story.category}</span>
                    <h2 className="font-editorial text-lg mt-2 group-hover:text-primary transition-colors">
                      {story.title}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{story.excerpt}</p>
                  </div>
                </Link>
                <div className="px-4 pb-4 text-xs text-muted-foreground font-sans flex items-center gap-2">
                  <Link to={getAuthorPath(story.author)} className="text-primary hover:underline">
                    {story.author}
                  </Link>
                  <span className="text-primary">·</span>
                  <span>
                    {new Date(story.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
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
