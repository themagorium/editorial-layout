import heroOlympics from "@/assets/hero-olympics.jpg";
import heroMilanFashion from "@/assets/hero-milan-fashion.jpg";
import heroWhiteTurf from "@/assets/hero-white-turf.jpg";
import articleVeniceCarnival from "@/assets/article-venice-carnival.jpg";
import articleRioCarnival from "@/assets/article-rio-carnival.jpg";
import articleSuperbowl from "@/assets/article-superbowl.jpg";
import articleIceStMoritz from "@/assets/article-ice-stmoritz.jpg";

export type Category = 
  | "Travel" | "Yachting" | "Art & Design" | "Fashion" 
  | "Tech & AI" | "Motorsport" | "Film & Festivals" 
  | "Music" | "Golf" | "Tennis" | "Wellness" | "Equestrian";

export const CATEGORIES: Category[] = [
  "Travel", "Yachting", "Art & Design", "Fashion", "Tech & AI",
  "Motorsport", "Film & Festivals", "Music", "Golf", "Tennis", "Wellness", "Equestrian"
];

export interface HeroItem {
  id: string;
  title: string;
  subtitle: string;
  category: Category;
  imageUrl: string;
  videoUrl?: string;
  date: string;
}

export interface ArticleBodyBlock {
  id: string;
  type: "text" | "image" | "video";
  content: string;
  caption?: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: Category;
  imageUrl: string;
  videoUrl?: string;
  author: string;
  date: string;
  featured?: boolean;
  body?: ArticleBodyBlock[];
}

export interface AdSlot {
  id: string;
  label: string;
  position: "hero-sidebar" | "mid-feed" | "bottom-banner" | "sidebar";
  imageUrl?: string;
  videoUrl?: string;
  linkUrl?: string;
  width: number;
  height: number;
}

const DEFAULT_HEROES: HeroItem[] = [
  {
    id: "h1",
    title: "Winter Olympics XXV: Milano-Cortina 2026",
    subtitle: "The Dolomites prepare to host the world's greatest winter spectacle — a complete preview",
    category: "Travel",
    imageUrl: heroOlympics,
    date: "2026-02-06",
  },
  {
    id: "h2",
    title: "Milan Fashion Week: The New Gilded Age",
    subtitle: "A front-row look at the collections defining this decade",
    category: "Fashion",
    imageUrl: heroMilanFashion,
    date: "2026-02-25",
  },
  {
    id: "h3",
    title: "White Turf: Racing on Ice in St. Moritz",
    subtitle: "The world's most glamorous winter horse racing returns to the frozen lake of the Engadin",
    category: "Equestrian",
    imageUrl: heroWhiteTurf,
    date: "2026-02-15",
  },
];

const DEFAULT_ARTICLES: Article[] = [
  {
    id: "a1",
    title: "Venice Carnival 2026: Masks, Palazzi & the Olympic Spirit",
    excerpt: "The theme 'Olympus, the origins of play' transforms Piazza San Marco into a theatrical spectacle of masked balls and candlelit lagoon cruises.",
    category: "Travel",
    imageUrl: articleVeniceCarnival,
    author: "Elena Voss",
    date: "2026-02-01",
    featured: true,
  },
  {
    id: "a2",
    title: "Rio Carnival 2026: Samba Under the Stars",
    excerpt: "From the Sambadrome to the blocos — the most exuberant celebration on earth returns for six electric nights.",
    category: "Music",
    imageUrl: articleRioCarnival,
    author: "Marcus Chen",
    date: "2026-02-13",
  },
  {
    id: "a3",
    title: "Super Bowl LX: Stadium Lights & Bay Area Glamour",
    excerpt: "Levi's Stadium hosts the biggest night in American sport — VIP suites, halftime spectacle, and celebrity-heavy parties.",
    category: "Travel",
    imageUrl: articleSuperbowl,
    author: "James Whitfield",
    date: "2026-02-08",
  },
  {
    id: "a4",
    title: "ICE St. Moritz: The International Concours of Elegance",
    excerpt: "The world's only concours d'élégance held on a frozen lake — rare vintage masterpieces gleam against the Alpine winter sun in the Engadin.",
    category: "Motorsport",
    imageUrl: articleIceStMoritz,
    author: "Sophie Laurent",
    date: "2026-02-06",
  },
];

const DEFAULT_ADS: AdSlot[] = [
  { id: "ad1", label: "Hero Sidebar Ad", position: "hero-sidebar", width: 300, height: 250 },
  { id: "ad2", label: "Mid-Feed Banner", position: "mid-feed", width: 728, height: 90 },
  { id: "ad3", label: "Bottom Banner", position: "bottom-banner", width: 970, height: 250 },
  { id: "ad4", label: "Sidebar Ad", position: "sidebar", width: 300, height: 600 },
];

const STORAGE_KEYS = {
  heroes: "editorial_heroes",
  articles: "editorial_articles",
  ads: "editorial_ads",
};

export function getHeroes(): HeroItem[] {
  const stored = localStorage.getItem(STORAGE_KEYS.heroes);
  return stored ? JSON.parse(stored) : DEFAULT_HEROES;
}

export function getArticles(): Article[] {
  const stored = localStorage.getItem(STORAGE_KEYS.articles);
  return stored ? JSON.parse(stored) : DEFAULT_ARTICLES;
}

export function getAds(): AdSlot[] {
  const stored = localStorage.getItem(STORAGE_KEYS.ads);
  return stored ? JSON.parse(stored) : DEFAULT_ADS;
}

export function saveHeroes(heroes: HeroItem[]) {
  localStorage.setItem(STORAGE_KEYS.heroes, JSON.stringify(heroes));
}

export function saveArticles(articles: Article[]) {
  localStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(articles));
}

export function saveAds(ads: AdSlot[]) {
  localStorage.setItem(STORAGE_KEYS.ads, JSON.stringify(ads));
}

export function resetToDefaults() {
  localStorage.removeItem(STORAGE_KEYS.heroes);
  localStorage.removeItem(STORAGE_KEYS.articles);
  localStorage.removeItem(STORAGE_KEYS.ads);
}
