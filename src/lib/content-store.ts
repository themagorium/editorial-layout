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
// Volume 2 — January 2026
import heroDavosWef from "@/assets/hero-davos-wef.jpg";
import heroSnowPolo from "@/assets/hero-snow-polo.jpg";
import heroHauteCouture from "@/assets/hero-haute-couture.jpg";
import articleGoldenGlobes from "@/assets/article-golden-globes.jpg";
import articleLvmhWatches from "@/assets/article-lvmh-watches.jpg";
import articleDiorBristol from "@/assets/article-dior-bristol.jpg";
import articleVicenzaoro from "@/assets/article-vicenzaoro.jpg";
import articleArtSg from "@/assets/article-art-sg.jpg";

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
  edition: string; // e.g. "2026-02"
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
  edition: string; // e.g. "2026-02"
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
  // --- February 2026 ---
  {
    id: "h1",
    title: "Winter Olympics XXV: Milano-Cortina 2026",
    subtitle: "The Dolomites prepare to host the world's greatest winter spectacle — a complete preview",
    category: "Travel",
    imageUrl: heroOlympics,
    date: "2026-02-06",
    edition: "2026-02",
  },
  {
    id: "h2",
    title: "Milan Fashion Week: The New Gilded Age",
    subtitle: "A front-row look at the collections defining this decade",
    category: "Fashion",
    imageUrl: heroMilanFashion,
    date: "2026-02-25",
    edition: "2026-02",
  },
  {
    id: "h3",
    title: "White Turf: Racing on Ice in St. Moritz",
    subtitle: "The world's most glamorous winter horse racing returns to the frozen lake of the Engadin",
    category: "Equestrian",
    imageUrl: heroWhiteTurf,
    date: "2026-02-15",
    edition: "2026-02",
  },
  // --- January 2026 ---
  {
    id: "h-wef",
    title: "Davos 2026: The World Economic Forum's Annual Meeting",
    subtitle: "Record numbers of world leaders converge on Davos for five days of dialogue on AI, climate, and the global economy",
    category: "Tech & AI",
    imageUrl: heroDavosWef,
    date: "2026-01-19",
    edition: "2026-01",
  },
  {
    id: "h-snow-polo",
    title: "41st Snow Polo World Cup St. Moritz",
    subtitle: "The frozen lake becomes the world's most spectacular polo arena as Standing Rock claims the title",
    category: "Equestrian",
    imageUrl: heroSnowPolo,
    date: "2026-01-24",
    edition: "2026-01",
  },
  {
    id: "h-haute-couture",
    title: "Paris Haute Couture Week SS26: The Art of the Extraordinary",
    subtitle: "From Chanel to Dior to Valentino — the pinnacle of fashion craftsmanship returns to the grand palaces of Paris",
    category: "Fashion",
    imageUrl: heroHauteCouture,
    date: "2026-01-26",
    edition: "2026-01",
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
    edition: "2026-02",
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
  },
  {
    id: "a4",
    title: "ICE St. Moritz: The International Concours of Elegance",
    excerpt: "The world's only concours d'élégance held on a frozen lake — rare vintage masterpieces gleam against the Alpine winter sun in the Engadin.",
    category: "Motorsport",
    imageUrl: articleIceStMoritz,
    author: "Sophie Laurent",
    date: "2026-02-06",
    edition: "2026-02",
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
    edition: "2025-10",
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
    edition: "2025-10",
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
    edition: "2025-10",
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
    edition: "2025-10",
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
    edition: "2025-10",
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
    edition: "2025-10",
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
    edition: "2025-10",
    body: [
      { id: "pfw-b1", type: "text", content: "Matthieu Blazy's highly anticipated debut at Chanel and Sarah Burton's second collection at Givenchy defined the season at Paris Fashion Week SS26. The collections signaled a new chapter for both houses — one of quiet confidence and refined craftsmanship." },
    ],
  },
  // --- Volume 2 — January 2026 ---
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
      { id: "gg-b3", type: "text", content: "On the red carpet, the fashion was as deliberate as the performances being honored. Designers leaned into structured silhouettes, deep jewel tones, and bespoke tailoring — a visual echo of the evening's theme: precision over spectacle. The after-parties, from the InStyle suite to the Netflix gathering at Spago, hummed with the energy of an industry recalibrating its compass." },
      { id: "gg-b4", type: "text", content: "For the luxury world, the Golden Globes remain one of January's most important stages — a night where fashion, film, and cultural capital converge under the California palms." },
    ],
  },
  {
    id: "v2-lvmh-watches",
    title: "LVMH Watch Week Milan: The Year of the Fire Horse",
    excerpt: "Nine LVMH maisons unveiled their 2026 horological visions in Milan — from Bulgari to Hublot to Zenith, the seventh edition signaled a return to bold craftsmanship.",
    category: "Art & Design",
    imageUrl: articleLvmhWatches,
    author: "Millie Sealana",
    date: "2026-01-19",
    body: [
      { id: "lw-b1", type: "text", content: "The seventh edition of LVMH Watch Week moved to a single destination for the first time — Milan — after previous editions spanning Dubai, Singapore, Miami, New York, and Paris. From January 19–21, nine LVMH-owned maisons including Bulgari, Hublot, TAG Heuer, Zenith, and Louis Vuitton presented their latest horological creations to trade journalists, retailers, and select clients." },
      { id: "lw-b2", type: "text", content: "The choice of Milan was deliberate. As a city that straddles fashion, design, and industry, it provided the ideal backdrop for collections that emphasized material innovation and aesthetic risk. Bulgari unveiled complications that pushed the boundaries of ultra-thin movements, while Hublot leaned into bold material fusions that have become the house's signature." },
      { id: "lw-b3", type: "text", content: "TAG Heuer's presentation centered on its motorsport heritage with new chronographs designed for the modern collector, and Zenith continued its revival of the Chronomaster line. Louis Vuitton surprised with a trunk-inspired collection that merged travel heritage with haute horlogerie." },
      { id: "lw-b4", type: "text", content: "The mood across the exhibition was one of measured optimism. After a period of market correction in the luxury watch segment, the maisons signaled confidence through investment in craftsmanship rather than hype — a welcome recalibration for serious collectors." },
    ],
  },
  {
    id: "v2-dior-bristol",
    title: "Dior Masterpieces: The Mouna Ayoub Collection at Le Bristol Paris",
    excerpt: "126 haute couture pieces from Dior's golden era go on display at Le Bristol — a free exhibition during Paris Haute Couture Week that traces decades of the house's artistry.",
    category: "Fashion",
    imageUrl: articleDiorBristol,
    author: "Elena Voss",
    date: "2026-01-26",
    body: [
      { id: "db-b1", type: "text", content: "During Paris Haute Couture Week, Le Bristol Paris opened its grand salons to an extraordinary exhibition: 'Dior Masterpieces: The Mouna Ayoub Collection.' The free exhibition showcased 126 haute couture pieces spanning decades of the house's artistry — from the New Look era through to contemporary collections." },
      { id: "db-b2", type: "text", content: "Collector Mouna Ayoub, one of the world's foremost private holders of haute couture, curated the display with the precision of a museum director. Each gown occupied its own space within the hotel's ornate rooms, the crystal chandeliers and marble floors providing a setting that felt less like an exhibition and more like a private audience with fashion history." },
      { id: "db-b3", type: "text", content: "The timing was impeccable. As Paris Haute Couture Week unfolded across the city — with Chanel, Valentino, and Givenchy presenting their Spring 2026 collections — Le Bristol offered a counterpoint: a reminder that couture's power lies not just in the new, but in the enduring conversation between past and present craftsmanship." },
    ],
  },
  {
    id: "v2-snow-polo",
    title: "Standing Rock Claims the 41st Snow Polo World Cup St. Moritz",
    excerpt: "On the frozen lake of St. Moritz, Standing Rock defeated Flexjet in a championship match that embodied the tournament's unique blend of sport, spectacle, and alpine glamour.",
    category: "Equestrian",
    imageUrl: heroSnowPolo,
    author: "Millie Sealana",
    date: "2026-01-25",
    body: [
      { id: "sp-b1", type: "text", content: "The 41st Snow Polo World Cup St. Moritz concluded on Sunday, January 25, with Standing Rock defeating Flexjet in a championship match played on the frozen surface of Lake St. Moritz. The tournament — the world's most prestigious snow polo event — brought four teams to the Engadin for three days of competition against the backdrop of the Swiss Alps." },
      { id: "sp-b2", type: "text", content: "The conditions were quintessential St. Moritz: crisp winter air, brilliant sunshine, and the distinctive crunch of hooves on compacted snow. The frozen lake, which has hosted the tournament for over four decades, provided a surface that demanded both precision and adaptability from players and horses alike." },
      { id: "sp-b3", type: "text", content: "Standing Rock's victory was built on tactical discipline and fluid transitions between attack and defense. The team controlled the pace of the final, preventing Flexjet from establishing the rhythm that had carried them through the group stages. Key goals in the third and fourth chukkers created separation that proved decisive." },
      { id: "sp-b4", type: "text", content: "Beyond the pitch, the Snow Polo World Cup remains one of the winter social calendar's most coveted events. The VIP tent, the Cartier lounge, and the champagne terraces along the lake's edge drew an international crowd that understands the tournament as much as a social occasion as a sporting one. St. Moritz, once again, proved why it remains the undisputed capital of winter luxury sport." },
    ],
  },
  {
    id: "v2-vicenzaoro",
    title: "Vicenzaoro January 2026: The Global Jewellery Industry Converges in Italy",
    excerpt: "Over 1,300 exhibiting brands gathered in Vicenza for the first major international jewellery business platform of the year — another sold-out edition redefining the industry.",
    category: "Art & Design",
    imageUrl: articleVicenzaoro,
    author: "Elena Voss",
    date: "2026-01-16",
    body: [
      { id: "vz-b1", type: "text", content: "Vicenzaoro returned from January 16–20 as the first major international business platform of the year for the global jewellery supply chain. Organised by Italian Exhibition Group at the Vicenza Expo Centre, the show recorded another sold-out edition with over 1,300 exhibiting brands. International exhibitors accounted for a significant share, underscoring Vicenza's role as a global crossroads for the industry." },
      { id: "vz-b2", type: "text", content: "The exhibition spanned the full spectrum of the jewellery world — from high jewellery and fine craftsmanship to emerging designers and technology-driven innovation. Italian goldsmiths from the Valenza, Arezzo, and Vicenza districts showcased collections that balanced traditional artisanship with contemporary design sensibility." },
      { id: "vz-b3", type: "text", content: "Sustainability and traceability were dominant themes, with several exhibitors presenting blockchain-verified sourcing for precious stones and recycled gold collections. The convergence of luxury and responsibility continues to reshape the industry's direction — and Vicenzaoro positioned itself at the center of that conversation." },
    ],
  },
  {
    id: "v2-art-sg",
    title: "ART SG 2026: Southeast Asia's Leading Art Fair Expands Its Global Reach",
    excerpt: "The fourth edition of ART SG brought White Cube, Thaddaeus Ropac, and over 100 galleries to Singapore — alongside Ai Weiwei's monumental installation during Singapore Art Week.",
    category: "Art & Design",
    imageUrl: articleArtSg,
    author: "Millie Sealana",
    date: "2026-01-23",
    body: [
      { id: "asg-b1", type: "text", content: "The fourth edition of ART SG returned from January 23–25, continuing to set the pace as the leading international art fair in Southeast Asia. Visitors encountered presentations by global heavyweights including White Cube, Thaddaeus Ropac, neugerriemschneider, and Perrotin — alongside a strong contingent of Asian galleries that underscored the region's growing influence on the global art market." },
      { id: "asg-b2", type: "text", content: "The fair coincided with Singapore Art Week, which transformed the city-state into a concentrated hub of exhibitions, installations, and cultural programming. The most talked-about work was Ai Weiwei's monumental 60-metre inflatable raft — placed between diners at Capella Singapore — a provocative commentary on displacement that anchored the week's broader conversation about art's role in addressing global crises." },
      { id: "asg-b3", type: "text", content: "ART SG's expanded programming included curated sections dedicated to emerging artists from the Asia-Pacific region, immersive digital art installations, and a series of collector-led talks that drew private collectors from Hong Kong, Tokyo, Jakarta, and Sydney. The fair's position within Singapore — a city that bridges East and West — gives it a unique gravitational pull." },
      { id: "asg-b4", type: "text", content: "For the international art world, ART SG 2026 confirmed what many have sensed: the center of gravity is shifting eastward. The energy, the collectors, the institutional ambition — Singapore is no longer an emerging art destination. It is one." },
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
