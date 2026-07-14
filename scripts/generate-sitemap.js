import fs from "fs";
import fetch from "node-fetch";

const SITE_URL = "https://www.themagorium.com";

const IMAGE_NAMESPACE =
  "http://www.google.com/schemas/sitemap-image/1.1";

function slugifyText(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildContentPath(id: string, title: string) {
  return `/articles/${slugifyText(title || id)}--${id}`;
}

function canonicalAuthorSlug(author = "") {
  const slug = slugifyText(author);
  return slug && slug !== "staff" ? slug : "staff";
}

function cleanDate(value?: string) {
  if (!value) {
    return new Date().toISOString().split("T")[0];
  }

  return value.split("T")[0];
}

const PLACEHOLDER_TITLE_PATTERN =
  /^new\s+(hero|article)(\s+\d+)?$/i;

const PLACEHOLDER_COPY_PATTERNS = [
  /^add your .* story$/i,
  /^add your .* article$/i,
  /^add story text$/i,
  /^upload photo or video$/i,
];

function isPlaceholder(value = "") {
  const text = value.trim();

  if (!text) return true;

  if (PLACEHOLDER_TITLE_PATTERN.test(text)) return true;

  return PLACEHOLDER_COPY_PATTERNS.some((p) =>
    p.test(text)
  );
}


async function fetchArchive() {
  const response = await fetch(
    `${SITE_URL}/api/content`,
    {
      headers: {
        "User-Agent":
          "Magorium-Sitemap-Builder/2.0",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `/api/content failed ${response.status}`
    );
  }

  const json = await response.json();

  return (
    json.content ||
    json.payload ||
    {
      heroes: [],
      articles: [],
    }
  );
}


type SitemapEntry = {
  loc: string;
  lastmod: string;
  priority: string;
  changefreq: string;
  image?: string;
};


async function generateSitemap() {

  const archive = await fetchArchive();

  const entries: SitemapEntry[] = [];

  const today =
    new Date()
      .toISOString()
      .split("T")[0];


  //
  // Homepage
  //
  entries.push({
    loc: `${SITE_URL}/`,
    lastmod: today,
    priority: "1.0",
    changefreq: "daily",
  });


  //
  // Heroes
  //
  for (const hero of archive.heroes || []) {

    if (isPlaceholder(hero.title)) continue;

    if (
      isPlaceholder(hero.subtitle) &&
      isPlaceholder(hero.excerpt)
    ) continue;


    entries.push({

      loc:
        SITE_URL +
        buildContentPath(
          hero.id,
          hero.title
        ),

      lastmod:
        cleanDate(
          hero.date
        ),

      priority: "0.95",

      changefreq: "weekly",

      image:
        hero.imageUrl,

    });


    if (hero.author) {

      entries.push({

        loc:
          `${SITE_URL}/author/${canonicalAuthorSlug(hero.author)}`,

        lastmod:
          cleanDate(hero.date),

        priority:
          "0.5",

        changefreq:
          "monthly",

      });

    }


    if (hero.category) {

      entries.push({

        loc:
          `${SITE_URL}/category/${slugifyText(hero.category)}`,

        lastmod:
          cleanDate(hero.date),

        priority:
          "0.6",

        changefreq:
          "monthly",

      });

    }

  }



  //
  // Articles
  //
  for (const article of archive.articles || []) {

    if (isPlaceholder(article.title)) continue;

    if (isPlaceholder(article.excerpt)) continue;


    entries.push({

      loc:
        SITE_URL +
        buildContentPath(
          article.id,
          article.title
        ),

      lastmod:
        cleanDate(article.date),

      priority:
        "0.85",

      changefreq:
        "monthly",

      image:
        article.imageUrl,

    });



    if (article.author) {

      entries.push({

        loc:
          `${SITE_URL}/author/${canonicalAuthorSlug(article.author)}`,

        lastmod:
          cleanDate(article.date),

        priority:
          "0.5",

        changefreq:
          "monthly",

      });

    }


    if (article.category) {

      entries.push({

        loc:
          `${SITE_URL}/category/${slugifyText(article.category)}`,

        lastmod:
          cleanDate(article.date),

        priority:
          "0.6",

        changefreq:
          "monthly",

      });

    }

  }



  //
  // Edition archives
  //
  const editions = new Set<string>();

  [
    ...(archive.heroes || []),
    ...(archive.articles || []),

  ].forEach((item)=>{

    if(item.edition)
      editions.add(item.edition);

  });


  for(const edition of editions){

    entries.push({

      loc:
        `${SITE_URL}/archive/${edition}`,

      lastmod:
        today,

      priority:
        "0.7",

      changefreq:
        "monthly",

    });

  }



  //
  // Remove duplicates
  //
  const unique =
    Array.from(
      new Map(
        entries.map(
          item => [
            item.loc,
            item
          ]
        )
      ).values()
    );



  const urls =
    unique.map(entry=>`

<url>

<loc>${entry.loc}</loc>

<lastmod>${entry.lastmod}</lastmod>

<changefreq>${entry.changefreq}</changefreq>

<priority>${entry.priority}</priority>

${
entry.image
?
`
<image:image>

<image:loc>${entry.image}</image:loc>

</image:image>
`
:
""
}

</url>

`).join("");



const xml =
`<?xml version="1.0" encoding="UTF-8"?>

<urlset 
xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
xmlns:image="${IMAGE_NAMESPACE}">

${urls}

</urlset>`;


fs.writeFileSync(
  "public/sitemap.xml",
  xml
);


console.log(
  `Generated sitemap with ${unique.length} URLs`
);


}


generateSitemap()
.catch(err=>{

console.error(err);

process.exit(1);

});
