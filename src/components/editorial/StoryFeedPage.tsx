import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import {
  buildContentPath,
  getCachedLatestPublishedEditionSnapshot,
  getLatestPublishedEditionSnapshot,
  formatEditionLabel,
  type Article,
  type HeroItem,
} from "@/lib/content-store";
import {
  applyHomeSeo,
  applyMagoriumBrandSeo,
  canonicalAuthorName,
  getCategoryPath,
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
  const [initialSnapshot] = useState(() =>
    getCachedLatestPublishedEditionSnapshot({ heroLimit: 3, articleLimit: 8 }),
  );
  const [heroes, setHeroes] = useState<HeroItem[]>(initialSnapshot.heroes);
  const [articles, setArticles] = useState<Article[]>(initialSnapshot.articles);
  const [editionLabel, setEditionLabel] = useState(
    initialSnapshot.latestEdition ? formatEditionLabel(initialSnapshot.latestEdition) : "",
  );
  const [loaded, setLoaded] = useState(
    initialSnapshot.heroes.length > 0 || initialSnapshot.articles.length > 0,
  );

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      try {
        const snapshot = await getLatestPublishedEditionSnapshot({ heroLimit: 3, articleLimit: 8 });
        if (!active) return;

        setHeroes(snapshot.heroes);
        setArticles(snapshot.articles);
        setEditionLabel(snapshot.latestEdition ? formatEditionLabel(snapshot.latestEdition) : "");
        const storyPaths = [...snapshot.heroes, ...snapshot.articles].map((item) =>
          buildContentPath(item.id, item.title),
        );
        setLoaded(true);
        applyHomeSeo(seoHint, storyPaths);
        applyMagoriumBrandSeo(canonicalAliasPath);
      } catch {
        if (!active) return;
        setLoaded(true);
      }
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
        <p className="mt-2 text-xs text-muted-foreground font-sans">
          <Link to="/seo-history" className="text-primary hover:underline">
            View writer SEO history
          </Link>
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
                  <Link to={getCategoryPath(story.category)} className="text-primary hover:underline">
                    {story.category}
                  </Link>
                  <span className="text-primary">·</span>
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
