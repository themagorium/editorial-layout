import fs from "fs";
import fetch from "node-fetch";

const SITE_URL = "https://www.themagorium.com";

const PLACEHOLDER_TITLE_PATTERN =
  /^new\s+(hero|article)(\s+\d+)?$/i;

const PLACEHOLDER_COPY_PATTERNS = [
  /^add your .* story$/i,
  /^add your .* article$/i,
  /^add story text$/i,
  /^upload photo or video$/i,
];

function slugify(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function articleUrl(id, title) {
  return `${SITE_URL}/articles/${slugify(title || id)}--${id}`;
}

function authorUrl(author) {
  return `${SITE_URL}/author/${slugify(author || "staff")}`;
}

function categoryUrl(category) {
  return `${SITE_URL}/category/${slugify(category)}`;
}

function archiveUrl(edition) {
  return `${SITE_URL}/archive/${edition}`;
}

function cleanDate(date) {
  if (!date) return new Date().toISOString().split("T")[0];
  return date.split("T")[0];
}

function isPlaceholder(value = "") {
  const text = value.trim();

  if (!text) return true;

  if (PLACEHOLDER_TITLE_PATTERN.test(text)) return true;

  return PLACEHOLDER_COPY_PATTERNS.some((pattern) => pattern.test(text));
}

async function getFullArchive() {
  const response = await fetch(`${SITE_URL}/api/content`, {
    headers: {
      "User-Agent": "TheMagorium-Sitemap-Crawler/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Content API failed ${response.status}`);
  }

  const json = await response.json();

  /*
     IMPORTANT:
     We use content/payload,
     NEVER view=latest.
     latest only contains homepage stories.
  */

  return json.content || json.payload || { heroes: [], articles: [] };
}

async function generate() {
  const archive = await getFullArchive();

  const entries = [];

  function add(entry) {
    entries.push(entry);
  }

  //
  // Homepage
  //
  add({
    loc: `${SITE_URL}/`,
    lastmod: cleanDate(archive.updatedAt || archive.publishedAt),
    changefreq: "daily",
    priority: "1.0",
  });

  //
  // HEROES
  //
  for (const hero of archive.heroes || []) {
    if (isPlaceholder(hero.title)) continue;

    if (isPlaceholder(hero.subtitle) && isPlaceholder(hero.excerpt)) continue;

    add({
      loc: articleUrl(hero.id, hero.title),
      lastmod: cleanDate(hero.date),
      changefreq: "weekly",
      priority: "0.95",
      image: hero.imageUrl,
    });

    if (hero.author) {
      add({
        loc: authorUrl(hero.author),
        lastmod: cleanDate(hero.date),
        changefreq: "monthly",
        priority: "0.5",
      });
    }

    if (hero.category) {
      add({
        loc: categoryUrl(hero.category),
        lastmod: cleanDate(hero.date),
        changefreq: "monthly",
        priority: "0.6",
      });
    }
  }

  //
  // ARTICLES
  //
  for (const article of archive.articles || []) {
    if (isPlaceholder(article.title)) continue;

    if (isPlaceholder(article.excerpt)) continue;

    add({
      loc: articleUrl(article.id, article.title),
      lastmod: cleanDate(article.date),
      changefreq: "monthly",
      priority: "0.85",
      image: article.imageUrl,
    });

    if (article.author) {
      add({
        loc: authorUrl(article.author),
        lastmod: cleanDate(article.date),
        changefreq: "monthly",
        priority: "0.5",
      });
    }

    if (article.category) {
      add({
        loc: categoryUrl(article.category),
        lastmod: cleanDate(article.date),
        changefreq: "monthly",
        priority: "0.6",
      });
    }
  }

  //
  // EDITION ARCHIVES
  //
  const editions = new Set();

  for (const item of [...(archive.heroes || []), ...(archive.articles || [])]) {
    if (item.edition) editions.add(item.edition);
  }

  for (const edition of editions) {
    add({
      loc: archiveUrl(edition),
      lastmod: cleanDate(archive.updatedAt || archive.publishedAt),
      changefreq: "monthly",
      priority: "0.7",
    });
  }

  //
  // REMOVE DUPLICATES
  //
  const unique = Array.from(new Map(entries.map((entry) => [entry.loc, entry])).values());

  const xmlEntries = unique
    .map((entry) => {
      return `
<url>
<loc>${entry.loc}</loc>
<lastmod>${entry.lastmod}</lastmod>
<changefreq>${entry.changefreq}</changefreq>
<priority>${entry.priority}</priority>
${
  entry.image
    ? `
<image:image>
<image:loc>${entry.image}</image:loc>
</image:image>
`
    : ""
}
</url>
`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlEntries}
</urlset>
`;

  fs.writeFileSync("public/sitemap.xml", xml);

  console.log(`✅ Sitemap created: ${unique.length} URLs`);
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
