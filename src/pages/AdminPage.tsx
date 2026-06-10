import { useState, useEffect, useRef, useMemo } from "react";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import ArticleBodyEditor from "@/components/editorial/ArticleBodyEditor";
import {
  getHeroes,
  getArticles,
  getAds,
  saveHeroes,
  saveArticles,
  saveAds,
  publishEditorialContent,
  getPublishedContentSnapshot,
  DEFAULT_PUBLISHED_CONTENT,
  resetToDefaults,
  clearLocalDraftStorage,
  isStorageQuotaExceededError,
  CATEGORIES,
  formatEditionLabel,
} from "@/lib/content-store";
import type { HeroItem, Article, AdSlot, Category, ArticleBodyBlock } from "@/lib/content-store";
import {
  Trash2,
  Plus,
  Upload,
  RotateCcw,
  Image,
  Video,
  BarChart3,
  Eye,
  MousePointer,
  TrendingUp,
  MapPin,
  Globe,
  Calendar,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAnalyticsSummary,
  getTotalStats,
  getRecentEvents,
  getLocationStats,
  clearAnalytics,
} from "@/lib/analytics";
import {
  getAdminPublishToken,
  isAdminAuthenticated,
  setAdminPublishToken,
  setAdminAuthenticated,
  resetAdminPasswordAccess,
} from "@/lib/admin-auth";
import { fileToOptimizedDataUrl } from "@/lib/media-optimizer";

const STORAGE_KEY = "magorium_page_content";

function getEditionsFromState(heroes: HeroItem[], articles: Article[]): string[] {
  const editions = new Set<string>();
  heroes.forEach((h) => editions.add(h.edition));
  articles.forEach((a) => editions.add(a.edition));
  return Array.from(editions).sort().reverse();
}

function createOctoberPatternBody(seed: string): ArticleBodyBlock[] {
  return [
    { id: `${seed}-t1`, type: "text", content: "Add first body paragraph" },
    { id: `${seed}-m1`, type: "image", content: "", imageAlign: "center", imageWidth: "full", caption: "Upload photo or video" },
    { id: `${seed}-t2`, type: "text", content: "Add second body paragraph" },
    { id: `${seed}-m2`, type: "image", content: "", imageAlign: "center", imageWidth: "full", caption: "Upload photo or video" },
    { id: `${seed}-t3`, type: "text", content: "Add third body paragraph" },
    { id: `${seed}-m3`, type: "image", content: "", imageAlign: "center", imageWidth: "full", caption: "Upload photo or video" },
  ];
}

function parseSeoTagsInput(value: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  value.split(",").map((token) => token.replace(/\s+/g, " ").trim()).filter(Boolean).forEach((token) => {
    const key = token.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    tags.push(token);
  });
  return tags.slice(0, 25);
}

type EditableContentPayload = { heroes: HeroItem[]; articles: Article[]; ads: AdSlot[] };

type PageContent = {
  editorsLetter: { quote: string; body1: string; body2: string; body3: string; signoff: string; logoUrl: string };
  about: { heading: string; body: string };
  masthead: { editorInChief: string; contributors: string; contact: string };
  contributors: { logoUrl: string; images: string[] };
  partnerships: { logoUrl: string; images: string[] };
};

const DEFAULT_PAGE_CONTENT: PageContent = {
  editorsLetter: {
    quote: "The world is full of extraordinary things quietly waiting for our wits to grow sharper.",
    body1: "Welcome to The Magorium — a private-view journal for those who believe luxury is not a price point but a perspec
