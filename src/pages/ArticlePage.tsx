import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  findContentByIdentifier,
  getArticles,
  getHeroes,
  getPublishedContentSnapshot,
  slugifyText,
} from "@/lib/content-store";
import type { ArticleBodyBlock, AdSlot } from "@/lib/content-store";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import AdPlacement from "@/components/editorial/AdPlacement";
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

function getSecondaryImageLayoutClasses(content: { secondaryImageWidth?: "small" | "medium" | "large" | "full"; secondaryImageAlign?: "left" | "center" | "right" }) {
  const width = content.secondaryImageWidth || "full";
  const align = content.secondaryImageAlign || "center";
  const widthClassMap = { small: "w-full md:w-1/2", medium: "w-full md:w-2/3", large: "w-full md:w-5/6", full: "w-full" } as const;
  const alignClassMap = { left: "mr-auto", center: "mx-auto", right: "ml-auto" } as const;
  return `${widthClassMap[width]} ${alignClassMap[align]}`;
}

function getAdPlacementClasses(placement?: AdSlot["placement"]): string {
  switch (placement) {
    case "mid-left":
      return "float-left mr-6 mb-4 w-full max-w-xs clear-left";
    case "mid-right":
      return "float-right ml-6 mb-4 w-full max-w-xs clear-right";
   case "bottom-left":
      return "mr-auto";
    case "bottom-right":
      return "ml-auto";
    case "bottom-center":
    case "top":
    case "center":
    default:
      return "mx-auto";
  }
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
    const article = findContentByIdentifier(publishedArticles, id || "");
    const heroAsArticle = !article ? findContentByIdentifier(publishedHeroes, id || "") : undefined;
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
      secondaryImageAlign: heroAsArticle.secondaryImageAlign,
      secondaryImageWidth: heroAsArticle.secondaryImageWidth,
      videoUrl: heroAsArticle.videoUrl,
      author: heroAsArticle.author || "The Magorium Staff",
      date: heroAsArticle.date,
      body: (heroAsArticle.body
