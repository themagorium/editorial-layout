import heroOlympics from "@/assets/hero-olympics.jpg";
import heroMilanFashion from "@/assets/hero-milan-fashion.jpg";
import heroWhiteTurf from "@/assets/hero-white-turf.jpg";
import articleVeniceCarnival from "@/assets/article-venice-carnival.jpg";
import articleRioCarnival from "@/assets/article-rio-carnival.jpg";
import articleSuperbowl from "@/assets/article-superbowl.jpg";
import articleIceStMoritz from "@/assets/article-ice-stmoritz.jpg";
// Volume 1 — October 2025
import articleSailgp from "@/assets/article-sailgp.jpg";
import articleCvSummit from "@/assets/article-cv-summit.jpg";
import articleF1Americas from "@/assets/article-f1-americas.jpg";
import articleCambiaso from "@/assets/article-cambiaso.jpg";
import articleEngadin from "@/assets/article-engadin.jpg";
import articleKusama from "@/assets/article-kusama.jpg";
import articlePfw from "@/assets/article-pfw.jpg";
import articleCambiasoPhoto1 from "@/assets/article-cambiaso-photo1.jpg";
import articleCambiasoPhoto2 from "@/assets/article-cambiaso-photo2.jpg";

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
  citation?: string;
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
  // --- Volume 1 — October 2025 ---
  {
    id: "v1-sailgp",
    title: "SailGP from Geneva to Cadiz",
    excerpt: "Rolex Switzerland SailGP Grand Prix on Lake Geneva delivered a dramatic mix of tactics, light winds, and a breakthrough victory for Germany in its first final.",
    category: "Yachting",
    imageUrl: articleSailgp,
    author: "Millie Sealana",
    date: "2025-10-04",
    body: [
      { id: "sailgp-b1", type: "text", content: "Rolex Switzerland SailGP Grand Prix on Lake Geneva delivered a dramatic mix of tactics, light winds, and a breakthrough victory for Germany in its first final and first win. Switzerland hosted the SailGP for the first time and the local crowd got more than just a glimpse of world-class foiling — they saw history." },
      { id: "sailgp-b2", type: "text", content: "Being a freshwater venue, the conditions were challenging as the teams were used to coastal and sea venues. Light winds forced teams to rethink tactics. The unpredictability of the winds and shifting conditions meant that each start and positioning made a difference. SailGP commentators stated \"the difference between success and failure was razor thin.\"" },
      { id: "sailgp-b3", type: "text", content: "The F50 catamarans require a certain wind threshold (~28 km/h) to consistently stay foiling. In Geneva, wind speeds were well below that threshold, forcing boats to operate more in displacement mode during parts of the race." },
      { id: "sailgp-b4", type: "text", content: "Day 1 and 2, New Zealand and Spain showed their strengths with wins in the earlier races. Spain, led by Diego Botin and having come from wins in San Francisco and New York was ready. The Black Foils, with Peter Burling at the helm came out strong by foiling early and securing the first win." },
      { id: "sailgp-b5", type: "text", content: "The Swiss team, strengthened by their home territory advantage was supported by the local fans but was penalized with an early start which cost them the win. Germany's win was due to precision and perfect execution from start to finish. It was a first final as well as first win for Germany, which depicted the diverse strengths and parity across all of the teams." },
      { id: "sailgp-b6", type: "text", content: "Next up, the runup before the finals takes place in Cadiz on the Spanish team's home soil." },
    ],
  },
  {
    id: "v1-cv-summit",
    title: "Zurich's CV Summit: Capital Meets AI Coding by the Lake",
    excerpt: "CV Summit 2025 at the Kongresshaus united 3,000+ tech leaders, investors and innovators — shifting from spectacle to substance around infrastructure.",
    category: "Tech & AI",
    imageUrl: articleCvSummit,
    author: "Millie Sealana",
    date: "2025-10-06",
    body: [
      { id: "cv-b1", type: "text", content: "CV Summit 2025 took place at the Kongresshaus Zurich, uniting more than 3,000 technology leaders, investors, institutions, and innovators. With 190 speakers, the summit underscored its role as a catalyst event for defining the new era of finance and technology. This year's edition occupied its familiar space as part alpine think-tank, part deal-floor, part Swiss-precision diplomacy — but the shift from spectacle to substance was unmistakable." },
      { id: "cv-b2", type: "text", content: "The agenda spanned four tracks: Blockchain (innovation and infrastructure), Institutions & Digital Assets (banking, capital markets, and compliant adoption), Wealth Management (digital-era investment), and Artificial Intelligence (acceleration of financial evolution). Switzerland's neutrality and governance were repeatedly invoked as stabilizing anchors in an increasingly volatile global environment." },
      { id: "cv-b3", type: "text", content: "Blockchain and AI are reshaping wealth, asset management, banking, and payments. Olaf Hannemann, Co-Founder of CV VC, captured the Summit's spirit: \"Innovation has never been as fast as today, but will never be as slow ever again.\" Panelists explored autonomous financial agents where AI-driven systems are capable of transacting, investing, and paying on behalf of humans." },
      { id: "cv-b4", type: "text", content: "Roger Bayston, Head of Digital Assets at Franklin Templeton, stated: \"We've been building blockchain-integrated solutions since 2017. Our presence at CV Summit reflects our belief that tokenized products, composable infrastructure, and tools like intraday yield are the future of finance.\"" },
      { id: "cv-b5", type: "text", content: "After years of noise and over-funded experimentation, the most interesting ideas emerged from those building slowly, deliberately, with clarity of purpose — a return to fundamentals. The community is recalibrating itself: quieter, sharper, ready for a more disciplined era of innovation." },
    ],
  },
  {
    id: "v1-f1-americas",
    title: "F1 Returns to the Circuit of the Americas",
    excerpt: "Just on the heels of Singapore, F1 heads to Austin's tech haven — where Russell amazed and Hamilton raced for Roscoe.",
    category: "Motorsport",
    imageUrl: articleF1Americas,
    author: "Charlotte Thames",
    date: "2025-10-06",
    body: [
      { id: "f1-b1", type: "text", content: "Just on the heels of the Singapore Grand Prix, which is notorious for being one of the toughest races physically for Formula 1 drivers as it was declared the first 'heat hazard' race of the year, meaning drivers either had to use a cooling vest or add extra ballast to their car. Max Verstappen chose not to." },
      { id: "f1-b2", type: "text", content: "In Singapore, the finals were tight as George Russell amazed the entire F1 paddock with a faultless display of skill from qualifying to the final race. McLaren finished as Formula 1's top team at the Singapore Grand Prix on a challenging day for the 1,2,3 finish of George Russell, Mercedes Benz AMG; Max Verstappen, Red Bull Racing; and Lando Norris, McLaren." },
      { id: "f1-b3", type: "text", content: "Hamilton dropped to eighth, while Oliver Bearman was ninth for Haas and Carlos Sainz, Jr., after his first podium win with Williams in Azerbaijan took a point in 10th as he had to start near the back of the grid for a technical infringement." },
      { id: "f1-b4", type: "text", content: "Lewis said he \"raced for Roscoe.\" Hamilton, just coming back from the terrible blow of losing his companion of the heart, Roscoe, was visibly affected as the entire F1 community witnessed. His innate reflexive well-honed driving skills compensated for his personal ordeal. Our hearts go out to Hamilton for the upcoming races." },
      { id: "f1-b5", type: "text", content: "Next up, F1 returns to American soil in Austin. If having Kygo and Garth Brooks as the event's concert headliners is any indication of the disparity even in tech world Austin, the fans will undoubtedly be dazzled once again by the dramatic speed and strategy of Formula 1 racing. The official track record of 1:36.16 was set by Charles Leclerc in 2019." },
    ],
  },
  {
    id: "v1-cambiaso",
    title: "Cambiaso x Cambiaso: Hurlingham and a New Legacy Begins",
    excerpt: "The 132nd Hurlingham Open: La Natividad La Dolfina establish a new standard under pressure, bringing father and son back on home soil.",
    category: "Equestrian",
    imageUrl: articleCambiaso,
    author: "Millie Sealana",
    date: "2025-10-06",
    body: [
      { id: "polo-b1", type: "text", content: "The 132nd Hurlingham Open unfolded with two teams forced to rethink their assumptions rather than rely on routine. On the historic turf at Hurlingham, La Natividad La Dolfina, in their first title since the merger of the two teams, delivered a win that didn't hinge on overpowering their opponent, but on interpreting a match that evolved in real time. It brought father and son, Adolfo and Poroto Cambiaso back on home soil." },
      { id: "polo-b2", type: "text", content: "Their 12–9 result over UAE Polo signaled far more than a strong showing at the start of the Triple Crown. It revealed a team learning to operate as a single unit, navigating momentum shifts with the kind of clarity that only comes from maturity, trust, and an unspoken internal rhythm." },
      { id: "polo-b3", type: "text", content: "The opening chukkers felt controlled but uncertain — not chaotic, but undefined. UAE Polo entered with a familiar structure: tight spacing, disciplined rotation, and a pace that made the early exchanges feel almost cautious. Their approach limited open lanes and challenged La Natividad La Dolfina to search for patterns rather than impose them." },
      { id: "polo-b4", type: "text", content: "Camilo \"Jeta\" Castagnola emerged as the primary reference point. His goals — eight in total — shifted the momentum and prevented the game from slipping back into equilibrium. Accuracy created separation and composure controlled tempo." },
      { id: "polo-b5", type: "image", content: articleCambiasoPhoto1, caption: "Cambiaso's Signature Influence", citation: "© Hurlingham Polo Association" },
      { id: "polo-b6", type: "text", content: "Adolfo Cambiaso provided the layer of interpretation needed — steering tempo, adjusting field shape, and adding the two goals that mattered more for their timing than for their numbers. Poroto Cambiaso linked the lines with fluidity, smoothing transitions from recovery to attack and ensuring the momentum held steady during the match's most volatile periods." },
      { id: "polo-b7", type: "text", content: "UAE Polo did not retreat. They played with a controlled edge, forcing La Natividad La Dolfina into full concentration. Their strongest sequences came at moments when the match felt poised to turn — and one late collision involving Lucas Monteverde briefly froze the stadium." },
      { id: "polo-b8", type: "image", content: articleCambiasoPhoto2, caption: "Cambiaso's Signature Influence", citation: "© Hurlingham Polo Association" },
      { id: "polo-b9", type: "text", content: "This victory did not lean on history or reputation. It felt like a team constructing an identity from the inside out — one built on controlled acceleration, coordinated defensive shifts, and disciplined decision-making under tension." },
      { id: "polo-b10", type: "text", content: "With Hurlingham complete, the tour moves toward Tortugas and Palermo. La Natividad La Dolfina demonstrated their capacity to adapt, absorb pressure, and convert opportunity. It is the kind of win that shapes a season not through spectacle, but through clarity. The road to the Triple Crown is underway. Proxima parada, Tortugas." },
    ],
  },
  {
    id: "v1-engadin",
    title: "Engadin Awaits the Winter",
    excerpt: "There is no other region in the world like the Engadin — from St. Moritz to Davos Klosters. The lakes freeze, the light shifts, and the valley transforms.",
    category: "Travel",
    imageUrl: articleEngadin,
    author: "Millie Sealana",
    date: "2025-10-06",
    body: [
      { id: "eng-b1", type: "text", content: "The Engadin in late autumn is a quiet pause before the endless myriad of choices for skiers and non skiers alike. There is no other region in the world like the Engadin, from St. Moritz to Davos Klosters to the quieter towns of Scuol and Arosa. Winter is non stop with everything from A-to-Z. The lakes freeze from the edges inward, the light shifts to a colder blue, and the valley begins its quiet transformation into the winter playground the world knows so well." },
      { id: "eng-b2", type: "text", content: "St. Moritz is already rehearsing for its defining months: opening with FIS World Cup in action, Snow Polo, the White Turf races and the International Concours of Elegance (ICE). Everywhere is preparing for the gorgeous diamond-like snow to come. The private chalet gatherings, the art, the design, the discreet international arrivals that shape the season." },
      { id: "eng-b3", type: "text", content: "What differentiates the Engadin from any other alpine destination is not scale — it is choreography. Every winter unfolds like a curated performance, layered with tradition but never static. This year, the mood is unmistakably elevated: more intimate, more global, and somehow sharper, as if the valley is preparing for an inflection point." },
      { id: "eng-b4", type: "text", content: "Winter has yet to arrive. But you can feel it approaching with anticipation." },
    ],
  },
  {
    id: "v1-kusama",
    title: "Kusama Before the Crowds",
    excerpt: "Pumpkins, infinity, and luminous polka worlds — Kusama's language of repetition and wonder arrives at Fondation Beyeler in Riehen.",
    category: "Art & Design",
    imageUrl: articleKusama,
    author: "Millie Sealana",
    date: "2025-10-05",
    body: [
      { id: "kus-b1", type: "text", content: "Pumpkins, infinity, and luminous polka worlds — Kusama's language of repetition and wonder arrives at Fondation Beyeler in Riehen. The exhibition explores the artist's enduring fascination with the infinite, transforming the galleries into immersive environments that blur the line between viewer and artwork." },
    ],
  },
  {
    id: "v1-pfw",
    title: "Paris Fashion Week SS26: Blazy's Debut at Chanel & Burton's Givenchy",
    excerpt: "Matthieu Blazy's highly anticipated debut at Chanel, and Sarah Burton's second collection at Givenchy define the season.",
    category: "Fashion",
    imageUrl: articlePfw,
    author: "Millie Sealana",
    date: "2025-10-06",
    body: [
      { id: "pfw-b1", type: "text", content: "Matthieu Blazy's highly anticipated debut at Chanel and Sarah Burton's second collection at Givenchy defined the season at Paris Fashion Week SS26. The collections signaled a new chapter for both houses — one of quiet confidence and refined craftsmanship." },
    ],
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
