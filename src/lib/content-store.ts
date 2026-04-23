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
// (Pitti Uomo import removed — replaced by Abu Dhabi Art)
import articleAustralianOpen from "@/assets/article-australian-open.jpg";
// October 2025
import articleCambiaso from "@/assets/article-cambiaso.jpg";
import articleF1Americas from "@/assets/article-f1-americas.jpg";
import heroCapeTown from "@/assets/hero-cape-town.jpg";
import articleSailgp from "@/assets/article-sailgp.jpg";
import articleCvSummit from "@/assets/article-cv-summit.jpg";
import articleKusama from "@/assets/article-kusama.jpg";
import articleMarrakech from "@/assets/article-marrakech.jpg";
import articleEngadin from "@/assets/article-engadin.jpg";
import articleCambiasoPhoto1 from "@/assets/article-cambiaso-photo1.jpg";
import articleCambiasoPhoto2 from "@/assets/article-cambiaso-photo2.jpg";
import articlePfw from "@/assets/article-pfw.jpg";

// ===== Types =====
export type Category = 
  | "Travel" | "Yachting" | "Art & Design" | "Fashion" 
  | "Tech & AI" | "Motorsport" | "Film & Festivals" 
  | "Music" | "Golf" | "Tennis" | "Wellness" | "Equestrian" | "Sports";

export const CATEGORIES: Category[] = [
  "Travel", "Yachting", "Art & Design", "Fashion", "Tech & AI",
  "Motorsport", "Film & Festivals", "Music", "Golf", "Tennis", "Wellness", "Equestrian", "Sports"
];

export interface HeroItem {
  id: string;
  title: string;
  excerpt?: string;
  legacySlugs?: string[];
  subtitle: string;
  category: Category;
  imageUrl: string;
  videoUrl?: string;
  author?: string;
  date: string;
  featured?: boolean;
  edition: string;
  body?: ArticleBodyBlock[];
}

export interface ArticleBodyBlock {
  id: string;
  type: "text" | "heading" | "image" | "video";
  content: string;
  headingVariant?: "title" | "subsection";
  textStyle?: "normal" | "bold" | "italic" | "bold-italic";
  caption?: string;
  citation?: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  legacySlugs?: string[];
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

export interface PublishedEditorialContent {
  heroes: HeroItem[];
  articles: Article[];
  ads: AdSlot[];
  publishedAt: string;
  updatedAt?: string;
}

export function slugifyText(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildContentPath(id: string, title: string): string {
  const titleSlug = slugifyText(title || id);
  return `/articles/${titleSlug}--${id}`;
}

function tokenizeForMatch(value: string): string[] {
  return slugifyText(value)
    .split("-")
    .filter((token) => token.length > 1);
}

function hasStrongTokenOverlap(title: string, candidateSlug: string): boolean {
  const candidateTokens = tokenizeForMatch(candidateSlug);
  if (candidateTokens.length < 2) return false;

  const titleTokens = new Set(tokenizeForMatch(title));
  const overlapCount = candidateTokens.filter((token) => titleTokens.has(token)).length;
  return overlapCount >= 2 && overlapCount / candidateTokens.length >= 0.6;
}

export function contentIdentifierMatches(item: { id: string; title: string; legacySlugs?: string[] }, identifier: string): boolean {
  const decoded = decodeURIComponent(identifier || "")
    .trim()
    .toLowerCase()
    .split("?")[0]
    .split("#")[0]
    .replace(/^\/+|\/+$/g, "");
  const candidate = decoded.split("/").pop() || decoded;
  const itemId = item.id.toLowerCase();
  const titleSlug = slugifyText(item.title || item.id);
  const legacySlugs = (item.legacySlugs || []).map((slug) => slugifyText(slug));

  if (!candidate) return false;
  if (candidate === itemId) return true;
  if (candidate === titleSlug) return true;
  if (candidate === `${titleSlug}--${itemId}`) return true;
  if (candidate.endsWith(`--${itemId}`)) return true;
  if (legacySlugs.includes(candidate)) return true;
  return hasStrongTokenOverlap(item.title, candidate);
}

export function createOctoberPatternBody(baseId: string, imageUrl?: string, videoUrl?: string): ArticleBodyBlock[] {
  return [
    {
      id: `${baseId}-seed-text`,
      type: "text",
      content: "Add story text",
    },
    createMediaSeedBlock(baseId, imageUrl, videoUrl),
  ];
}

function createMediaSeedBlock(baseId: string, imageUrl?: string, videoUrl?: string): ArticleBodyBlock {
  if (videoUrl) {
    return {
      id: `${baseId}-seed-video`,
      type: "video",
      content: videoUrl,
      caption: "Featured video",
    };
  }

  return {
    id: `${baseId}-seed-image`,
    type: "image",
    content: imageUrl || "",
    caption: imageUrl ? "Featured image" : "Upload photo or video",
  };
}

function normalizeBodyToOctoberPattern(
  baseId: string,
  body: ArticleBodyBlock[] | undefined,
  imageUrl?: string,
  videoUrl?: string,
): ArticleBodyBlock[] {
  const source = (body || []).filter(Boolean);
  const textLikeBlocks = source.filter((b) => b.type !== "image" && b.type !== "video");
  const mediaBlocks = source.filter((b) => b.type === "image" || b.type === "video");

  // Always enforce October-style sequence: text -> media -> text -> media...
  if (textLikeBlocks.length === 0) {
    return createOctoberPatternBody(baseId, imageUrl, videoUrl);
  }

  const primarySeedMedia = createMediaSeedBlock(baseId, imageUrl, videoUrl);
  const emptySeedMedia = createMediaSeedBlock(baseId, undefined, undefined);

  const normalized: ArticleBodyBlock[] = [];
  textLikeBlocks.forEach((textBlock, index) => {
    normalized.push({
      ...textBlock,
      id: `${baseId}-auto-t-${index}`,
    });
    const media = mediaBlocks[index] || (index === 0 ? primarySeedMedia : emptySeedMedia);
    normalized.push({
      ...media,
      id: `${baseId}-auto-m-${index}`,
      // Never duplicate hero/article lead media into every generated slot.
      content: mediaBlocks[index]?.content || (index === 0 ? media.content : ""),
      caption: mediaBlocks[index]?.caption || (index === 0 ? media.caption : ""),
      citation: mediaBlocks[index]?.citation || "",
    });
  });

  return normalized;
}

function normalizeHero(hero: HeroItem): HeroItem {
  const upgraded = upgradeLegacyHeroCopy(hero);
  return {
    ...upgraded,
    excerpt: upgraded.excerpt || upgraded.subtitle,
    body: normalizeBodyToOctoberPattern(upgraded.id, upgraded.body, upgraded.imageUrl, upgraded.videoUrl),
  };
}

function normalizeArticle(article: Article): Article {
  const upgraded = upgradeLegacyArticleCopy(article);
  return {
    ...upgraded,
    body: normalizeBodyToOctoberPattern(upgraded.id, upgraded.body, upgraded.imageUrl, upgraded.videoUrl),
  };
}

// ===================================================================
// HEROES — 3 per edition, unique categories per edition
// Feb 2026: Milano-Cortina (Travel), Milan (Fashion), New York Sotheby's (Art & Design)
// Jan 2026: Davos (Tech & AI), St. Moritz (Equestrian), Paris (Fashion)
// Oct 2025: Buenos Aires (Equestrian), Austin (Motorsport), Cape Town (Art & Design)
// ===================================================================
const DEFAULT_HEROES: HeroItem[] = [
  // --- February 2026 ---
  {
    id: "h1", title: "Winter Olympics XXV: Milano-Cortina 2026", subtitle: "The Dolomites prepare to host the world's greatest winter spectacle — a complete preview", category: "Travel", imageUrl: heroOlympics, date: "2026-02-06", edition: "2026-02",
    body: [
      { id: "wo-b1", type: "text", content: "The Milano-Cortina 2026 Winter Olympics promise to be the most spectacular winter Games in a generation. Set against the breathtaking Dolomites, the event spans two iconic Italian destinations — Milan's metropolitan energy and Cortina d'Ampezzo's Alpine elegance — creating a dual-city format that celebrates Italy's extraordinary range." },
      { id: "wo-b2", type: "text", content: "Cortina, the jewel of the Italian Alps, will host the alpine skiing, bobsled, and luge events on slopes that have defined winter sport since the 1956 Games. The town itself — with its luxury boutiques, historic Grand Hotels, and aperitivo culture — transforms into a living room for the world's sporting elite." },
      { id: "wo-b3", type: "text", content: "Milan brings the urban dimension: the opening ceremony at San Siro, ice hockey at the newly refurbished PalaSharp, and a cultural programme that spans La Scala, the Triennale, and the Fondazione Prada. For the luxury traveler, the combination of world-class sport and Italian dolce vita is irresistible." },
    ],
  },
  {
    id: "h3", title: "Sotheby's Magnificent Jewels: A New York Evening Sale", subtitle: "A 28-carat Kashmir sapphire leads a $120 million catalogue — the auction house's most ambitious jewellery sale in a decade", category: "Art & Design", imageUrl: heroSothebys, date: "2026-02-11", edition: "2026-02",
    body: [
      { id: "sj-b1", type: "text", content: "Sotheby's Magnificent Jewels evening sale in New York assembled a $120 million catalogue that represented the auction house's most ambitious jewellery offering in a decade. The star lot — a 28-carat Kashmir sapphire of extraordinary provenance — drew bidding from collectors in Geneva, Hong Kong, and the Gulf." },
      { id: "sj-b2", type: "text", content: "The sale reflected a broader trend in the ultra-high-net-worth market: a flight to tangible assets of unimpeachable quality. Coloured diamonds, signed Cartier Art Deco pieces, and estate jewellery from European royal collections commanded premiums that defied broader market uncertainty." },
      { id: "sj-b3", type: "text", content: "For The Magorium, the evening was a masterclass in the theatre of auction. Sotheby's York Avenue saleroom, with its hushed reverence and the auctioneer's measured cadence, remains one of the great rituals of the luxury world — where beauty, rarity, and desire converge under the hammer." },
    ],
  },
  {
    id: "h2", title: "Milan Fashion Week FW26: Power, Precision & Italian Glamour", subtitle: "From Prada's conceptual minimalism to Versace's maximalist revival — a season of bold contrasts and Italian craftsmanship", category: "Fashion", imageUrl: heroMilanFashion, date: "2026-02-20", edition: "2026-02",
    body: [
      { id: "mf-b1", type: "text", content: "Milan Fashion Week FW26 delivered a season of bold contrasts and unwavering Italian craftsmanship. Prada opened with a collection of conceptual minimalism — structured coats, muted palettes, and an intellectual rigour that has become Miuccia and Raf's signature. The Via Fogazzaro venue was stripped to concrete and light." },
      { id: "mf-b2", type: "text", content: "Versace countered with maximalist revival: gold Medusa hardware, body-conscious silhouettes, and a celebration of the house's DNA that felt both nostalgic and urgent. Donatella's after-show dinner at Palazzo Versace drew every A-lister in Milan." },
      { id: "mf-b3", type: "text", content: "The week's revelation was Bottega Veneta under Matthieu Blazy, whose collection of artisanal leatherwork, hand-painted fabrics, and deconstructed tailoring earned a standing ovation. Milan reminded the fashion world that Italian glamour is not a trend — it is a tradition." },
    ],
  },
  // --- January 2026 ---
  {
    id: "h-wef", title: "Davos 2026: The World Economic Forum's Annual Meeting", subtitle: "Record numbers of world leaders converge on Davos for five days of dialogue on AI, climate, and the global economy", category: "Tech & AI", imageUrl: heroDavosWef, date: "2026-01-19", edition: "2026-01",
    body: [
      { id: "wef-b1", type: "text", content: "The World Economic Forum's 2026 Annual Meeting in Davos brought record numbers of heads of state, CEOs, and thought leaders to the Swiss Alpine town for five days of intensive dialogue. AI regulation, climate finance, and the restructuring of global trade dominated the formal programme." },
      { id: "wef-b2", type: "text", content: "Beyond the Congress Centre, the real business of Davos unfolded in the private chalets and hotel suites that line the Promenade. Bilateral meetings between tech CEOs and government leaders, private dinners hosted by sovereign wealth funds, and invitation-only roundtables shaped decisions that will ripple through the global economy for years." },
      { id: "wef-b3", type: "text", content: "For the luxury world, Davos represents the ultimate networking nexus. The Steigenberger Grandhotel Belvédère, the Hotel Seehof, and the private residences that host parallel events create an ecosystem where influence, capital, and vision converge at 1,560 metres above sea level." },
    ],
  },
  {
    id: "h-snow-polo", title: "41st Snow Polo World Cup St. Moritz", subtitle: "The frozen lake becomes the world's most spectacular polo arena as Standing Rock claims the title", category: "Equestrian", imageUrl: heroSnowPolo, date: "2026-01-24", edition: "2026-01",
    body: [
      { id: "sp-b1", type: "text", content: "The 41st Snow Polo World Cup on the frozen Lake St. Moritz delivered three days of high-goal polo in the most spectacular setting in world sport. The tournament — the only high-goal polo event played on snow — attracts the finest players and the most discerning spectators to the Engadin Valley each January." },
      { id: "sp-b2", type: "text", content: "Standing Rock's victory in the final was a triumph of precision and tactical intelligence. Playing on the frozen lake demands adaptations that reward experience: the ball moves differently, the horses need specialised shoeing, and the altitude affects endurance. The winning team's mastery of these conditions was evident from the first chukker." },
      { id: "sp-b3", type: "text", content: "The VIP hospitality tents along the lake — hosted by sponsors including Maserati, Badrutt's Palace, and La Martina — provided champagne-fuelled viewing with the Engadin peaks as a backdrop. Snow Polo St. Moritz remains the ultimate expression of winter luxury sport: exclusive, beautiful, and utterly unique." },
    ],
  },
  {
    id: "h-haute-couture", title: "Paris Haute Couture Week SS26: The Art of the Extraordinary", subtitle: "From Chanel to Dior to Valentino — the pinnacle of fashion craftsmanship returns to the grand palaces of Paris", category: "Fashion", imageUrl: heroHauteCouture, date: "2026-01-26", edition: "2026-01",
    body: [
      { id: "hc-b1", type: "text", content: "Paris Haute Couture Week SS26 returned to the grand palaces and ateliers of the French capital with collections that reaffirmed couture's position as fashion's highest art. Chanel opened at the Grand Palais with a collection that celebrated the maison's tweed heritage through a contemporary lens — each piece requiring over 800 hours of handwork." },
      { id: "hc-b2", type: "text", content: "Dior's show at the Musée Rodin was a meditation on botanical beauty, with embroidered gowns that blurred the line between fashion and fine art. Valentino, under Pierpaolo Piccioli, continued to push couture toward minimalism with monochromatic looks of devastating simplicity and perfect proportion." },
      { id: "hc-b3", type: "text", content: "Haute Couture Week is more than fashion — it is a cultural event that brings the world's most important collectors, celebrities, and editors to Paris. The front rows at the Ritz, the private fittings at Avenue Montaigne, and the intimate dinners that follow each show create a week of unparalleled intimacy with the world's finest craft." },
    ],
  },
  // --- October 2025 --- (Heroes: SailGP, CV Summit, F1)
  {
    id: "h-sailgp",
    title: "SailGP from Geneva to Cadiz",
    subtitle: "Rolex Switzerland SailGP Grand Prix on Lake Geneva delivered a dramatic mix of tactics, light winds, and a breakthrough victory for Germany",
    category: "Yachting",
    imageUrl: articleSailgp,
    author: "Charlotte Thames",
    date: "2025-10-04",
    edition: "2025-10",
    body: [
      {
        id: "sg-b1",
        type: "text",
        content:
          "Last week's Rolex Switzerland SailGP Grand Prix on Lake Geneva delivered a dramatic mix of tactics, light winds, and a breakthrough victory for Germany in its first final and first win. Switzerland hosted SailGP for the first time, and the local crowd got more than just a glimpse of world-class foiling — they saw history.",
      },
      {
        id: "sg-b2",
        type: "text",
        content:
          "Being a freshwater venue, the conditions were challenging as teams were used to coastal and sea venues. Light winds forced teams to rethink tactics. The unpredictability of winds and shifting conditions meant that each start and positioning made a difference. SailGP commentators said the difference between success and failure was razor thin.",
      },
      {
        id: "sg-b3",
        type: "text",
        content:
          "The F50 catamarans require a certain wind threshold (about 28 km/h) to consistently stay foiling. In Geneva, wind speeds were often below that threshold, forcing boats to operate more in displacement mode, with hulls in the water, during parts of the race.",
      },
      {
        id: "sg-b4",
        type: "text",
        content:
          "Across day one and day two, New Zealand and Spain showed their strengths with wins in earlier races. Spain, led by Diego Botin and arriving from wins in San Francisco and New York, looked ready. The Black Foils, with Peter Burling at the helm, also came out strong by foiling early and securing key points.",
      },
      {
        id: "sg-b5",
        type: "text",
        content:
          "By the Final, Switzerland, led by Seb Schneiter and one of the league's youngest teams, had strong support from home fans but was penalized for an early start that cost them the win. Germany's victory came from precision and execution from start to finish. In fickle conditions where strategy had to adapt constantly, Germany reached its first final and first win, highlighting parity across teams.",
      },
      {
        id: "sg-b6",
        type: "text",
        content:
          "Next up in the run-up before the season finals is Cadiz, on Spanish home waters.",
      },
    ],
  },
  {
    id: "h-cv-summit",
    title: "CV Summit 2025 - Kongresshaus Zurich (September 23-24, 2025)",
    legacySlugs: ["zurichs-crypto-meets-ai"],
    subtitle: "A Recalibration Toward Endurance",
    category: "Tech & AI",
    imageUrl: articleCvSummit,
    author: "Millie Sealana",
    date: "2025-10-06",
    edition: "2025-10",
    body: [
      { id: "cv-b1", type: "heading", content: "A Recalibration Toward Endurance", textStyle: "bold" },
      { id: "cv-b2", type: "text", content: "CV Summit 2025 brought together thousands of delegates and 190 speakers at Kongresshaus Zurich, confirming blockchain and AI as the infrastructure of a new \"Wealth³\" era where programmable money, tokenized assets, and AI-powered agents are transforming financial systems. This year's edition occupied its familiar space as part alpine think-tank, part deal-floor, part Swiss-precision diplomacy — but the shift from spectacle to substance was unmistakable. Conversations moved from \"what's next\" to \"what endures.\" Olaf Hannemann, Co-Founder of CV VC, captured the spirit: \"Innovation has never been as fast as today, but will never be as slow ever again.\"" },
      { id: "cv-b3", type: "heading", content: "The AI-Blockchain Convergence", textStyle: "bold" },
      { id: "cv-b4", type: "text", content: "Across all stages, panelists explored autonomous financial agents—AI-driven systems capable of transacting, investing, and paying on behalf of humans—sparking debate on governance and accountability. Over 80 banks and financial institutions attended, alongside major blockchain platforms (Ethereum, Internet Computer, Canton Network, VeChain) and AI leaders (Google, Microsoft, Palantir). Franklin Templeton's Sandy Kaul and Roger Bayston revealed wealth management's shift from account-based to wallet-based systems, while Serge Kaulitz of Luzerner Kantonal Bank showcased Bitcoin and Ethereum as loan collateral. Philipp Rickenbacher, Chairman of CV VC, declared: \"Innovation does not happen incrementally. It only happens in big steps.\"" },
      { id: "cv-b5", type: "heading", content: "The Swiss Way Returns", textStyle: "bold" },
      { id: "cv-b6", type: "text", content: "Switzerland reaffirmed its leadership as home to 1,700+ blockchain-focused entities. Mathias Ruch, Founder & CEO of CV VC, reflected: \"Our vision was to bring bankers into the same room as builders. Five years ago, that was a bold bet. Today, it's the most natural conversation in the industry.\" After years of noise and over-funded experimentation, the most interesting ideas emerged from those building slowly, deliberately, with clarity of purpose — a return to fundamentals. The community is recalibrating itself: quieter, sharper, ready for a more disciplined era of innovation. The Magorium observed throughout, witnessing this transformation toward endurance over spectacle." },
    ],
  },
  {
    id: "h-f1-austin",
    title: "F1 returns to American soil in the tech haven of Austin.",
    subtitle: "The Singapore Grand Prix is notorious for being one of the toughest races physically for Formula 1 drivers.",
    category: "Motorsport",
    imageUrl: articleF1Americas,
    author: "Charlotte Thames",
    date: "2025-10-06",
    edition: "2025-10",
    body: [
      { id: "f1-b1", type: "text", content: "F1 returns to American soil in the tech haven of Austin." },
      { id: "f1-b2", type: "text", content: "The Singapore Grand Prix is notorious for being one of the toughest races physically for Formula 1 drivers as it was declared the first ‘heat hazard’ race of the year, meaning drivers either had to use a cooling vest or add extra ballast to their car. Max Verstappen chose not to." },
      { id: "f1-b3", type: "text", content: "The finals were tight as George Russell amazed the entire F1 paddock with a faultless display of skill from qualifying to the final race." },
      { id: "f1-b4", type: "text", content: "McLaren finished as Formula 1's top team at the Singapore Grand Prix on a challenging day for the 1,2, 3 finish of George Russell, Mercedes Benz AMG; Max Verstappen, Red Bull racing; and Lando Norris, McLaren." },
      { id: "f1-b5", type: "text", content: "Hamilton dropped to eighth, while Oliver Bearman was ninth for Haas and Carlos Sainz, Jr., after his win after his first podium win with Williams in Azerbaijian took a point in 10th as he had to start near the back of the grid for a technical infringement." },
      { id: "f1-b6", type: "text", content: "Lewis said he “raced for Roscoe”. Hamilton, just coming back from the terrible blow of losing his companion of the heart, Roscoe, was visibly affected as the entire F1 community witnessed. His innate reflexive well-honed driving skills compensated for his personal ordeal. Our hearts go out to Hamilton for the upcoming races." },
      { id: "f1-b7", type: "text", content: "Next up, F1 returns to American soil in Austin. If having Kygo and Garth Brooks as the event’s concert headliners is any indication of the disparity even in tech world Austin, the fans will undoubtedly be dazzled once again by the dramatic speed and strategy of Formula 1 racing. The official track record of 1:36.16 was set by Charles LeClerc in 2019. We will see if Carlos Sainz and his new Williams team along with the tech support of Atlassian, can on their secondary home of Austin take another podium." },
    ],
  },
];

// ===================================================================
// ARTICLES — 4 per edition, unique categories (no overlap with heroes)
// Feb 2026: Bay Area (Film & Festivals), Rio (Music), Dubai (Yachting), Pebble Beach (Golf)
// Jan 2026: LA (Film & Festivals), Singapore (Art & Design), Abu Dhabi (Travel), Melbourne (Tennis)
// Oct 2025: Geneva (Yachting), Zurich (Tech & AI), Basel (Travel), Marrakech (Music)
// ===================================================================
const DEFAULT_ARTICLES: Article[] = [
  // ========== FEBRUARY 2026 ==========
  {
    id: "a2",
    title: "Super Bowl LX: Stadium Lights & Bay Area Glamour",
    excerpt: "Levi's Stadium hosts the biggest night in American sport — VIP suites, halftime spectacle, and celebrity-heavy parties.",
    category: "Sports",
    imageUrl: articleSuperbowl,
    author: "James Whitfield",
    date: "2026-02-08",
    featured: true,
    edition: "2026-02",
    body: [
      { id: "sb-b1", type: "text", content: "Super Bowl LX at Levi's Stadium in the San Francisco Bay Area delivered the blend of sport, entertainment, and luxury that has made it America's defining cultural event. The halftime show, the VIP suites, and the celebrity-heavy after-parties transformed Silicon Valley into Hollywood South for one electric weekend." },
      { id: "sb-b2", type: "text", content: "The luxury ecosystem around the Super Bowl has become as significant as the game itself. Private aviation traffic into San Jose and Oakland surged, hotel suites at the Four Seasons and Rosewood Sand Hill were booked months in advance, and the official NFL Honors ceremony drew A-listers from sport, entertainment, and tech." },
    ],
  },
  {
    id: "a1",
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
    title: "Dubai International Boat Show: The Middle East's Premier Superyacht Gathering",
    excerpt: "Dubai Harbour transforms into the world's most glamorous marina — superyachts, private buyers, and the ultra-luxury maritime market converge under Arabian skies.",
    category: "Yachting",
    imageUrl: articleDubaiBoatShow,
    author: "James Whitfield",
    date: "2026-02-24",
    edition: "2026-02",
    body: [
      { id: "db-b1", type: "text", content: "The Dubai International Boat Show returned to Dubai Harbour for its most ambitious edition yet, cementing the emirate's position as the global epicentre of superyacht culture. Over 800 exhibitors and 200 vessels — including several 60-metre-plus superyachts making their Middle Eastern debut — lined the marina against the backdrop of the Dubai skyline." },
      { id: "db-b2", type: "text", content: "Unlike European boat shows that serve the broader maritime industry, Dubai's event is unapologetically focused on the ultra-high-net-worth buyer. Private viewing appointments, invitation-only evening galas aboard moored superyachts, and a curated programme of luxury lifestyle activations from Rolls-Royce, Bulgari, and Dom Pérignon set a tone that is more exclusive than commercial." },
      { id: "db-b3", type: "text", content: "The show's evolution mirrors Dubai's own trajectory: from regional curiosity to global luxury capital. With the Middle East's superyacht market growing at 15% annually, Dubai Harbour — purpose-built to accommodate the world's largest vessels — is now the winter berth of choice for owners who once looked only to Monaco and Antibes." },
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
    id: "v2-abu-dhabi-art",
    title: "Abu Dhabi Art 2026: The Gulf's Most Ambitious Cultural Moment",
    excerpt: "Manarat Al Saadiyat hosts the Middle East's premier contemporary art fair — 100 galleries, Louvre Abu Dhabi collaborations, and a collector programme that draws the world's elite.",
    category: "Travel",
    imageUrl: articleAbuDhabiArt,
    author: "Elena Voss",
    date: "2026-01-15",
    edition: "2026-01",
    body: [
      { id: "ad-b1", type: "text", content: "Abu Dhabi Art returned for its 16th edition at Manarat Al Saadiyat, the cultural heart of Saadiyat Island, confirming the UAE capital's emergence as a serious destination for collectors, curators, and cultural tourists. Over 100 galleries from 30 countries presented works spanning contemporary painting, sculpture, digital art, and large-scale installation." },
      { id: "ad-b2", type: "text", content: "The fair's proximity to the Louvre Abu Dhabi — Jean Nouvel's extraordinary museum under a dome of light — creates a cultural corridor unlike anything else in the region. VIP programming included private tours of the Louvre's latest acquisition, a Cy Twombly retrospective, and collector dinners at the Emirates Palace that blurred the line between art fair and state occasion." },
      { id: "ad-b3", type: "text", content: "For the luxury traveler, Abu Dhabi during Art week offers a singular proposition: world-class culture, Arabian hospitality, and winter sunshine. The desert dunes of the Empty Quarter are an hour away. The Royal Mansour-style suites at the Emirates Palace set a standard that few hotels on earth can match. Abu Dhabi is no longer Dubai's quieter sibling — it is its own cultural force." },
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

  // ========== OCTOBER 2025 ========== (Editor's Picks: Polo, PFW, Kusama, Marrakech)
  {
    id: "v1-cambiaso",
    title: "132nd Hurlingham Open: La Natividad La Dolfina Establish A New Standard Under Pressure",
    excerpt: "The 132nd Hurlingham Open unfolded with two teams whom are are forced to rethink their assumptions rather than rely on routine.",
    category: "Equestrian",
    imageUrl: articleCambiaso,
    author: "Millie Sealana",
    date: "2025-10-06",
    edition: "2025-10",
    body: [
      { id: "polo-b1", type: "text", content: "The 132nd Hurlingham Open unfolded with two teams whom are are forced to rethink their assumptions rather than rely on routine. On the historic turf at Hurlingham, La Natividad La Dolfina, in their first title since the merger of the two teams, delivered a win that didn’t hinge on overpowering their opponent, but on interpreting a match that evolved in real time. It brought father and son, Adolfo and Poroto Cambiaso back on home soil." },
      { id: "polo-b2", type: "text", content: "Their 12–9 result over UAE Polo signaled far more than a strong showing at the start of the Triple Crown. It revealed a team learning to operate as a single unit, navigating momentum shifts with the kind of clarity that only comes from maturity, trust, and an unspoken internal rhythm." },
      { id: "polo-b3", type: "image", content: articleCambiasoPhoto1, caption: "Photo: La Dolfina" },
      { id: "polo-b4", type: "heading", content: "A Beginning Without Clear Lines", textStyle: "bold" },
      { id: "polo-b5", type: "text", content: "The opening chukkers felt controlled but uncertain — not chaotic, but undefined. UAE Polo entered with a familiar structure: tight spacing, disciplined rotation, and a pace that made the early exchanges feel almost cautious. Their approach limited open lanes and challenged La Natividad La Dolfina to search for patterns rather than impose them." },
      { id: "polo-b6", type: "text", content: "Both sides tested, waited, and absorbed. The match resembled a strategic conversation where each team attempted to read the other’s intentions before revealing their own." },
      { id: "polo-b7", type: "image", content: articleCambiasoPhoto2, caption: "Photo: La Dolfina" },
      { id: "polo-b8", type: "text", content: "Camilo “Jeta” Castagnola emerged as the primary reference point. His goals — eight in total —shifting the momentum to not dip back into equilibrium. Accuracy created separation and composure controlled tempo. Bartolomé Castagnola Jr. anchored the defensive side of the equation, absorbing UAE’s heaviest attacks" },
      { id: "polo-b9", type: "heading", content: "Cambiaso’s Signature Influence", textStyle: "bold" },
      { id: "polo-b10", type: "text", content: "Adolfo Cambiaso provided the layer of interpretation needed — steering tempo, adjusting field shape, and adding the two goals that mattered more for timing than for their numbers." },
      { id: "polo-b11", type: "text", content: "Poroto Cambiaso linked the lines with fluidity, smoothing transitions from recovery to attack and ensuring the momentum held steady during the match’s most volatile periods." },
      { id: "polo-b12", type: "text", content: "Together, the four created a sense of cohesion that felt more intentional with each passing chukker." },
      { id: "polo-b13", type: "heading", content: "UAE’s Challenge and the Defining Moment", textStyle: "bold" },
      { id: "polo-b14", type: "text", content: "UAE Polo did not retreat. They played with a controlled edge, forcing La Natividad La Dolfina into full concentration. Their strongest sequences came at moments when the match felt poised to turn — and one late collision involving Lucas Monteverde briefly froze the stadium. A penalty there could have tightened the score and reintroduced pressure. A neutral restart. Ensued." },
      { id: "polo-b15", type: "text", content: "La Natividad La Dolfina won the toss-in immediately. Momentum shifted definitively." },
      { id: "polo-b16", type: "text", content: "It was a reminder that in matches balanced this tightly, outcomes are shaped not by a single incident, but by how quickly a team can capitalize on the window it creates." },
      { id: "polo-b17", type: "heading", content: "A Team Defining Itself", textStyle: "bold" },
      { id: "polo-b18", type: "text", content: "This victory did not lean on history or reputation. It felt like a team constructing an identity from the inside out — one built on: controlled acceleration, coordinated defensive shift and disciplined decision-making under tension" },
      { id: "polo-b19", type: "image", content: articleCambiasoPhoto2, caption: "Photo: La Dolfina" },
      { id: "polo-b20", type: "heading", content: "A Season Opening With Intention", textStyle: "bold" },
      { id: "polo-b21", type: "text", content: "With Hurlingham complete, the tour moves toward Tortugas and Palermo. La Natividad La Dolfina demonstrated their capacity to adapt, absorb pressure, and convert opportunity." },
      { id: "polo-b22", type: "text", content: "It is the kind of win that shapes a season not through spectacle, but through clarity. The road to the Triple Crown is underway. Next stop, Tortugas." },
    ],
  },
  {
    id: "v1-pfw",
    title: "Blazy Takes in Paris Fashion Week",
    excerpt: "Paris Fashion Week SS26 delivered drama, artistry, and statement-making collections — from Dior's garden romanticism to Balenciaga's architectural precision.",
    category: "Fashion",
    imageUrl: articlePfw,
    author: "Charlotte Thames",
    date: "2025-10-01",
    edition: "2025-10",
    body: [
      { id: "pfw-b1", type: "text", content: "Paris Fashion Week SS26 opened with Dior's ethereal garden collection at the Musée Rodin, where Maria Grazia Chiuri transformed the courtyard into a dreamscape of tulle, embroidery, and botanical motifs. The collection was a meditation on femininity and nature — each piece more delicate than the last." },
      { id: "pfw-b2", type: "text", content: "At Balenciaga, Demna continued his exploration of architectural silhouettes, sending models down a stark industrial runway in exaggerated shoulders and sculptural coats. The contrast with Dior couldn't have been more striking — yet both houses captured the essence of Parisian couture: uncompromising vision." },
      { id: "pfw-b3", type: "text", content: "The week's standout moment came at Chanel, where Virginie Viard staged a show along the Seine at sunset. Models walked on a floating barge as the Eiffel Tower glittered in the background — a reminder that Paris Fashion Week remains the industry's most theatrical stage." },
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
    id: "v1-engadin",
    title: "Engadin Awaits the Winter",
    excerpt: "There is no other region in the world like the Engadin — from St. Moritz to Davos Klosters. The lakes freeze, the light shifts, and the valley transforms.",
    category: "Travel",
    imageUrl: articleEngadin,
    author: "Millie Sealana",
    date: "2025-10-06",
    edition: "2025-10",
    body: [
      { id: "eng-b1", type: "text", content: "The Engadin in late autumn is a quiet pause before the endless myriad of choices for skiers and non skiers alike. There is no other region in the world like the Engadin, from St. Moritz to Davos Klosters to the quieter towns of Scuol and Arosa. Winter is non stop with everything from A-to-Z. The lakes freeze from the edges inward, the light shifts to a colder blue, and the valley begins its quiet transformation into the winter playground the world knows so well." },
      { id: "eng-b2", type: "text", content: "St. Moritz is already rehearsing for its defining months: opening with FIS World Cup in action, Snow Polo, the White Turf races and the International Concours of Elegance (ICE). Everywhere is preparing for the gorgeous diamond-like snow to come. The private chalet gatherings, the art, the design, the discreet international arrivals that shape the season." },
      { id: "eng-b3", type: "text", content: "What differentiates the Engadin from any other alpine destination is not scale — it is choreography. Every winter unfolds like a curated performance, layered with tradition but never static. This year, the mood is unmistakably elevated: more intimate, more global, and somehow sharper, as if the valley is preparing for an inflection point." },
      { id: "eng-b4", type: "text", content: "Winter has yet to arrive. But you can feel it approaching with anticipation." },
    ],
  },
];

const DEFAULT_ADS: AdSlot[] = [
  { id: "ad1", label: "Hero Sidebar Ad", position: "hero-sidebar", width: 300, height: 250 },
  { id: "ad2", label: "Mid-Feed Banner", position: "mid-feed", width: 728, height: 90 },
  { id: "ad3", label: "Bottom Banner", position: "bottom-banner", width: 970, height: 250 },
  { id: "ad4", label: "Sidebar Ad", position: "sidebar", width: 300, height: 600 },
];

const HERO_DEFAULT_BY_ID = new Map(DEFAULT_HEROES.map((hero) => [hero.id, hero]));
const ARTICLE_DEFAULT_BY_ID = new Map(DEFAULT_ARTICLES.map((article) => [article.id, article]));
const CRITICAL_HERO_IDS = ["h-sailgp", "h-cv-summit", "h-f1-austin"] as const;
const CRITICAL_ARTICLE_IDS = ["v1-cambiaso", "v1-engadin"] as const;

function upsertCriticalHeroFallbacks(heroes: HeroItem[], options?: { forceWhenMissingAll?: boolean }): HeroItem[] {
  const next = [...heroes];
  if (!options?.forceWhenMissingAll && next.length > 0) {
    return next;
  }
  for (const id of CRITICAL_HERO_IDS) {
    if (next.some((hero) => hero.id === id)) continue;
    const fallback = HERO_DEFAULT_BY_ID.get(id);
    if (!fallback) continue;
    const insertAt = next.findIndex((hero) => hero.edition === fallback.edition);
    if (insertAt === -1) {
      next.push(fallback);
    } else {
      next.splice(insertAt, 0, fallback);
    }
  }
  return next;
}

function upsertCriticalArticleFallbacks(articles: Article[], options?: { forceWhenMissingAll?: boolean }) {
  const next = [...articles];
  if (!options?.forceWhenMissingAll && next.length > 0) {
    return next;
  }
  for (const id of CRITICAL_ARTICLE_IDS) {
    if (next.some((article) => article.id === id)) continue;
    const fallback = ARTICLE_DEFAULT_BY_ID.get(id);
    if (!fallback) continue;
    const insertAt = next.findIndex((article) => article.edition === fallback.edition);
    if (insertAt === -1) {
      next.push(fallback);
    } else {
      next.splice(insertAt, 0, fallback);
    }
  }
  return next;
}

function applyCriticalStoryBackfill(content: { heroes: HeroItem[]; articles: Article[] }) {
  const shouldForceBackfill = content.heroes.length === 0 && content.articles.length === 0;
  return {
    heroes: upsertCriticalHeroFallbacks(content.heroes, { forceWhenMissingAll: shouldForceBackfill }),
    articles: upsertCriticalArticleFallbacks(content.articles, {
      forceWhenMissingAll: shouldForceBackfill,
    }),
  };
}

function shouldUpgradeLegacyHeroCopy(hero: HeroItem) {
  const firstText = (hero.body || []).find((block) => block.type === "text")?.content || "";
  const normalizedAuthor = (hero.author || "").trim().toLowerCase();
  if (
    hero.id === "h-sailgp" &&
    firstText.startsWith(
      "The Rolex Switzerland SailGP Grand Prix transformed Lake Geneva into the most spectacular racecourse in sailing history.",
    )
  ) {
    return true;
  }
  if (hero.id === "h-cv-summit" && hero.title === "Zurich's CV Summit: Capital Meets AI by the Lake") {
    return true;
  }
  if (
    hero.id === "h-cv-summit" &&
    hero.subtitle ===
      "CV Summit 2025 at the Kongresshaus united 3,000+ tech leaders, investors and innovators — shifting from spectacle to substance"
  ) {
    return true;
  }
  if (
    hero.id === "h-f1-austin" &&
    hero.subtitle === "Austin's tech haven welcomes Formula 1 — where Russell amazed and Hamilton raced for Roscoe"
  ) {
    return true;
  }
  if (
    hero.id === "h-f1-austin" &&
    hero.subtitle === "Just on the heels of Singapore, F1 heads to Austin's tech haven — where Russell amazed and Hamilton raced for Roscoe."
  ) {
    return true;
  }
  if (hero.id === "h-f1-austin" && hero.date === "2025-10-20") {
    return true;
  }
  if (
    hero.id === "h-f1-austin" &&
    firstText.startsWith(
      "The United States Grand Prix at the Circuit of the Americas delivered one of the season's most compelling weekends.",
    )
  ) {
    return true;
  }
  if (
    hero.id === "h-f1-austin" &&
    firstText.startsWith(
      "Just on the heels of the Singapore Grand Prix, which is notorious for being one of the toughest races physically",
    )
  ) {
    return true;
  }
  if (hero.id === "h-f1-austin" && normalizedAuthor !== "charlotte thames") {
    return true;
  }
  return false;
}

function shouldUpgradeLegacyArticleCopy(article: Article) {
  const firstText = (article.body || []).find((block) => block.type === "text")?.content || "";
  if (article.id === "v1-cambiaso" && article.title === "Cambiaso x Cambiaso: The Hurlingham Open") {
    return true;
  }
  if (article.id === "v1-cambiaso" && article.title === "Cambiaso x Cambiaso: Hurlingham and a New Legacy Begins") {
    return true;
  }
  if (
    article.id === "v1-cambiaso" &&
    firstText.startsWith(
      "The Hurlingham Open marked a historic moment as Adolfo Cambiaso and his son Poroto took to the field together",
    )
  ) {
    return true;
  }
  if (article.id === "v1-engadin" && article.title === "Winter Awaits the Engadin") {
    return true;
  }
  if (
    article.id === "v1-engadin" &&
    firstText.startsWith(
      "The Engadin Valley awakens in October with the first dustings of snow on the Bernina peaks.",
    )
  ) {
    return true;
  }
  return false;
}

function upgradeLegacyHeroCopy(hero: HeroItem): HeroItem {
  if (!shouldUpgradeLegacyHeroCopy(hero)) return hero;
  const canonical = HERO_DEFAULT_BY_ID.get(hero.id);
  if (!canonical) return hero;
  return {
    ...hero,
    title: canonical.title,
    subtitle: canonical.subtitle,
    excerpt: canonical.excerpt,
    author: canonical.author,
    date: canonical.date,
    legacySlugs: canonical.legacySlugs,
    body: canonical.body,
  };
}

function upgradeLegacyArticleCopy(article: Article): Article {
  if (!shouldUpgradeLegacyArticleCopy(article)) return article;
  const canonical = ARTICLE_DEFAULT_BY_ID.get(article.id);
  if (!canonical) return article;
  return {
    ...article,
    title: canonical.title,
    excerpt: canonical.excerpt,
    author: canonical.author,
    date: canonical.date,
    legacySlugs: canonical.legacySlugs,
    body: canonical.body,
  };
}

// ===== Storage & API =====
// Bump this version whenever DEFAULT content changes to invalidate stale localStorage
const CONTENT_VERSION = "4";
const PUBLISHED_CONTENT_ENDPOINT = "/api/content";
const STORAGE_KEYS = {
  heroes: "editorial_heroes",
  articles: "editorial_articles",
  ads: "editorial_ads",
  version: "editorial_content_version",
  localDraft: "editorial_has_local_draft",
};

function markLocalDraftAvailable() {
  localStorage.setItem(STORAGE_KEYS.localDraft, "1");
}

function clearLocalDraftFlag() {
  localStorage.removeItem(STORAGE_KEYS.localDraft);
}

function isPublishedContentPayload(value: unknown): value is PublishedEditorialContent {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PublishedEditorialContent>;
  return (
    Array.isArray(candidate.heroes) &&
    Array.isArray(candidate.articles) &&
    Array.isArray(candidate.ads) &&
    typeof candidate.publishedAt === "string"
  );
}

function writePublishedContentToLocalStorage(content: PublishedEditorialContent) {
  const backfilled = applyCriticalStoryBackfill({
    heroes: content.heroes,
    articles: content.articles,
  });
  localStorage.setItem(STORAGE_KEYS.heroes, JSON.stringify(backfilled.heroes));
  localStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(backfilled.articles));
  localStorage.setItem(STORAGE_KEYS.ads, JSON.stringify(content.ads));
  localStorage.setItem(STORAGE_KEYS.version, CONTENT_VERSION);
  clearLocalDraftFlag();
}

function ensureFreshDefaults() {
  const storedVersion = localStorage.getItem(STORAGE_KEYS.version);
  if (storedVersion !== CONTENT_VERSION) {
    localStorage.removeItem(STORAGE_KEYS.heroes);
    localStorage.removeItem(STORAGE_KEYS.articles);
    localStorage.removeItem(STORAGE_KEYS.ads);
    clearLocalDraftFlag();
    localStorage.setItem(STORAGE_KEYS.version, CONTENT_VERSION);
  }
}

export function getHeroes(): HeroItem[] {
  ensureFreshDefaults();
  const stored = localStorage.getItem(STORAGE_KEYS.heroes);
  const rawHeroes = stored ? (JSON.parse(stored) as HeroItem[]) : DEFAULT_HEROES;
  const backfilledHeroes = upsertCriticalHeroFallbacks(rawHeroes, {
    forceWhenMissingAll: rawHeroes.length === 0 && Boolean(stored),
  });
  return backfilledHeroes.map(normalizeHero);
}

export function getArticles(): Article[] {
  ensureFreshDefaults();
  const stored = localStorage.getItem(STORAGE_KEYS.articles);
  const rawArticles = stored ? (JSON.parse(stored) as Article[]) : DEFAULT_ARTICLES;
  const backfilledArticles = upsertCriticalArticleFallbacks(rawArticles, {
    forceWhenMissingAll: rawArticles.length === 0 && Boolean(stored),
  });
  return backfilledArticles.map(normalizeArticle);
}

export function getAds(): AdSlot[] {
  const stored = localStorage.getItem(STORAGE_KEYS.ads);
  return stored ? JSON.parse(stored) : DEFAULT_ADS;
}

function hasRealBodyBlockContent(block: ArticleBodyBlock): boolean {
  if (block.type === "text" || block.type === "heading") {
    return Boolean((block.content || "").trim());
  }
  if (block.type === "image" || block.type === "video") {
    return Boolean((block.content || "").trim());
  }
  return false;
}

function cleanBodyForStorage(body?: ArticleBodyBlock[]): ArticleBodyBlock[] | undefined {
  if (!body || body.length === 0) return body;
  const cleaned = body.filter(hasRealBodyBlockContent);
  return cleaned.length > 0 ? cleaned : [];
}

function dedupeBodyByMediaContent(body?: ArticleBodyBlock[]): ArticleBodyBlock[] | undefined {
  if (!body || body.length === 0) return body;
  const seenMediaContent = new Set<string>();
  const deduped: ArticleBodyBlock[] = [];

  for (const block of body) {
    if (!block) continue;
    if (block.type === "image" || block.type === "video") {
      const mediaKey = `${block.type}:${(block.content || "").trim()}`;
      if (!block.content || seenMediaContent.has(mediaKey)) {
        continue;
      }
      seenMediaContent.add(mediaKey);
    }
    deduped.push(block);
  }

  return deduped;
}

export function saveHeroes(heroes: HeroItem[]) {
  const prepared = heroes.map((hero) =>
    normalizeHero({
      ...hero,
      body: cleanBodyForStorage(dedupeBodyByMediaContent(hero.body)),
    }),
  );
  markLocalDraftAvailable();
  localStorage.setItem(STORAGE_KEYS.heroes, JSON.stringify(prepared));
}

export function saveArticles(articles: Article[]) {
  const prepared = articles.map((article) =>
    normalizeArticle({
      ...article,
      body: cleanBodyForStorage(dedupeBodyByMediaContent(article.body)),
    }),
  );
  markLocalDraftAvailable();
  localStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(prepared));
}

export function saveAds(ads: AdSlot[]) {
  markLocalDraftAvailable();
  localStorage.setItem(STORAGE_KEYS.ads, JSON.stringify(ads));
}

export function restoreDefaultContentBackup() {
  markLocalDraftAvailable();
  localStorage.setItem(STORAGE_KEYS.heroes, JSON.stringify(DEFAULT_HEROES.map(normalizeHero)));
  localStorage.setItem(STORAGE_KEYS.articles, JSON.stringify(DEFAULT_ARTICLES.map(normalizeArticle)));
  localStorage.setItem(STORAGE_KEYS.ads, JSON.stringify(DEFAULT_ADS));
  localStorage.setItem(STORAGE_KEYS.version, CONTENT_VERSION);
}

export async function publishContentSnapshot(heroes: HeroItem[], articles: Article[], ads: AdSlot[]) {
  const response = await fetch(PUBLISHED_CONTENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ heroes, articles, ads }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({} as { error?: string }));
    throw new Error(payload.error || "Publishing failed.");
  }
}

export const DEFAULT_PUBLISHED_CONTENT: {
  heroes: HeroItem[];
  articles: Article[];
  ads: AdSlot[];
} = {
  heroes: DEFAULT_HEROES.map(normalizeHero),
  articles: DEFAULT_ARTICLES.map(normalizeArticle),
  ads: DEFAULT_ADS,
};

function hasLocalEditsAvailable() {
  if (typeof window === "undefined") return false;
  ensureFreshDefaults();
  const hasDraftFlag = localStorage.getItem(STORAGE_KEYS.localDraft) === "1";
  if (!hasDraftFlag) return false;
  const hasHeroes = Boolean(localStorage.getItem(STORAGE_KEYS.heroes));
  const hasArticles = Boolean(localStorage.getItem(STORAGE_KEYS.articles));
  return hasHeroes || hasArticles;
}

function hasCachedSnapshotAvailable() {
  if (typeof window === "undefined") return false;
  const hasHeroes = Boolean(localStorage.getItem(STORAGE_KEYS.heroes));
  const hasArticles = Boolean(localStorage.getItem(STORAGE_KEYS.articles));
  return hasHeroes || hasArticles;
}

function hasPublishedStoryContent(content: { heroes: HeroItem[]; articles: Article[] }) {
  return content.heroes.length > 0 || content.articles.length > 0;
}

export async function getPublishedContentSnapshot(): Promise<{
  heroes: HeroItem[];
  articles: Article[];
  ads: AdSlot[];
}> {
  if (typeof window === "undefined") {
    return DEFAULT_PUBLISHED_CONTENT;
  }
  ensureFreshDefaults();
  if (hasLocalEditsAvailable()) {
    return {
      heroes: getHeroes(),
      articles: getArticles(),
      ads: getAds(),
    };
  }
  try {
    const response = await fetch(PUBLISHED_CONTENT_ENDPOINT, { cache: "no-store" });
    if (!response.ok) {
      if (hasCachedSnapshotAvailable()) {
        return {
          heroes: getHeroes(),
          articles: getArticles(),
          ads: getAds(),
        };
      }
      return DEFAULT_PUBLISHED_CONTENT;
    }
    const payload = await response.json().catch(() => null as unknown as {
      heroes?: HeroItem[];
      articles?: Article[];
      ads?: AdSlot[];
      payload?: {
        heroes?: HeroItem[];
        articles?: Article[];
        ads?: AdSlot[];
      };
      content?: {
        heroes?: HeroItem[];
        articles?: Article[];
        ads?: AdSlot[];
      };
    } | null);
    const raw = payload?.payload || payload?.content || payload;
    if (!raw || !Array.isArray(raw.heroes) || !Array.isArray(raw.articles) || !Array.isArray(raw.ads)) {
      if (hasCachedSnapshotAvailable()) {
        return {
          heroes: getHeroes(),
          articles: getArticles(),
          ads: getAds(),
        };
      }
      return DEFAULT_PUBLISHED_CONTENT;
    }
    const backfilled = applyCriticalStoryBackfill({
      heroes: raw.heroes,
      articles: raw.articles,
    });
    const normalized = {
      heroes: backfilled.heroes.map(normalizeHero),
      articles: backfilled.articles.map(normalizeArticle),
      ads: raw.ads,
    };
    if (!hasPublishedStoryContent(normalized)) {
      if (hasCachedSnapshotAvailable()) {
        return {
          heroes: getHeroes(),
          articles: getArticles(),
          ads: getAds(),
        };
      }
      return DEFAULT_PUBLISHED_CONTENT;
    }
    return normalized;
  } catch {
    if (hasCachedSnapshotAvailable()) {
      return {
        heroes: getHeroes(),
        articles: getArticles(),
        ads: getAds(),
      };
    }
    return DEFAULT_PUBLISHED_CONTENT;
  }
}

export function resetToDefaults() {
  localStorage.removeItem(STORAGE_KEYS.heroes);
  localStorage.removeItem(STORAGE_KEYS.articles);
  localStorage.removeItem(STORAGE_KEYS.ads);
  clearLocalDraftFlag();
}

export async function syncPublishedContentToLocalStorage() {
  if (typeof window === "undefined") {
    return { synced: false, configured: false };
  }
  ensureFreshDefaults();
  if (hasLocalEditsAvailable()) {
    return { synced: false, configured: false };
  }

  try {
    const response = await fetch(PUBLISHED_CONTENT_ENDPOINT, { cache: "no-store" });
    if (!response.ok) return { synced: false, configured: false };

    const payload = (await response.json()) as {
      ok?: boolean;
      success?: boolean;
      content?: unknown;
      payload?: unknown;
    };

    const ok = payload.ok ?? payload.success ?? false;
    if (!ok) {
      return { synced: false, configured: false };
    }

    const published = payload.content ?? payload.payload;
    if (!isPublishedContentPayload(published)) {
      return { synced: false, configured: true };
    }
    if (!hasPublishedStoryContent(published)) {
      return { synced: false, configured: true };
    }

    writePublishedContentToLocalStorage(published);
    return {
      synced: true,
      configured: true,
      publishedAt: published.publishedAt,
    };
  } catch {
    return { synced: false, configured: false };
  }
}

export async function publishEditorialContent(
  content: Omit<PublishedEditorialContent, "publishedAt">,
  adminPassword?: string,
) {
  try {
    const response = await fetch(PUBLISHED_CONTENT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adminPassword ? { "x-admin-password": adminPassword } : {}),
      },
      body: JSON.stringify(content),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      success?: boolean;
      error?: string;
      publishedAt?: string;
      updatedAt?: string;
    };

    const ok = payload.ok ?? payload.success ?? false;
    if (!response.ok || !ok) {
      return {
        success: false,
        configured: true,
        error: payload.error || "Publish request failed.",
      };
    }

    return {
      success: true,
      configured: true,
      publishedAt: payload.publishedAt || payload.updatedAt,
    };
  } catch {
    return {
      success: false,
      configured: false,
      error: "Network error while publishing content.",
    };
  }
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

function createMediaTextPatternBody(articleId: string): ArticleBodyBlock[] {
  const now = Date.now();
  return [
    {
      id: `${articleId}-m1-${now}`,
      type: "image",
      content: "",
      caption: "",
      citation: "",
    },
    {
      id: `${articleId}-t1-${now + 1}`,
      type: "text",
      content: "",
    },
    {
      id: `${articleId}-m2-${now + 2}`,
      type: "image",
      content: "",
      caption: "",
      citation: "",
    },
    {
      id: `${articleId}-t2-${now + 3}`,
      type: "text",
      content: "",
    },
    {
      id: `${articleId}-m3-${now + 4}`,
      type: "image",
      content: "",
      caption: "",
      citation: "",
    },
    {
      id: `${articleId}-t3-${now + 5}`,
      type: "text",
      content: "",
    },
  ];
}

function normalizeBodyToMediaTextPattern(itemId: string, blocks?: ArticleBodyBlock[]): ArticleBodyBlock[] {
  const source = (blocks || []).filter((b) => b && b.type !== "heading");
  if (source.length === 0) return createMediaTextPatternBody(itemId);

  const media = source.filter((b) => b.type === "image" || b.type === "video");
  const text = source.filter((b) => b.type === "text");

  const normalized: ArticleBodyBlock[] = [];
  const pairs = Math.max(3, Math.min(6, Math.max(media.length, text.length)));
  const now = Date.now();

  for (let i = 0; i < pairs; i += 1) {
    const mediaBlock = media[i] || {
      id: `${itemId}-m-${now}-${i}`,
      type: "image" as const,
      content: "",
      caption: "",
      citation: "",
    };
    normalized.push({
      id: mediaBlock.id || `${itemId}-m-${now}-${i}`,
      type: mediaBlock.type === "video" ? "video" : "image",
      content: mediaBlock.content || "",
      caption: mediaBlock.caption || "",
      citation: mediaBlock.citation || "",
    });

    const textBlock = text[i] || {
      id: `${itemId}-t-${now}-${i}`,
      type: "text" as const,
      content: "",
    };
    normalized.push({
      id: textBlock.id || `${itemId}-t-${now}-${i}`,
      type: "text",
      content: textBlock.content || "",
      textStyle: textBlock.textStyle || "normal",
    });
  }

  return normalized;
}

export function enforceEditionPattern(heroes: HeroItem[], articles: Article[]) {
  const normalizedHeroes = heroes.map((hero) => ({
    ...hero,
    body: normalizeBodyToMediaTextPattern(hero.id, hero.body),
  }));
  const normalizedArticles = articles.map((article) => ({
    ...article,
    body: normalizeBodyToMediaTextPattern(article.id, article.body),
  }));
  return { heroes: normalizedHeroes, articles: normalizedArticles };
}
