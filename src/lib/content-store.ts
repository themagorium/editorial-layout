import heroYacht from "@/assets/hero-yacht.jpg";
import heroFashion from "@/assets/hero-fashion.jpg";
import heroMotorsport from "@/assets/hero-motorsport.jpg";
import articleTravel from "@/assets/article-travel.jpg";
import articleArt from "@/assets/article-art.jpg";
import articleGolf from "@/assets/article-golf.jpg";
import articleMusic from "@/assets/article-music.jpg";

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
  content: string; // text content, image data URL, or video data URL
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
    title: "Mediterranean Dreams: Yachting Season Opens",
    subtitle: "From Monaco to Mykonos — the ultimate charter guide for 2026",
    category: "Yachting",
    imageUrl: heroYacht,
    date: "2026-03-01",
  },
  {
    id: "h2",
    title: "Milan Fashion Week: The New Gilded Age",
    subtitle: "A front-row look at the collections defining this decade",
    category: "Fashion",
    imageUrl: heroFashion,
    date: "2026-03-05",
  },
  {
    id: "h3",
    title: "F1 Returns to the Streets of Monaco",
    subtitle: "Preview of the most prestigious race on the calendar",
    category: "Motorsport",
    imageUrl: heroMotorsport,
    date: "2026-03-08",
  },
];

const DEFAULT_ARTICLES: Article[] = [
  {
    id: "a1",
    title: "Santorini at Sunset: Greece's Timeless Allure",
    excerpt: "Why the Cyclades remain the world's most coveted escape — and the hidden gems beyond the postcard views.",
    category: "Travel",
    imageUrl: articleTravel,
    author: "Elena Voss",
    date: "2026-03-06",
    featured: true,
  },
  {
    id: "a2",
    title: "The New Sculptors: Art Basel Preview",
    excerpt: "Inside the galleries pushing contemporary sculpture into uncharted territory this spring.",
    category: "Art & Design",
    imageUrl: articleArt,
    author: "Marcus Chen",
    date: "2026-03-04",
  },
  {
    id: "a3",
    title: "Augusta Awaits: Masters 2026 Preview",
    excerpt: "Amen Corner has never looked more dramatic. A course guide for the discerning spectator.",
    category: "Golf",
    imageUrl: articleGolf,
    author: "James Whitfield",
    date: "2026-03-02",
  },
  {
    id: "a4",
    title: "Glastonbury's Golden Jubilee Lineup",
    excerpt: "Fifty years of the world's greatest festival — and the headline acts that will define the anniversary.",
    category: "Music",
    imageUrl: articleMusic,
    author: "Sophie Laurent",
    date: "2026-02-28",
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
