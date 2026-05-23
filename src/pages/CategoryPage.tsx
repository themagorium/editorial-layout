import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import {
  buildContentPath,
  formatEditionLabel,
  getPublishedContentSnapshot,
  slugifyText,
  type Article,
  type HeroItem,
} from "@/lib/content-store";
import { applyCollectionSeo, canonicalAuthorName, getAuthorPath } from "@/lib/seo";
import { useSyncPublishedContent } from "@/hooks/useSyncPublishedContent";
import { getStoryCardImageUrl, STORY_IMAGE_FALLBACK } from "@/lib/story-media";

type CategoryStory = {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  edition: string;
  storyType: "hero" | "article";
  category: string;
  author: string;
  path: string;
};

type EditionBucket = {
  edition: string;
  label: string;
  storyCount: number;
  stories: CategoryStory[];
};

const PLACEHOLDER_TITLE_PATTERN = /^new\s+(hero|article)(\s+\d+)?$/i;
const PLACEHOLDER_COPY_PATTERNS = [
  /^add your (first|second|third|fourth)\s+hero story$/i,
  /^add your (first|second|third|fourth)\s+article$/i,
  /^add your .* story$/i,
  /^add your .* article$/i,
  /^add story text$/i,
  /^add first body paragraph$/i,
  /^add second body paragraph$/i,
  /^add third body paragraph$/i,
  /^upload photo or video$/i,
];

function isPlaceholderCopy(value?: string): boolean {
  const text = (value || "").trim();
  if (!text) return false;
  return PLACEHOLDER_COPY_PATTERNS.some((pattern) => pattern.test(text));
}

function isPublishReadyCategoryStory(story: CategoryStory): boolean {
  const title = (story.title || "").trim();
  if (!title) return false;
  if (PLACEHOLDER_TITLE_PATTERN.test(title)) return false;
  if (isPlaceholderCopy(story.excerpt)) return false;
  return true;
}

function editionSortWeight(edition: string): number {
  const normalized = (edition || "").trim();
  const direct = normalized.match(/^(\d{4})-(\d{1,2})$/);
  if (direct) {
    const year = Number.parseInt(direct[1], 10);
    const month = Number.parseInt(direct[2], 10);
    if (month >= 1 && month <= 12) return year * 100 + month;
  }
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.getUTCFullYear() * 100 + (parsed.getUTCMonth() + 1);
  }
  return Number.MIN_SAFE_INTEGER;
}

function compareStoryRecency(left: CategoryStory, right: CategoryStory): number {
  const leftEditionWeight = editionSortWeight(left.edition);
  const rightEditionWeight = editionSortWeight(right.edition);
  if (leftEditionWeight !== rightEditionWeight) return rightEditionWeight - leftEditionWeight;

  const leftDate = +new Date(left.date);
  const rightDate = +new Date(right.date);
  if (leftDate !== rightDate) return rightDate - leftDate;

  if (left.storyType !== right.storyType) {
    // Prefer article when both story variants exist.
    return left.storyType === "article" ? -1 : 1;
  }
  return left.id.localeCompare(right.id);
}

function normalizeVersionTokens(value: string): string {
  return value
    .toLowerCase()
    .replace(/artificial intelligence/g, "ai")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .filter((token) => !["the", "a", "an", "and", "of", "to", "for", "in"].includes(token))
    .join(" ");
}

function versionKeyForStory(story: CategoryStory): string {
  const titleKey = normalizeVersionTokens(story.title);
  if (titleKey) return `${slugifyText(story.category)}|${titleKey}`;
  const excerptKey = normalizeVersionTokens(story.excerpt).split(" ").slice(0, 10).join(" ");
  return `${slugifyText(story.category)}|${excerptKey}`;
}

function dedupeStoryVersions(stories: CategoryStory[]): CategoryStory[] {
  const byNewest = stories.slice().sort(compareStoryRecency);
  const seen = new Set<string>();
  const deduped: CategoryStory[] = [];

  byNewest.forEach((story) => {
    const key = versionKeyForStory(story);
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(story);
  });

  return deduped.sort(compareStoryRecency);
}

function normalizeCategoryLabel(raw: string): string {
  const slug = slugifyText(raw || "");
  const aliases: Record<string, string> = {
    "art": "Art & Design",
    "art-design": "Art & Design",
    "polo": "Equestrian",
    "horse": "Equestrian",
    "horses": "Equestrian",
    "wellbeing": "Wellness",
    "finance": "Finance/ Global Economy",
    "global-economy": "Finance/ Global Economy",
    "finance-global-economy": "Finance/ Global Economy",
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
    imageUrl: getStoryCardImageUrl(hero.imageUrl, hero.body),
    date: hero.date,
    edition: hero.edition,
    storyType: "hero",
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
    imageUrl: getStoryCardImageUrl(article.imageUrl, article.body),
    date: article.date,
    edition: article.edition,
    storyType: "article",
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
  const editionBuckets = useMemo<EditionBucket[]>(() => {
    const byEdition = new Map<string, CategoryStory[]>();
    stories.forEach((story) => {
      const key = story.edition || "unknown";
      const bucket = byEdition.get(key) || [];
      bucket.push(story);
      byEdition.set(key, bucket);
    });

    return Array.from(byEdition.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([edition, editionStories]) => ({
        edition,
        label: edition === "unknown" ? "Undated Edition" : formatEditionLabel(edition),
        storyCount: editionStories.length,
        stories: editionStories.sort((a, b) => +new Date(b.date) - +new Date(a.date)),
      }));
  }, [stories]);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const snapshot = await getPublishedContentSnapshot();
      if (!active) return;
      const allStories = [...snapshot.heroes.map(mapHero), ...snapshot.articles.map(mapArticle)];
      const normalizedSlug = slugifyText(normalizedLabel);
      const filtered = allStories
        .filter((story) => slugifyText(story.category) === normalizedSlug)
        .filter(isPublishReadyCategoryStory)
        .sort(compareStoryRecency);
      const deduped = dedupeStoryVersions(filtered);

      setStories(deduped);
      setLoaded(true);
      const editionCount = new Set(deduped.map((story) => story.edition).filter(Boolean)).size;
      applyCollectionSeo(
        `${normalizedLabel} Editions & Stories | The Magorium`,
        `Browse ${normalizedLabel} stories across ${editionCount || 0} editions on The Magorium.`,
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
        {loaded && editionBuckets.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {editionBuckets.map((bucket) => (
              <Link
                key={bucket.edition}
                to={bucket.edition === "unknown" ? "/archive" : `/archive/${bucket.edition}`}
                className="text-[11px] font-sans px-3 py-1 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
              >
                {bucket.label} ({bucket.storyCount})
              </Link>
            ))}
          </div>
        )}

        {!loaded ? (
          <p className="text-sm text-muted-foreground font-sans mt-10">Loading stories...</p>
        ) : stories.length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans mt-10">
            No stories found in this category yet.
          </p>
        ) : (
          <div className="space-y-12 mt-10">
            {editionBuckets.map((bucket) => (
              <section key={bucket.edition} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-editorial text-2xl md:text-3xl text-foreground">
                    {bucket.label}
                  </h2>
                  {bucket.edition !== "unknown" && (
                    <Link
                      to={`/archive/${bucket.edition}`}
                      className="text-xs font-sans text-primary hover:underline"
                    >
                      Open this edition →
                    </Link>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bucket.stories.map((story) => (
                    <article key={`${bucket.edition}:${story.storyType}:${story.id}`} className="group border border-border rounded overflow-hidden hover:border-primary transition-colors">
                      <Link to={story.path}>
                        <div className="aspect-[16/9] overflow-hidden">
                          <img
                            src={story.imageUrl}
                            alt={story.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            decoding="async"
                            sizes="(min-width: 768px) 50vw, 100vw"
                            onError={(event) => {
                              if (!event.currentTarget.src.endsWith(STORY_IMAGE_FALLBACK)) {
                                event.currentTarget.src = STORY_IMAGE_FALLBACK;
                              }
                            }}
                          />
                        </div>
                      </Link>
                      <div className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="category-pill text-[10px]">{story.category}</span>
                          <span className="text-[10px] font-sans uppercase tracking-wide text-muted-foreground">
                            {story.storyType === "hero" ? "Hero" : "Article"}
                          </span>
                        </div>
                        <Link to={story.path} className="block">
                          <h3 className="font-editorial text-xl mt-2 group-hover:text-primary transition-colors">
                            {story.title}
                          </h3>
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
              </section>
            ))}
          </div>
        )}
      </main>
      <EditorialFooter />
    </div>
  );
}
