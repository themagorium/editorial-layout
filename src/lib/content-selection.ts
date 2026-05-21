import type { Article, HeroItem } from "@/lib/content-store";
import { formatEditionLabel } from "@/lib/content-store";

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

export function isPublishReadyHero(hero: HeroItem): boolean {
  const title = (hero.title || "").trim();
  if (!title || PLACEHOLDER_TITLE_PATTERN.test(title)) return false;
  if (isPlaceholderCopy(hero.subtitle)) return false;
  return true;
}

export function isPublishReadyArticle(article: Article): boolean {
  const title = (article.title || "").trim();
  if (!title || PLACEHOLDER_TITLE_PATTERN.test(title)) return false;
  if (isPlaceholderCopy(article.excerpt)) return false;
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

function compareEditionDesc(left: string, right: string): number {
  const leftWeight = editionSortWeight(left);
  const rightWeight = editionSortWeight(right);
  if (leftWeight === rightWeight) return right.localeCompare(left);
  return rightWeight - leftWeight;
}

export function pickLatestReadyEdition(heroes: HeroItem[], articles: Article[]): string {
  const editions = Array.from(
    new Set([...heroes.map((hero) => hero.edition), ...articles.map((article) => article.edition)]),
  )
    .filter(Boolean)
    .sort(compareEditionDesc);

  for (const edition of editions) {
    const hasHero = heroes.some((hero) => hero.edition === edition && isPublishReadyHero(hero));
    const hasArticle = articles.some((article) => article.edition === edition && isPublishReadyArticle(article));
    if (hasHero || hasArticle) return edition;
  }

  return editions[0] || "";
}

export function selectFrontPageEditionContent(
  heroes: HeroItem[],
  articles: Article[],
  articleLimit: number,
) {
  const readyHeroes = heroes.filter(isPublishReadyHero);
  const readyArticles = articles.filter(isPublishReadyArticle);
  const latestEdition = pickLatestReadyEdition(readyHeroes, readyArticles);
  const editionHeroes = latestEdition
    ? readyHeroes.filter((hero) => hero.edition === latestEdition).slice(0, 3)
    : readyHeroes
        .slice()
        .sort((a, b) => +new Date(b.date) - +new Date(a.date))
        .slice(0, 3);
  const editionArticles = latestEdition
    ? readyArticles.filter((article) => article.edition === latestEdition).slice(0, articleLimit)
    : readyArticles
        .slice()
        .sort((a, b) => +new Date(b.date) - +new Date(a.date))
        .slice(0, articleLimit);

  return {
    latestEdition,
    editionLabel: latestEdition ? formatEditionLabel(latestEdition) : "",
    heroes: editionHeroes,
    articles: editionArticles,
  };
}
