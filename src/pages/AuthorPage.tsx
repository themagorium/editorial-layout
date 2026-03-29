import { Link, useParams } from "react-router-dom";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import { buildContentPath, getArticles, getHeroes, slugifyText } from "@/lib/content-store";
import { applyAuthorSeo } from "@/lib/seo";
import { useEffect, useMemo } from "react";

type StorySummary = {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  category: string;
  author: string;
};

export function normalizeAuthor(author: string) {
  const normalized = author.trim();
  if (!normalized) return "The Magorium Editorial Staff";
  const slug = slugifyText(normalized);
  const isStaffAlias =
    slug === "magorium" ||
    slug === "the-magorium" ||
    slug === "staff" ||
    slug === "the-magorium-staff" ||
    slug === "magorium-staff" ||
    slug === "the-magorium-editorial-staff";
  if (isStaffAlias) return "The Magorium Editorial Staff";
  return normalized;
}

export default function AuthorPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const allStories = useMemo<StorySummary[]>(() => {
    const articles = getArticles().map((a) => ({
      id: a.id,
      title: a.title,
      excerpt: a.excerpt,
      imageUrl: a.imageUrl,
      date: a.date,
      category: a.category,
      author: normalizeAuthor(a.author),
    }));

    const heroes = getHeroes().map((h) => ({
      id: h.id,
      title: h.title,
      excerpt: h.excerpt || h.subtitle,
      imageUrl: h.imageUrl,
      date: h.date,
      category: h.category,
      author: normalizeAuthor(h.author || "The Magorium Staff"),
    }));

    return [...articles, ...heroes];
  }, []);

  const authorName = useMemo(() => {
    const direct = allStories.find((s) => slugifyText(s.author) === slug)?.author;
    return direct || "The Magorium Editorial Staff";
  }, [allStories, slug]);

  const stories = useMemo(() => {
    const targetSlug = slugifyText(authorName);
    return allStories
      .filter((s) => slugifyText(s.author) === targetSlug)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [allStories, authorName]);

  useEffect(() => {
    applyAuthorSeo(authorName, stories.length);
  }, [authorName, stories.length]);

  return (
    <div className="min-h-screen bg-background">
      <EditorialHeader />
      <section className="container mx-auto px-4 py-12">
        <Link to="/archive" className="text-xs font-sans text-muted-foreground hover:text-primary transition-colors">
          ← Back to Archive
        </Link>
        <h1 className="font-editorial text-4xl md:text-5xl mt-4 text-foreground">{authorName}</h1>
        <p className="text-sm text-muted-foreground font-sans mt-3">
          {stories.length} published {stories.length === 1 ? "story" : "stories"} on The Magorium
        </p>

        {stories.length === 0 ? (
          <p className="text-sm text-muted-foreground font-sans mt-10">
            No stories found for this contributor yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            {stories.map((story) => (
              <Link
                key={story.id}
                to={buildContentPath(story.id, story.title)}
                className="group border border-border rounded overflow-hidden hover:border-primary transition-colors"
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={story.imageUrl}
                    alt={story.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <span className="category-pill text-[10px]">{story.category}</span>
                  <h2 className="font-editorial text-xl mt-2 group-hover:text-primary transition-colors">
                    {story.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{story.excerpt}</p>
                  <p className="text-xs text-muted-foreground mt-3">
                    {new Date(story.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
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
