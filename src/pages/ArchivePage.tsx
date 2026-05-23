import { useMemo, useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import { getPublishedContentSnapshot, formatEditionLabel } from "@/lib/content-store";
import { Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { applyCollectionSeo, applyHomeSeo } from "@/lib/seo";
import { useSyncPublishedContent } from "@/hooks/useSyncPublishedContent";

const PLACEHOLDER_TITLE_PATTERN = /^new\s+(hero|article)(\s+\d+)?$/i;
const PLACEHOLDER_COPY_PATTERNS = [
  /^add your first hero story$/i,
  /^add your first article$/i,
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

function isPublishReadyTitle(title?: string): boolean {
  const normalized = (title || "").trim();
  if (!normalized) return false;
  return !PLACEHOLDER_TITLE_PATTERN.test(normalized);
}

function normalizeCardImageUrl(value?: string): string {
  const normalized = (value || "").trim();
  if (!normalized) return "";
  if (normalized === "undefined" || normalized === "null") return "";
  if (normalized.startsWith("blob:")) return "";
  if (normalized.includes("/favicon.png") || normalized.includes("/og-image.jpg")) return "";
  return normalized;
}

function firstBodyImageUrl(body?: Array<{ type?: string; content?: string }>): string {
  if (!Array.isArray(body)) return "";
  for (const block of body) {
    if (!block || block.type !== "image") continue;
    const normalized = normalizeCardImageUrl(block.content);
    if (normalized) return normalized;
  }
  return "";
}

function resolveStoryCardImage(story: { imageUrl?: string; body?: Array<{ type?: string; content?: string }> }): string {
  return normalizeCardImageUrl(story.imageUrl) || firstBodyImageUrl(story.body);
}

export default function ArchivePage() {
  useSyncPublishedContent();
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category") || "";
  const [search, setSearch] = useState(categoryFilter);
  const [editions, setEditions] = useState<Array<{
    key: string;
    label: string;
    heroCount: number;
    articleCount: number;
    coverImage?: string;
    searchableText: string;
  }>>([]);

  useEffect(() => {
    let active = true;
    getPublishedContentSnapshot().then((snapshot) => {
      if (!active) return;
      const editionKeys = new Set<string>();
      snapshot.heroes.forEach((h) => editionKeys.add(h.edition));
      snapshot.articles.forEach((a) => editionKeys.add(a.edition));

      const nextEditions = Array.from(editionKeys)
        .sort()
        .reverse()
        .map((ed) => {
          const heroes = snapshot.heroes.filter(
            (h) => h.edition === ed && isPublishReadyTitle(h.title) && !isPlaceholderCopy(h.subtitle),
          );
          const articles = snapshot.articles.filter(
            (a) => a.edition === ed && isPublishReadyTitle(a.title) && !isPlaceholderCopy(a.excerpt),
          );
          if (heroes.length === 0 && articles.length === 0) {
            return null;
          }
          const searchableText = [
            ed,
            formatEditionLabel(ed),
            ...heroes.map((h) => `${h.title} ${h.category}`),
            ...articles.map((a) => `${a.title} ${a.category} ${a.author}`),
          ]
            .join(" ")
            .toLowerCase();

          const coverImage = [...heroes, ...articles]
            .map((story) => resolveStoryCardImage(story))
            .find(Boolean);

          return {
            key: ed,
            label: formatEditionLabel(ed),
            heroCount: heroes.slice(0, 3).length,
            articleCount: articles.slice(0, 4).length,
            coverImage,
            searchableText,
          };
        })
        .filter((edition): edition is NonNullable<typeof edition> => Boolean(edition));

      setEditions(nextEditions);
    });

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return editions;
    const q = search.toLowerCase();
    return editions.filter((e) => e.searchableText.includes(q));
  }, [search, editions]);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    if (q === "magorium" || q === "the magorium" || q === "magorum") {
      applyHomeSeo();
      return;
    }

    if (q === "millie sealana" || q === "charlotte thames" || q === "staff" || q === "the magorium") {
      applyCollectionSeo(
        `Stories by ${search.trim()} | The Magorium`,
        `Explore The Magorium stories by ${search.trim()}.`,
        `/archive?category=${encodeURIComponent(search.trim())}`,
      );
      return;
    }

    applyCollectionSeo(
      "Archive | The Magorium",
      "Browse The Magorium archive by edition, author, and category.",
      "/archive",
    );
  }, [search]);

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
