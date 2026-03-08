// ===== Image Imports =====
import heroOlympics from "@/assets/hero-olympics.jpg";
import heroNyfw from "@/assets/hero-nyfw.jpg";
import heroLfw from "@/assets/hero-lfw.jpg";
import articleVeniceCarnival from "@/assets/article-venice-carnival.jpg";
import articleRioCarnival from "@/assets/article-rio-carnival.jpg";
import articleSuperbowl from "@/assets/article-superbowl.jpg";
import articleDubaiFestival from "@/assets/article-dubai-festival.jpg";
// January 2026
import heroDavosWef from "@/assets/hero-davos-wef.jpg";
import heroSnowPolo from "@/assets/hero-snow-polo.jpg";
import heroHauteCouture from "@/assets/hero-haute-couture.jpg";
import articleOscars from "@/assets/article-oscars.jpg";
import articleArtSg from "@/assets/article-art-sg.jpg";
import articleMilanFashion from "@/assets/hero-milan-fashion.jpg";
import articlePittiUomo from "@/assets/article-pitti-uomo.jpg";
// October 2025
import articleCambiaso from "@/assets/article-cambiaso.jpg";
import articleF1Americas from "@/assets/article-f1-americas.jpg";
import heroCapeTown from "@/assets/hero-cape-town.jpg";
import articleSailgp from "@/assets/article-sailgp.jpg";
import articleCvSummit from "@/assets/article-cv-summit.jpg";
import articleKusama from "@/assets/article-kusama.jpg";
import articleMarrakech from "@/assets/article-marrakech.jpg";
import articleCambiasoPhoto1 from "@/assets/article-cambiaso-photo1.jpg";
import articleCambiasoPhoto2 from "@/assets/article-cambiaso-photo2.jpg";

// ===== Types =====
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
  edition: string;
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
  edition: string;
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

// ===================================================================
// HEROES — 3 per edition, NO city repeats across editions
// Feb 2026: Milano-Cortina, New York, London
// Jan 2026: Davos, St. Moritz, Paris
// Oct 2025: Buenos Aires, Austin, Cape Town
// ===================================================================
const DEFAULT_HEROES: HeroItem[] = [
  // --- February 2026 ---
  { id: "h1", title: "Winter Olympics XXV: Milano-Cortina 2026", subtitle: "The Dolomites prepare to host the world's greatest winter spectacle — a complete preview", category: "Travel", imageUrl: heroOlympics, date: "2026-02-06", edition: "2026-02" },
  { id: "h2", title: "New York Fashion Week: A New Energy", subtitle: "NYFW returns to Manhattan's industrial lofts with bold new designers and a front row that means business", category: "Fashion", imageUrl: heroNyfw, date: "2026-02-12", edition: "2026-02" },
  { id: "h3", title: "London Fashion Week: The British Avant-Garde", subtitle: "92 shows across the capital as LFW builds momentum under new BFC leadership — expect the unexpected", category: "Fashion", imageUrl: heroLfw, date: "2026-02-19", edition: "2026-02" },
  // --- January 2026 ---
  { id: "h-wef", title: "Davos 2026: The World Economic Forum's Annual Meeting", subtitle: "Record numbers of world leaders converge on Davos for five days of dialogue on AI, climate, and the global economy", category: "Tech & AI", imageUrl: heroDavosWef, date: "2026-01-19", edition: "2026-01" },
  { id: "h-snow-polo", title: "41st Snow Polo World Cup St. Moritz", subtitle: "The frozen lake becomes the world's most spectacular polo arena as Standing Rock claims the title", category: "Equestrian", imageUrl: heroSnowPolo, date: "2026-01-24", edition: "2026-01" },
  { id: "h-haute-couture", title: "Paris Haute Couture Week SS26: The Art of the Extraordinary", subtitle: "From Chanel to Dior to Valentino — the pinnacle of fashion craftsmanship returns to the grand palaces of Paris", category: "Fashion", imageUrl: heroHauteCouture, date: "2026-01-26", edition: "2026-01" },
  // --- October 2025 ---
  { id: "h-polo-ba", title: "Cambiaso x Cambiaso: The Hurlingham Open", subtitle: "Father and son reunite on the historic turf of Buenos Aires as La Natividad La Dolfina begin their Triple Crown campaign", category: "Equestrian", imageUrl: articleCambiaso, date: "2025-10-06", edition: "2025-10" },
  { id: "h-f1-austin", title: "F1 Returns to the Circuit of the Americas", subtitle: "Austin's tech haven welcomes Formula 1 — where Russell amazed and Hamilton raced for Roscoe", category: "Motorsport", imageUrl: articleF1Americas, date: "2025-10-06", edition: "2025-10" },
  { id: "h-cape-town", title: "Cape Town Design Week: Africa's Creative Vanguard", subtitle: "Table Mountain as backdrop — where African contemporary design meets global luxury at the continent's most ambitious design gathering", category: "Art & Design", imageUrl: heroCapeTown, date: "2025-10-15", edition: "2025-10" },
];

// ===================================================================
// ARTICLES — 4 per edition, NO city repeats across editions
// Feb 2026: Venice, Rio, Bay Area, Dubai
// Jan 2026: Los Angeles, Singapore, Florence, Paris
// Oct 2025: Geneva, Zurich, Basel, Marrakech
// ===================================================================
const DEFAULT_ARTICLES: Article[] = [
  // ========== FEBRUARY 2026 ==========
  {
    id: "a1",
    title: "Venice Carnival 2026: Masks, Palazzi & the Olympic Spirit",
    excerpt: "The theme 'Olympus, the origins of play' transforms Piazza San Marco into a theatrical spectacle of masked balls and candlelit lagoon cruises.",
    category: "Travel",
    imageUrl: articleVeniceCarnival,
    author: "Elena Voss",
    date: "2026-02-01",
    featured: true,
    edition: "2026-02",
    body: [
      { id: "vc-b1", type: "text", content: "Venice Carnival 2026 opened under the theme 'Olympus, the origins of play' — a fitting tribute to the Olympic year. Piazza San Marco was transformed into an open-air theatre where masked revelers in gilded costumes mingled with candlelit processions along the Grand Canal." },
      { id: "vc-b2", type: "text", content: "The carnival's most coveted invitation remains the Gran Ballo della Cavalchina at La Fenice, where guests in 18th-century Venetian attire danced until dawn. This year's edition added a modern twist: a floating installation by teamLab illuminated the lagoon, creating an ethereal bridge between Venice's theatrical past and its digital future." },
      { id: "vc-b3", type: "text", content: "Beyond the spectacle, the luxury hotels of Venice — the Gritti Palace, the Danieli, the Bauer — hosted private salons and intimate masquerade dinners. The carnival has evolved from a tourist attraction into a curated cultural experience, where the masks serve not as disguise but as invitation." },
    ],
  },
  {
    id: "a2",
    title: "Rio Carnival 2026: Samba Under the Stars",
    excerpt: "From the Sambadrome to the blocos — the most exuberant celebration on earth returns for six electric nights.",
    category: "Music",
    imageUrl: articleRioCarnival,
    author: "Marcus Chen",
    date: "2026-02-13",
    edition: "2026-02",
    body: [
      { id: "rc-b1", type: "text", content: "Rio Carnival 2026 returned with six electric nights of samba, spectacle, and cultural expression that confirmed its position as the world's most exuberant celebration. The Sambadrome's parade saw 12 samba schools compete for the championship, each float more ambitious than the last." },
      { id: "rc-b2", type: "text", content: "This year's standout was Mangueira's tribute to Afro-Brazilian heritage, a visual symphony of gold, green, and black that earned standing ovations from the 70,000-strong crowd. The street blocos — the informal neighborhood parades — drew millions more across the city." },
      { id: "rc-b3", type: "text", content: "For the luxury traveler, Rio during Carnival is a different proposition: private camarotes in the Sambadrome, rooftop parties at the Fasano in Ipanema, and yacht gatherings along the Guanabara Bay. The energy is infectious, the fashion is fearless, and the music never stops." },
    ],
  },
  {
    id: "a3",
    title: "Super Bowl LX: Stadium Lights & Bay Area Glamour",
    excerpt: "Levi's Stadium hosts the biggest night in American sport — VIP suites, halftime spectacle, and celebrity-heavy parties.",
    category: "Travel",
    imageUrl: articleSuperbowl,
    author: "James Whitfield",
    date: "2026-02-08",
    edition: "2026-02",
    body: [
      { id: "sb-b1", type: "text", content: "Super Bowl LX at Levi's Stadium in the San Francisco Bay Area delivered the blend of sport, entertainment, and luxury that has made it America's defining cultural event. The halftime show, the VIP suites, and the celebrity-heavy after-parties transformed Silicon Valley into Hollywood South for one electric weekend." },
      { id: "sb-b2", type: "text", content: "The luxury ecosystem around the Super Bowl has become as significant as the game itself. Private aviation traffic into San Jose and Oakland surged, hotel suites at the Four Seasons and Rosewood Sand Hill were booked months in advance, and the official NFL Honors ceremony drew A-listers from sport, entertainment, and tech." },
    ],
  },
  {
    id: "a4",
    title: "Dubai Shopping Festival: The Gold Souk Meets the Future",
    excerpt: "The world's longest-running retail festival returns with 45 days of luxury activations, from the Gold Souk to the Dubai Mall's couture pop-ups.",
    category: "Travel",
    imageUrl: articleDubaiFestival,
    author: "Charlotte Thames",
    date: "2026-02-15",
    edition: "2026-02",
    body: [
      { id: "dsf-b1", type: "text", content: "Dubai Shopping Festival celebrated its 31st edition with 45 days of luxury activations that spanned the city's most iconic destinations. From the historic Gold Souk in Deira — where traders have sold precious metals for over a century — to the couture pop-ups lining Dubai Mall's Fashion Avenue, the festival embodied Dubai's unique position at the crossroads of tradition and spectacle." },
      { id: "dsf-b2", type: "text", content: "This year's highlights included a limited-edition Bulgari collection unveiled exclusively at the Dubai Mall boutique, a Rolls-Royce raffle, and the annual gold prize draws that have become a tradition. The Burj Khalifa's nightly LED shows were synchronized to a luxury brand campaign for the first time." },
      { id: "dsf-b3", type: "text", content: "Beyond the retail, DSF has evolved into a lifestyle festival — with fine dining collaborations, yacht parties on Dubai Marina, and exclusive access to the new Atlantis The Royal residences. Dubai continues to prove that luxury retail is not just about transactions but about creating entire ecosystems of desire." },
    ],
  },

  // ========== JANUARY 2026 ==========
  {
    id: "v2-golden-globes",
    title: "Golden Globes 2026: Chalamet, Adolescence & a Night of Firsts",
    excerpt: "The 83rd Golden Globe Awards crowned Timothée Chalamet, Teyana Taylor, and the phenomenon 'Adolescence' — a ceremony that signaled Hollywood's generational shift.",
    category: "Film & Festivals",
    imageUrl: articleGoldenGlobes,
    author: "Charlotte Thames",
    date: "2026-01-11",
    featured: true,
    edition: "2026-01",
    body: [
      { id: "gg-b1", type: "text", content: "The 83rd Golden Globe Awards at the Beverly Hilton delivered one of the most compelling ceremonies in recent memory. Timothée Chalamet took home Best Actor in a Drama for his transformative turn in a biopic that critics called career-defining. Teyana Taylor won Best Actress in a Musical or Comedy for 'One Battle After Another,' a film that also claimed the top musical/comedy prize." },
      { id: "gg-b2", type: "text", content: "The night belonged equally to 'Adolescence,' the British limited series that swept the television categories and became the evening's most discussed work. Stephen Graham added a Golden Globe to his growing collection of accolades for the show. 'Hamnet' won Best Motion Picture — Drama, anchoring a ceremony that felt less like an industry event and more like a cultural inflection point." },
      { id: "gg-b3", type: "text", content: "On the red carpet, the fashion was as deliberate as the performances being honored. Designers leaned into structured silhouettes, deep jewel tones, and bespoke tailoring. The after-parties, from the InStyle suite to the Netflix gathering at Spago, hummed with the energy of an industry recalibrating its compass." },
    ],
  },
  {
    id: "v2-art-sg",
    title: "ART SG 2026: Southeast Asia's Leading Art Fair Expands Its Global Reach",
    excerpt: "The fourth edition of ART SG brought White Cube, Thaddaeus Ropac, and over 100 galleries to Singapore — alongside Ai Weiwei's monumental installation.",
    category: "Art & Design",
    imageUrl: articleArtSg,
    author: "Millie Sealana",
    date: "2026-01-23",
    edition: "2026-01",
    body: [
      { id: "asg-b1", type: "text", content: "The fourth edition of ART SG returned from January 23–25, continuing to set the pace as the leading international art fair in Southeast Asia. Visitors encountered presentations by global heavyweights including White Cube, Thaddaeus Ropac, neugerriemschneider, and Perrotin — alongside a strong contingent of Asian galleries." },
      { id: "asg-b2", type: "text", content: "The fair coincided with Singapore Art Week, which transformed the city-state into a concentrated hub of exhibitions, installations, and cultural programming. The most talked-about work was Ai Weiwei's monumental 60-metre inflatable raft — placed between diners at Capella Singapore — a provocative commentary on displacement." },
      { id: "asg-b3", type: "text", content: "ART SG's expanded programming included curated sections dedicated to emerging artists from the Asia-Pacific region and collector-led talks that drew private collectors from Hong Kong, Tokyo, Jakarta, and Sydney. Singapore is no longer an emerging art destination. It is one." },
    ],
  },
  {
    id: "v2-pitti-uomo",
    title: "Pitti Uomo 109: Florence and the Art of the Italian Man",
    excerpt: "The world's most influential menswear trade show returned to the Fortezza da Basso — where tailoring meets innovation under Tuscan winter light.",
    category: "Fashion",
    imageUrl: articlePittiUomo,
    author: "Elena Voss",
    date: "2026-01-13",
    edition: "2026-01",
    body: [
      { id: "pu-b1", type: "text", content: "Pitti Uomo 109 returned to the Fortezza da Basso in Florence from January 13–16, drawing buyers, editors, and designers from around the world for the 109th edition of the world's most influential menswear trade show. The Florentine setting — Renaissance fortifications housing the cutting edge of men's fashion — remains one of the industry's great contradictions." },
      { id: "pu-b2", type: "text", content: "This season's guest designer presentation and the street style outside the Fortezza confirmed a clear direction: oversized tailoring, muted earth tones, and a return to texture-driven fabrics. The Tuscan mills that supply many of the world's luxury houses were well represented, showcasing innovation in sustainable wool and cashmere blends." },
      { id: "pu-b3", type: "text", content: "Florence during Pitti is as much about the dinners, the palazzo visits, and the private showrooms as the fair itself. The city transforms into an extended salon where the boundaries between business and culture dissolve entirely." },
    ],
  },
  {
    id: "v2-dior-bristol",
    title: "Dior Masterpieces: The Mouna Ayoub Collection at Le Bristol Paris",
    excerpt: "126 haute couture pieces from Dior's golden era go on display at Le Bristol — a free exhibition during Haute Couture Week.",
    category: "Fashion",
    imageUrl: articleDiorBristol,
    author: "Elena Voss",
    date: "2026-01-26",
    edition: "2026-01",
    body: [
      { id: "db-b1", type: "text", content: "During Paris Haute Couture Week, Le Bristol Paris opened its grand salons to an extraordinary exhibition: 'Dior Masterpieces: The Mouna Ayoub Collection.' The free exhibition showcased 126 haute couture pieces spanning decades of the house's artistry — from the New Look era through to contemporary collections." },
      { id: "db-b2", type: "text", content: "Collector Mouna Ayoub, one of the world's foremost private holders of haute couture, curated the display with the precision of a museum director. Each gown occupied its own space within the hotel's ornate rooms, the crystal chandeliers and marble floors providing a setting that felt less like an exhibition and more like a private audience with fashion history." },
      { id: "db-b3", type: "text", content: "As Haute Couture Week unfolded across the city — with Chanel, Valentino, and Givenchy presenting their Spring 2026 collections — Le Bristol offered a counterpoint: a reminder that couture's power lies not just in the new, but in the enduring conversation between past and present craftsmanship." },
    ],
  },

  // ========== OCTOBER 2025 ==========
  {
    id: "v1-sailgp",
    title: "SailGP from Geneva to Cadiz",
    excerpt: "Rolex Switzerland SailGP Grand Prix on Lake Geneva delivered a dramatic mix of tactics, light winds, and a breakthrough victory for Germany.",
    category: "Yachting",
    imageUrl: articleSailgp,
    author: "Millie Sealana",
    date: "2025-10-04",
    edition: "2025-10",
    body: [
      { id: "sailgp-b1", type: "text", content: "Rolex Switzerland SailGP Grand Prix on Lake Geneva delivered a dramatic mix of tactics, light winds, and a breakthrough victory for Germany in its first final and first win. Switzerland hosted the SailGP for the first time and the local crowd got more than just a glimpse of world-class foiling — they saw history." },
      { id: "sailgp-b2", type: "text", content: "Being a freshwater venue, the conditions were challenging as the teams were used to coastal and sea venues. Light winds forced teams to rethink tactics. The unpredictability of the winds and shifting conditions meant that each start and positioning made a difference." },
      { id: "sailgp-b3", type: "text", content: "The F50 catamarans require a certain wind threshold (~28 km/h) to consistently stay foiling. In Geneva, wind speeds were well below that threshold, forcing boats to operate more in displacement mode during parts of the race." },
      { id: "sailgp-b4", type: "text", content: "Germany's win was due to precision and perfect execution from start to finish. It was a first final as well as first win for Germany, which depicted the diverse strengths and parity across all of the teams. Next up, the runup before the finals takes place in Cadiz on the Spanish team's home soil." },
    ],
  },
  {
    id: "v1-cv-summit",
    title: "Zurich's CV Summit: Capital Meets AI by the Lake",
    excerpt: "CV Summit 2025 at the Kongresshaus united 3,000+ tech leaders, investors and innovators — shifting from spectacle to substance.",
    category: "Tech & AI",
    imageUrl: articleCvSummit,
    author: "Millie Sealana",
    date: "2025-10-06",
    edition: "2025-10",
    body: [
      { id: "cv-b1", type: "text", content: "CV Summit 2025 took place at the Kongresshaus Zurich, uniting more than 3,000 technology leaders, investors, institutions, and innovators. With 190 speakers, the summit underscored its role as a catalyst event for defining the new era of finance and technology." },
      { id: "cv-b2", type: "text", content: "The agenda spanned four tracks: Blockchain, Institutions & Digital Assets, Wealth Management, and Artificial Intelligence. Switzerland's neutrality and governance were repeatedly invoked as stabilizing anchors in an increasingly volatile global environment." },
      { id: "cv-b3", type: "text", content: "Olaf Hannemann, Co-Founder of CV VC, captured the Summit's spirit: 'Innovation has never been as fast as today, but will never be as slow ever again.' The community is recalibrating itself: quieter, sharper, ready for a more disciplined era of innovation." },
    ],
  },
  {
    id: "v1-kusama",
    title: "Kusama Before the Crowds",
    excerpt: "Pumpkins, infinity, and luminous polka worlds — Kusama's language of repetition and wonder arrives at Fondation Beyeler in Basel.",
    category: "Art & Design",
    imageUrl: articleKusama,
    author: "Millie Sealana",
    date: "2025-10-05",
    edition: "2025-10",
    body: [
      { id: "kus-b1", type: "text", content: "Pumpkins, infinity, and luminous polka worlds — Kusama's language of repetition and wonder arrives at Fondation Beyeler in Riehen, near Basel. The exhibition explores the artist's enduring fascination with the infinite, transforming the galleries into immersive environments that blur the line between viewer and artwork." },
      { id: "kus-b2", type: "text", content: "Fondation Beyeler's setting — Renzo Piano's glass pavilion surrounded by fields and old trees — provides a contemplative counterpoint to Kusama's maximalism. The infinity rooms, the pumpkin installations, and the polka-dot trees that spill into the garden create a journey that oscillates between intimacy and overwhelm." },
    ],
  },
  {
    id: "v1-marrakech",
    title: "Marrakech: Where African Design Meets Global Luxury",
    excerpt: "From riad galleries to palace exhibitions, Marrakech is quietly becoming one of the world's most compelling destinations for art, design, and cultural crossover.",
    category: "Art & Design",
    imageUrl: articleMarrakech,
    author: "Millie Sealana",
    date: "2025-10-20",
    edition: "2025-10",
    body: [
      { id: "mk-b1", type: "text", content: "Marrakech has evolved beyond its reputation as a luxury travel destination. In October 2025, the Red City emerged as a serious cultural hub — hosting gallery openings, private collection viewings, and design exhibitions that drew collectors and curators from Paris, London, and New York." },
      { id: "mk-b2", type: "text", content: "The Musée Yves Saint Laurent Marrakech anchors the city's cultural offering, but the real energy lies in the riads-turned-galleries of the Medina and the private collections of Moroccan industrialists who have quietly assembled world-class contemporary art holdings. The convergence of Islamic geometry, Berber craft, and contemporary African art creates an aesthetic language found nowhere else." },
      { id: "mk-b3", type: "text", content: "For the design world, Marrakech represents something more than exoticism. It is a living laboratory where artisanship — zellige tilework, brass lanterns, hand-woven textiles — coexists with experimental architecture and digital art. The city's trajectory as a cultural capital is no longer emerging. It has arrived." },
    ],
  },
];

const DEFAULT_ADS: AdSlot[] = [
  { id: "ad1", label: "Hero Sidebar Ad", position: "hero-sidebar", width: 300, height: 250 },
  { id: "ad2", label: "Mid-Feed Banner", position: "mid-feed", width: 728, height: 90 },
  { id: "ad3", label: "Bottom Banner", position: "bottom-banner", width: 970, height: 250 },
  { id: "ad4", label: "Sidebar Ad", position: "sidebar", width: 300, height: 600 },
];

// ===== Storage & API =====
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

export function getEditions(): string[] {
  const heroes = getHeroes();
  const articles = getArticles();
  const editions = new Set<string>();
  heroes.forEach((h) => editions.add(h.edition));
  articles.forEach((a) => editions.add(a.edition));
  return Array.from(editions).sort().reverse();
}

export function getLatestEdition(): string {
  const editions = getEditions();
  return editions[0] || "2026-02";
}

export function getHeroesByEdition(edition: string): HeroItem[] {
  return getHeroes().filter((h) => h.edition === edition);
}

export function getArticlesByEdition(edition: string): Article[] {
  return getArticles().filter((a) => a.edition === edition);
}

export function formatEditionLabel(edition: string): string {
  const [year, month] = edition.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
