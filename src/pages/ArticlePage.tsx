import { useParams, Link } from "react-router-dom";
import { buildContentPath, contentIdentifierMatches, getArticles, getHeroes, resetToDefaults } from "@/lib/content-store";
import type { ArticleBodyBlock } from "@/lib/content-store";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import { ArrowLeft } from "lucide-react";
import { applyArticleSeo } from "@/lib/seo";
import { useEffect } from "react";

const TEXT_PLACEHOLDERS = new Set([
  "Add story text",
  "Add first body paragraph",
  "Add second body paragraph",
  "Add third body paragraph",
]);

const CAPTION_PLACEHOLDERS = new Set([
  "Upload photo or video",
  "Featured image",
  "Featured video",
]);

function isMeaningfulText(value?: string) {
  const trimmed = (value || "").trim();
  if (!trimmed) return false;
  return !TEXT_PLACEHOLDERS.has(trimmed);
}

function isMeaningfulCaption(value?: string) {
  const trimmed = (value || "").trim();
  if (!trimmed) return false;
  return !CAPTION_PLACEHOLDERS.has(trimmed);
}

function hasRealBodyContent(block: ArticleBodyBlock) {
  if (block.type === "text" || block.type === "heading") {
    return isMeaningfulText(block.content);
  }
  if (block.type === "image" || block.type === "video") {
    return Boolean((block.content || "").trim());
  }
  return false;
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  let articles = getArticles();
  let heroes = getHeroes();
  let article = articles.find((a) => contentIdentifierMatches(a, id || ""));

  // Also search heroes — they share the same article detail page
  let heroAsArticle = !article ? heroes.find((h) => contentIdentifierMatches(h, id || "")) : undefined;

  // If not found in either, reset localStorage and retry
  if (!article && !heroAsArticle) {
    resetToDefaults();
    articles = getArticles();
    heroes = getHeroes();
    article = articles.find((a) => contentIdentifierMatches(a, id || ""));
    heroAsArticle = !article ? heroes.find((h) => contentIdentifierMatches(h, id || "")) : undefined;
  }

  // Normalize hero into article-like shape for rendering
  const content = article || (heroAsArticle ? {
    id: heroAsArticle.id,
    title: heroAsArticle.title,
    excerpt: heroAsArticle.excerpt || heroAsArticle.subtitle,
    category: heroAsArticle.category,
    imageUrl: heroAsArticle.imageUrl,
    videoUrl: heroAsArticle.videoUrl,
    author: heroAsArticle.author || "The Magorium",
    date: heroAsArticle.date,
    body: (heroAsArticle.body || []) as ArticleBodyBlock[],
    edition: heroAsArticle.edition,
  } : undefined);

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

  useEffect(() => {
    applyArticleSeo(content);
  }, [content.author, content.date, content.excerpt, content.id, content.imageUrl, content.title]);

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
          {content.body && content.body.filter(hasRealBodyContent).length > 0 ? (
            content.body.filter(hasRealBodyContent).map((block) => <BodyBlock key={block.id} block={block} />)
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
  const styledTextClass = [
    block.textStyle === "bold" || block.textStyle === "bold-italic"
      ? "font-semibold text-foreground"
      : "text-foreground/90",
    block.textStyle === "italic" || block.textStyle === "bold-italic" ? "italic font-serif" : "",
  ].join(" ");

  if (block.type === "heading") {
    const headingClass = [
      "font-editorial text-2xl md:text-3xl text-foreground mt-10 mb-4 leading-tight",
      block.textStyle === "bold" ? "font-bold" : "font-semibold",
      block.textStyle === "italic" || block.textStyle === "bold-italic" ? "italic" : "",
      block.textStyle === "bold-italic" ? "font-bold" : "",
    ].join(" ");

    return (
      <h2 className={headingClass}>
        {block.content}
      </h2>
    );
  }

  if (block.type === "text") {
    return (
      <div
        className={`font-sans text-base md:text-lg leading-relaxed whitespace-pre-wrap ${styledTextClass}`}
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
          {isMeaningfulCaption(block.caption) ? (
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
          {isMeaningfulCaption(block.caption) ? (
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
