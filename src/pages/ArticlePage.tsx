import { useEffect, useMemo, useState } from "react";
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
  /^add your (first|second|third|fourth)\s+hero story$
