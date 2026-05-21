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

export function pickLatestReadyEdition(heroes: HeroItem[], articles: Article[]): string {
  const editions = Array.from(
    new Set([...heroes.map((hero) => hero.edition), ...articles.map((article) => article.edition)]),
  )
    .filter(Boolean)
    .sort()
    .reverse();

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
