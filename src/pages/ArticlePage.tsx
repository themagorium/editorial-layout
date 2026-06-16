import { useParams, Link } from "react-router-dom";
import {
  contentIdentifierMatches,
  getArticles,
  getHeroes,
  getPublishedContentSnapshot,
  slugifyText,
} from "@/lib/content-store";
import type { ArticleBodyBlock } from "@/lib/content-store";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import { ArrowLeft } from "lucide-react";
import { applyArticleSeo } from "@/lib/seo";
import { getFirstBodyImageUrl, getStoryCardImageUrl, STORY_IMAGE_FALLBACK } from "@/lib/story-media";
import { useSyncPublishedContent } from "@/hooks/useSyncPublishedContent";

const TEXT_PLACEHOLDER_PATTERNS = [
  /^add your (first|second|third|fourth)\s+hero story$/i,
  /^add your (first|second|third|fourth)\s+article$/i,
  /^add your .* story$/i,
  /^add your .* article$/i,
  /^add story text$/i,
  /^add (first|second|third|fourth) body paragraph$/i,
  /^upload photo or video$/i,
];

const CAPTION_PLACEHOLDERS = new Set([
  "Upload photo or video",
  "Featured image",
  "Featured video",
]);

const BLOCKED_IMAGE_PATTERNS = [
  /^\s*$/,
  /^undefined$/i,
  /^null$/i,
  /upload photo or video/i,
  /featured image/i,
  /featured video/i,
  /\/favicon\.png/i,
  /\/og-image\.jpg/i,
  /^blob:/i,
  /^data:image\/svg/i,
];

function isUsableImageUrl(url?: string): boolean {
  const trimmed = (url || "").trim();
  if (!trimmed) return false;
  return !BLOCKED_IMAGE_PATTERNS.some((p) => p.test(trimmed));
}

function isMeaningfulText(value?: string) {
  const trimmed = (value || "").trim();
  if (!trimmed) return false;
  return !TEXT_PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
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
  if (block.type === "image") {
    return isUsableImageUrl(block.content);
  }
  if (block.type === "video") {
    const content = (block.content || "").trim();
    if (!content) return false;
    if (/upload photo or video/i.test(content)) return false;
    return true;
  }
  return false;
}

function normalizeBylineAuthor(author?: string) {
  const normalized = (author || "").trim();
  if (!normalized) return "The Magorium Staff";
  if (/^magorium$/i.test(normalized)) return "The Magorium Staff";
  if (/^the\s+magorium$/i.test(normalized)) return "The Magorium Staff";
  if (/^(staff|editorial staff|the magorium editorial staff)$/i.test(normalized)) {
    return "The Magorium Staff";
  }
  return normalized;
}

function bylineCreditLabel(author?: string) {
  const normalized = normalizeBylineAuthor(author);
  if (/staff/i.test(normalized)) return "By The Magorium Editorial Staff";
  return `By ${normalized}`;
}

function getBodyImageLayoutClasses(block: ArticleBodyBlock) {
  const width = block.imageWidth || "full";
  const align = block.imageAlign || "center";
  const widthClassMap = { small: "w-full md:w-1/2", medium: "w-full md:w-2/3", large: "w-full md:w-5/6", full: "w-full" } as const;
  const alignClassMap = { left: "mr-auto", center: "mx-auto", right: "ml-auto" } as const;
  return `${widthClassMap[width]} ${alignClassMap[align]}`;
}

export default function ArticlePage() {
  useSyncPublishedContent();
  const { id } = useParams<{ id: string }>();
  const [contentLoaded, setContentLoaded] = useState(false);
  const [publishedArticles, setPublishedArticles] = useState(() => getArticles());
  const [publishedHeroes, setPublishedHeroes] = useState(() => getHeroes());

  useEffect(() => {
    let active = true;
    const hydratePublishedContent = async () => {
      try {
        const snapshot = await getPublishedContentSnapshot({ allowLocalDraft: false });
        if (!active) return;
        setPublishedArticles(snapshot.articles);
        setPublishedHeroes(snapshot.heroes);
      } finally {
        if (active) setContentLoaded(true);
      }
    };
    void hydratePublishedContent();
    return () => { active = false; };
  }, [id]);

  const content = useMemo(() => {
    const article = publishedArticles.find((a) => contentIdentifierMatches(a, id || ""));
    const heroAsArticle = !article ? publishedHeroes.find((h) => contentIdentifierMatches(h, id || "")) : undefined;
    if (article) return article;
    if (!heroAsArticle) return undefined;
    return {
      id: heroAsArticle.id,
      title: heroAsArticle.title,
      excerpt: heroAsArticle.excerpt || heroAsArticle.subtitle,
      seoTags: heroAsArticle.seoTags,
      category: heroAsArticle.category,
      imageUrl: heroAsArticle.imageUrl,
      secondaryImageUrl: heroAsArticle.secondaryImageUrl,
      secondaryImageCaption: heroAsArticle.secondaryImageCaption,
      secondaryImageCitation: heroAsArticle.secondaryImageCitation,
      videoUrl: heroAsArticle.videoUrl,
      author: heroAsArticle.author || "The Magorium Staff",
      date: heroAsArticle.date,
      body: (heroAsArticle.body || []) as ArticleBodyBlock[],
      edition: heroAsArticle.edition,
      sources: heroAsArticle.sources,
    };
  }, [publishedArticles, publishedHeroes, id]);

  useEffect(() => {
    if (!content) return;
    applyArticleSeo({ ...content, excerpt: isMeaningfulText(content.excerpt) ? content.excerpt : "" });
  }, [content]);

  if (!content) {
    return (
      <div className="min-h-screen bg-background">
        <EditorialHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="font-serif text-3xl text-foreground mb-4">
            {contentLoaded ? "Article Not Found" : "Loading story..."}
          </h2>
          <Link to="/" className="text-primary hover:underline font-sans text-sm">← Back to home</Link>
        </div>
        <EditorialFooter />
      </div>
    );
  }

  const secondaryImage = isUsableImageUrl(content.secondaryImageUrl) ? content.secondaryImageUrl : null;

  return (
    <div className="min-h-screen bg-background">
      <EditorialHeader />

      <div className="relative w-full aspect-[21/9] max-h-[500px] overflow-hidden">
        <img
          src={getStoryCardImageUrl(content.imageUrl, content.body)}
          alt={content.title}
          className="w-full h-full object-cover"
          onError={(event) => {
            const bodyImage = getFirstBodyImageUrl(content.body);
            if (bodyImage && event.currentTarget.src !== bodyImage) { event.currentTarget.src = bodyImage; return; }
            if (!event.currentTarget.src.endsWith(STORY_IMAGE_FALLBACK)) { event.currentTarget.src = STORY_IMAGE_FALLBACK; }
          }}
        />
        <div className="article-overlay absolute inset-0" />
      </div>

      <article className="container mx-auto px-4 max-w-3xl py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-sans mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to stories
        </Link>
        <span className="category-pill mb-4 block w-fit">{content.category}</span>
        <Link to={`/category/${slugifyText(content.category)}`} className="text-xs font-sans text-primary hover:underline">
          View all {content.category} stories
        </Link>
        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mt-3">
          {content.title}
        </h1>
        {isMeaningfulText(content.excerpt) && (
          <p className="font-sans text-lg text-muted-foreground mt-4">{content.excerpt}</p>
        )}
        <div className="flex items-center gap-3 mt-6 text-sm font-sans text-muted-foreground border-b border-border pb-6">
          <Link to={`/author/${slugifyText(normalizeBylineAuthor(content.author)) || "staff"}`} className="font-medium text-foreground hover:text-primary transition-colors">
            {bylineCreditLabel(content.author)}
          </Link>
          <span className="text-primary">·</span>
          <span>{new Date(content.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
        </div>

        {secondaryImage && (
          <figure className="my-8 w-full">
            <img
              src={secondaryImage}
              alt={content.secondaryImageCaption || content.title}
              className="w-full rounded object-cover"
              loading="eager"
              onError={(e) => { const fig = e.currentTarget.closest("figure"); if (fig) (fig as HTMLElement).style.display = "none"; }}
            />
            {(isMeaningfulCaption(content.secondaryImageCaption) || content.secondaryImageCitation) && (
              <div className="flex items-start justify-between mt-2 gap-4">
                {isMeaningfulCaption(content.secondaryImageCaption) && (
                  <figcaption className="font-sans text-xs text-muted-foreground italic">{content.secondaryImageCaption}</figcaption>
                )}
                {content.secondaryImageCitation && (
                  <span className="font-sans text-[10px] text-muted-foreground/70 whitespace-nowrap">{content.secondaryImageCitation}</span>
                )}
              </div>
            )}
          </figure>
        )}

        <div className="mt-10 space-y-8">
          {content.body && content.body.filter(hasRealBodyContent).length > 0
            ? content.body.filter(hasRealBodyContent).map((block) => <BodyBlock key={block.id} block={block} />)
            : null}
        </div>

        {content.sources && content.sources.trim() && (
          <div className="mt-12 pt-6 border-t border-border/30">
            <p className="font-sans text-[10px] text-muted-foreground/50 leading-relaxed tracking-wide">
              <span className="font-semibold text-muted-foreground/60 uppercase tracking-widest text-[9px]">Sources & Verification &nbsp;·&nbsp; </span>
              {content.sources}
            </p>
          </div>
        )}
      </article>

      <EditorialFooter />
    </div>
  );
}

function BodyBlock({ block }: { block: ArticleBodyBlock }) {
  const styledTextClass = [
    block.textStyle === "bold" || block.textStyle === "bold-italic" ? "font-semibold text-foreground" : "text-foreground/90",
    block.textStyle === "italic" || block.textStyle === "bold-italic" ? "italic font-serif" : "",
  ].join(" ");

  if (block.type === "heading") {
    const headingClass = [
      "font-editorial text-2xl md:text-3xl text-foreground mt-10 mb-4 leading-tight",
      block.textStyle === "bold" ? "font-bold" : "font-semibold",
      block.textStyle === "italic" || block.textStyle === "bold-italic" ? "italic" : "",
      block.textStyle === "bold-italic" ? "font-bold" : "",
    ].join(" ");
    return <h2 className={headingClass}>{block.content}</h2>;
  }

  if (block.type === "text") {
    return (
      <div className={`font-sans text-base md:text-lg leading-relaxed whitespace-pre-wrap ${styledTextClass}`}>
        {block.content}
      </div>
    );
  }

  if (block.type === "image") {
    const hasCaption = isMeaningfulCaption(block.caption);
    const hasCitation = Boolean(block.citation);
    return (
      <figure className={`my-8 relative ${getBodyImageLayoutClasses(block)}`}>
        <img
          src={block.content}
          alt={block.caption || ""}
          className="w-full rounded"
          loading="lazy"
          onError={(e) => { const fig = e.currentTarget.closest("figure"); if (fig) (fig as HTMLElement).style.display = "none"; }}
        />
        {(hasCaption || hasCitation) && (
          <div className="flex items-start justify-between mt-2 gap-4">
            {hasCaption ? <figcaption className="font-sans text-xs text-muted-foreground italic">{block.caption}</figcaption> : null}
            {hasCitation ? <span className="font-sans text-[10px] text-muted-foreground/70 whitespace-nowrap">{block.citation}</span> : null}
          </div>
        )}
      </figure>
    );
  }

  if (block.type === "video") {
    const hasCaption = isMeaningfulCaption(block.caption);
    const hasCitation = Boolean(block.citation);
    return (
      <figure className="my-8 relative">
        <video src={block.content} controls className="w-full rounded" />
        {(hasCaption || hasCitation) && (
          <div className="flex items-start justify-between mt-2 gap-4">
            {hasCaption ? <figcaption className="font-sans text-xs text-muted-foreground italic">{block.caption}</figcaption> : null}
            {hasCitation ? <span className="font-sans text-[10px] text-muted-foreground/70 whitespace-nowrap">{block.citation}</span> : null}
          </div>
        )}
      </figure>
    );
  }

  return null;
}
Stop copying here ↑
The first line must be import { useEffect and the last line must be } with nothing after it.Claude Fable 5 is currently unavailable.Learn more(opens in new tab)
Sonnet 4.6 Low
