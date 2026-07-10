import fs from 'fs';
import fetch from 'node-fetch';

const SITE_URL = 'https://www.themagorium.com';

// ── Same slugify logic as api/lib/seo-runtime.ts, kept in sync ─────────────
function slugifyText(value) {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildContentPath(id, title) {
  const slug = slugifyText(title || id);
  return `/articles/${slug}--${id}`;
}

// ── Same placeholder detection as seo-runtime.ts, so drafts never leak in ──
const PLACEHOLDER_TITLE_PATTERN = /^new\s+(hero|article)(\s+\d+)?$/i;
const PLACEHOLDER_COPY_PATTERNS = [
  /^add your (first|second|third|fourth)\s+hero story$/i,
  /^add your (first|second|third|fourth)\s+article$/i,
  /^add your .* story$/i,
  /^add story text$/i,
  /^add (first|second|third|fourth) body paragraph$/i,
  /^upload photo or video$/i,
];

function isPlaceholderTitle(title) {
  const normalized = (title || '').trim();
  if (!normalized) return true;
  return PLACEHOLDER_TITLE_PATTERN.test(normalized);
}

function isPlaceholderCopy(value) {
  const text = (value || '').trim();
  if (!text) return true;
  return PLACEHOLDER_COPY_PATTERNS.some((p) => p.test(text));
}

async function fetchLiveContent() {
  try {
    const response = await fetch(`${SITE_URL}/api/content`, {
      headers: { 'User-Agent': 'MagoriumSitemapBuilder/1.0' },
    });
    if (!response.ok) {
      console.error(`/api/content responded with ${response.status}, using homepage-only sitemap.`);
      return { heroes: [], articles: [] };
    }
    const payload = await response.json();
    const raw = payload?.payload || payload?.content || {};
    return { heroes: raw.heroes || [], articles: raw.articles || [] };
  } catch (err) {
    console.error('Could not reach /api/content, using homepage-only sitemap:', err.message);
    return { heroes: [], articles: [] };
  }
}

async function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  const { heroes, articles } = await fetchLiveContent();

  const entries = [];

  for (const hero of heroes) {
    if (isPlaceholderTitle(hero.title)) continue;
    if (isPlaceholderCopy(hero.subtitle) && isPlaceholderCopy(hero.excerpt)) continue;
    entries.push({
      loc: `${SITE_URL}${buildContentPath(hero.id, hero.title)}`,
      lastmod: (hero.date || today).split('T')[0],
    });
  }

  for (const article of articles) {
    if (isPlaceholderTitle(article.title)) continue;
    if (isPlaceholderCopy(article.excerpt)) continue;
    entries.push({
      loc: `${SITE_URL}${buildContentPath(article.id, article.title)}`,
      lastmod: (article.date || today).split('T')[0],
    });
  }

  const urls = [
    `  <url>\n    <loc>${SITE_URL}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...entries.map(
      (e) =>
        `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

  fs.writeFileSync('public/sitemap.xml', xml);
  console.log(`Sitemap generated with ${entries.length} live content URLs.`);
}

generateSitemap();
