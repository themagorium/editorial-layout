// ===== Image Imports =====
import heroOlympics from "@/assets/hero-olympics.jpg";
import heroMilanFashion from "@/assets/hero-milan-fashion.jpg";
import heroSothebys from "@/assets/hero-sothebys.jpg";
import articleRioCarnival from "@/assets/article-rio-carnival.jpg";
import articleSuperbowl from "@/assets/article-superbowl.jpg";
import articleDubaiBoatShow from "@/assets/article-dubai-boat-show.jpg";
import articlePebbleBeach from "@/assets/article-pebble-beach.jpg";
import articleAbuDhabiArt from "@/assets/article-abu-dhabi-art.jpg";
// January 2026
import heroDavosWef from "@/assets/hero-davos-wef.jpg";
import heroSnowPolo from "@/assets/hero-snow-polo.jpg";
import heroHauteCouture from "@/assets/hero-haute-couture.jpg";
import articleOscars from "@/assets/article-oscars.jpg";
import articleArtSg from "@/assets/article-art-sg.jpg";
import articlePittiUomo from "@/assets/article-pitti-uomo.jpg";
import articleAustralianOpen from "@/assets/article-australian-open.jpg";
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
// HEROES — 3 per edition, unique categories per edition
// Feb 2026: Milano-Cortina (Travel), Milan (Fashion), New York Sotheby's (Art & Design)
// Jan 2026: Davos (Tech & AI), St. Moritz (Equestrian), Paris (Fashion)
// Oct 2025: Buenos Aires (Equestrian), Austin (Motorsport), Cape Town (Art & Design)
// ===================================================================
const DEFAULT_HEROES: HeroItem[] = [
  // --- February 2026 ---
  { id: "h1", title: "Winter Olympics XXV: Milano-Cortina 2026", subtitle: "The Dolomites prepare to host the world's greatest winter spectacle — a complete preview", category: "Travel", imageUrl: heroOlympics, date: "2026-02-06", edition: "2026-02" },
  { id: "h2", title: "Milan Fashion Week FW26: Power, Precision & Italian Glamour", subtitle: "From Prada's conceptual minimalism to Versace's maximalist revival — a season of bold contrasts and Italian craftsmanship", category: "Fashion", imageUrl: heroMilanFashion, date: "2026-02-20", edition: "2026-02" },
  { id: "h3", title: "Sotheby's Magnificent Jewels: A New York Evening Sale", subtitle: "A 28-carat Kashmir sapphire leads a $120 million catalogue — the auction house's most ambitious jewellery sale in a decade", category: "Art & Design", imageUrl: heroSothebys, date: "2026-02-11", edition: "2026-02" },
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
// ARTICLES — 4 per edition, unique categories (no overlap with heroes)
// Feb 2026: Rio (Music), Bay Area (Film & Festivals), Düsseldorf (Yachting), Pebble Beach (Golf)
// Jan 2026: LA (Film & Festivals), Singapore (Art & Design), Florence (Travel), Melbourne (Tennis)
// Oct 2025: Geneva (Yachting), Zurich (Tech & AI), Basel (Travel), Marrakech (Music)
// ===================================================================
const DEFAULT_ARTICLES: Article[] = [
  // ========== FEBRUARY 2026 ==========
  {
    id: "a1",
    title: "Rio Carnival 2026: Samba Under the Stars",
    excerpt: "From the Sambadrome to the blocos — the most exuberant celebration on earth returns for six electric nights.",
    category: "Music",
    imageUrl: articleRioCarnival,
    author: "Marcus Chen",
    date: "2026-02-13",
    featured: true,
    edition: "2026-02",
    body: [
      { id: "rc-b1", type: "text", content: "Rio Carnival 2026 returned with six electric nights of samba, spectacle, and cultural expression that confirmed its position as the world's most exuberant celebration. The Sambadrome's parade saw 12 samba schools compete for the championship, each float more ambitious than the last." },
      { id: "rc-b2", type: "text", content: "This year's standout was Mangueira's tribute to Afro-Brazilian heritage, a visual symphony of gold, green, and black that earned standing ovations from the 70,000-strong crowd. The street blocos — the informal neighborhood parades — drew millions more across the city." },
      { id: "rc-b3", type: "text", content: "For the luxury traveler, Rio during Carnival is a different proposition: private camarotes in the Sambadrome, rooftop parties at the Fasano in Ipanema, and yacht gatherings along the Guanabara Bay. The energy is infectious, the fashion is fearless, and the music never stops." },
    ],
  },
  {
    id: "a2",
    title: "Super Bowl LX: Stadium Lights & Bay Area Glamour",
    excerpt: "Levi's Stadium hosts the biggest night in American sport — VIP suites, halftime spectacle, and celebrity-heavy parties.",
    category: "Film & Festivals",
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
    id: "a3",
    title: "Boot Düsseldorf: The World's Largest Yacht & Watersport Show",
    excerpt: "250,000 visitors, 1,500 exhibitors, and superyachts that redefine what's possible on water — Boot Düsseldorf remains the industry's definitive gathering.",
    category: "Yachting",
    imageUrl: articleBootDusseldorf,
    author: "James Whitfield",
    date: "2026-02-17",
    edition: "2026-02",
    body: [
      { id: "bd-b1", type: "text", content: "Boot Düsseldorf returned for its 57th edition, confirming its position as the world's largest and most important yacht and watersport exhibition. Over 1,500 exhibitors from 68 countries filled the Messe Düsseldorf's vast halls with everything from 60-metre superyachts to cutting-edge electric tenders." },
      { id: "bd-b2", type: "text", content: "The Superyacht Hall — a cathedral-like space reserved for vessels over 30 metres — was this year's centrepiece. Lürssen, Benetti, and Sunseeker unveiled new models that pushed the boundaries of naval architecture, with hybrid propulsion systems and sustainability-driven design dominating the conversation." },
      { id: "bd-b3", type: "text", content: "Beyond the hardware, Boot has evolved into a lifestyle destination: private buyers' lounges, invitation-only evening events, and a programme of talks featuring some of the world's most accomplished ocean explorers. For the serious yachting community, there is no substitute." },
    ],
  },
  {
    id: "a4",
    title: "AT&T Pebble Beach Pro-Am: Where Golf Meets the Pacific",
    excerpt: "The most scenic tournament in golf returns to the Monterey Peninsula — where celebrities, pros, and the Pacific coastline create an unforgettable week.",
    category: "Golf",
    imageUrl: articlePebbleBeach,
    author: "James Whitfield",
    date: "2026-02-05",
    edition: "2026-02",
    body: [
      { id: "pb-b1", type: "text", content: "The AT&T Pebble Beach Pro-Am is not merely a golf tournament — it is a pilgrimage. Played across three of America's most stunning courses — Pebble Beach Golf Links, Spyglass Hill, and Monterey Peninsula — the Pro-Am combines world-class professional golf with a celebrity amateur format that draws A-listers from entertainment, tech, and sport." },
      { id: "pb-b2", type: "text", content: "The 7th hole at Pebble Beach, perched on a rocky outcrop above the Pacific, remains one of the most photographed spots in global sport. This year's field included defending champion and a roster of Hollywood and Silicon Valley names that confirmed the tournament's unique position at the intersection of sport and lifestyle." },
      { id: "pb-b3", type: "text", content: "Off the course, the Monterey Peninsula during Pro-Am week transforms into a luxury enclave: private dinners at the Lodge at Pebble Beach, wine tastings in Carmel Valley, and the annual Concours-quality car displays that line 17-Mile Drive. It is the most civilised week in American sport." },
    ],
  },
  {
    id: "v2-oscars",
    title: "The 98th Academy Awards: Hollywood's Grandest Night Returns",
    excerpt: "The Dolby Theatre hosts the Oscars — the definitive night of cinema, couture red carpets, and the after-parties that define the season.",
    category: "Film & Festivals",
    imageUrl: articleOscars,
    author: "Charlotte Thames",
    date: "2026-01-25",
    featured: true,
    edition: "2026-01",
    body: [
      { id: "osc-b1", type: "text", content: "The 98th Academy Awards at the Dolby Theatre in Hollywood delivered a ceremony that felt both timeless and urgent. The red carpet was a masterclass in couture — Valentino, Givenchy, and Armani Privé dominated, with structured silhouettes and jewel-toned satins setting the tone for a night that celebrated cinema's highest achievements." },
      { id: "osc-b2", type: "text", content: "The evening's biggest moment belonged to the Best Picture race, which saw a fierce contest between intimate character studies and sweeping epics. The after-parties — from the Vanity Fair gathering at the Wallis Annenberg Center to the Governor's Ball — hummed with the energy of an industry that still believes in the power of the big screen." },
      { id: "osc-b3", type: "text", content: "For the luxury world, the Oscars remain the ultimate intersection of fashion, celebrity, and cultural capital. The jewellery alone — Cartier, Bulgari, Tiffany — was estimated at over $100 million on the red carpet. Hollywood's grandest night continues to prove that spectacle, when done with conviction, is an art form in itself." },
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
    title: "Florence in Winter: Palazzi, Pitti & the Tuscan Table",
    excerpt: "Beyond the runways of Pitti Uomo, Florence in January reveals itself as Europe's most refined cultural destination — intimate galleries, Renaissance architecture, and truffle season.",
    category: "Travel",
    imageUrl: articlePittiUomo,
    author: "Elena Voss",
    date: "2026-01-13",
    edition: "2026-01",
    body: [
      { id: "pu-b1", type: "text", content: "Florence in January belongs to those who know. While the world's menswear industry descends on the Fortezza da Basso for Pitti Uomo, the city itself offers a quieter, richer experience: empty galleries at the Uffizi, private palazzo tours, and truffle season in the surrounding Tuscan hills." },
      { id: "pu-b2", type: "text", content: "The Renaissance capital at its winter best is a masterclass in slow luxury. The Oltrarno artisans — bookbinders, perfumers, leather craftsmen — open their workshops to visitors. The trattorias serve ribollita and bistecca alla fiorentina by candlelight. The Arno, low and silver, reflects a city that has been perfecting the art of living for six centuries." },
      { id: "pu-b3", type: "text", content: "For the cultural traveler, January in Florence is the antidote to the summer crowds. The Boboli Gardens are yours alone. The Brancacci Chapel frescoes glow in the winter light. And the evening passeggiata along Via de' Tornabuoni — past Ferragamo, Gucci, and Prada — remains one of Europe's great urban rituals." },
    ],
  },
  {
    id: "v2-aus-open",
    title: "Australian Open 2026: Grand Slam Glory Under Melbourne Skies",
    excerpt: "Rod Laver Arena hosts the first Grand Slam of the year — where the world's best compete in searing heat and electric night sessions.",
    category: "Tennis",
    imageUrl: articleAustralianOpen,
    author: "James Whitfield",
    date: "2026-01-19",
    edition: "2026-01",
    body: [
      { id: "ao-b1", type: "text", content: "The Australian Open remains the most vibrant Grand Slam on the calendar. Rod Laver Arena's retractable roof, the electric night sessions, and Melbourne's café culture create an atmosphere that blends elite sport with urban sophistication. The 2026 edition delivered drama from the first round." },
      { id: "ao-b2", type: "text", content: "Beyond the centre court, Melbourne Park's grounds have been transformed into a lifestyle precinct: champagne bars, luxury brand activations from Rolex and Ralph Lauren, and private hospitality suites that rival any in global sport. The after-match dining scene — from Chin Chin to Attica — confirms Melbourne's status as Australia's culinary capital." },
      { id: "ao-b3", type: "text", content: "For the luxury traveler, the Australian Open offers something no other Grand Slam can: January sunshine, world-class wine regions within an hour's drive, and a city that treats sport as culture. The Yarra Valley vineyards, the Mornington Peninsula hot springs, and the Great Ocean Road are all within reach of courtside seats." },
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
