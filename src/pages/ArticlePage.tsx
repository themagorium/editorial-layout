import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPublishedContentSnapshot } from "@/lib/content-store";
import type { ArticleBodyBlock } from "@/lib/content-store";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import { ArrowLeft } from "lucide-react";

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const decodedIdentifier = decodeURIComponent(id || "");
  const normalizedIdentifier = decodedIdentifier
    .trim()
    .toLowerCase()
    .split("?")[0]
    .split("#")[0]
    .replace(/^\/+|\/+$/g, "");
  const routeCandidate = normalizedIdentifier.split("/").pop() || normalizedIdentifier;
  const slugTail = routeCandidate.includes("--") ? routeCandidate.split("--").pop() || routeCandidate : routeCandidate;
  const [content, setContent] = useState<{
    id: string;
    title: string;
    excerpt: string;
    category: string;
    imageUrl: string;
    videoUrl?: string;
    author: string;
    date: string;
    body?: ArticleBodyBlock[];
    edition: string;
  } | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    getPublishedContentSnapshot()
      .then((snapshot) => {
        if (!active) return;
        const article = snapshot.articles.find((a) => {
          const itemId = a.id.toLowerCase();
          return itemId === routeCandidate || itemId === slugTail;
        });
        const heroAsArticle = article
          ? undefined
          : snapshot.heroes.find((h) => {
            const itemId = h.id.toLowerCase();
            return itemId === routeCandidate || itemId === slugTail;
          });
        const normalized = article || (heroAsArticle ? {
          id: heroAsArticle.id,
          title: heroAsArticle.title,
          excerpt: heroAsArticle.subtitle,
          category: heroAsArticle.category,
          imageUrl: heroAsArticle.imageUrl,
          videoUrl: heroAsArticle.videoUrl,
          author: heroAsArticle.author || "The Magorium",
          date: heroAsArticle.date,
          body: (heroAsArticle.body || []) as ArticleBodyBlock[],
          edition: heroAsArticle.edition,
        } : undefined);
        setContent(normalized);
        setLoaded(true);
      })
      .catch(() => {
        if (!active) return;
        setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [routeCandidate, slugTail]);

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background">
        <EditorialHeader />
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground font-sans">Loading...</div>
        <EditorialFooter />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background">
        <EditorialHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="font-serif text-3xl text-foreground mb-4">Article Not Found</h2>
          <Link to="/" className="text-primary hover:underline font-sans text-sm">← Back to home</Link>
        </div>
        <EditorialFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EditorialHeader />

      {/* Hero image */}
      <div className="relative w-full aspect-[21/9] max-h-[500px] overflow-hidden">
        <img src={content.imageUrl} alt={content.title} className="w-full h-full object-cover" />
        <div className="article-overlay absolute inset-0" />
      </div>

      <article className="container mx-auto px-4 max-w-3xl py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-sans mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to stories
        </Link>

        <span className="category-pill mb-4 block w-fit">{content.category}</span>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mt-3">
          {content.title}
        </h1>
        <p className="font-sans text-lg text-muted-foreground mt-4">{content.excerpt}</p>
        <div className="flex items-center gap-3 mt-6 text-sm font-sans text-muted-foreground border-b border-border pb-6">
          <span className="font-medium text-foreground">{content.author}</span>
          <span className="text-primary">·</span>
          <span>{new Date(content.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
        </div>

        {/* Article body blocks */}
        <div className="mt-10 space-y-8">
          {content.body && content.body.length > 0 ? (
            content.body.map((block) => <BodyBlock key={block.id} block={block} />)
          ) : (
            <p className="font-sans text-muted-foreground text-base leading-relaxed italic">
              Full article content coming soon...
            </p>
          )}
        </div>
      </article>

      <EditorialFooter />
    </div>
  );
}

function BodyBlock({ block }: { block: ArticleBodyBlock }) {
  if (block.type === "text") {
    return (
      <div
        className="font-sans text-base md:text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap"
      >
        {block.content}
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <figure className="my-8 relative">
        <img src={block.content} alt={block.caption || ""} className="w-full rounded" loading="lazy" />
        <div className="flex items-start justify-between mt-2 gap-4">
          {block.caption ? (
            <figcaption className="font-sans text-xs text-muted-foreground italic">{block.caption}</figcaption>
          ) : <span />}
          {block.citation && (
            <span className="font-sans text-[10px] text-muted-foreground/70 whitespace-nowrap">{block.citation}</span>
          )}
        </div>
      </figure>
    );
  }

  if (block.type === "video") {
    return (
      <figure className="my-8 relative">
        <video src={block.content} controls className="w-full rounded" />
        <div className="flex items-start justify-between mt-2 gap-4">
          {block.caption ? (
            <figcaption className="font-sans text-xs text-muted-foreground italic">{block.caption}</figcaption>
          ) : <span />}
          {block.citation && (
            <span className="font-sans text-[10px] text-muted-foreground/70 whitespace-nowrap">{block.citation}</span>
          )}
        </div>
      </figure>
    );
  }

  return null;
}
