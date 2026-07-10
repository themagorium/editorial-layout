import fs from 'fs';

// Add every published article here — one line per article.
// slug = the part after /articles/ in the URL
// date = last updated date, format YYYY-MM-DD
const articles = [
  { slug: 'the-architecture-of-precision-sport--h-apr26-1', date: '2026-04-01' },
  { slug: 'the-world-reorganises-its-financial-architecture--h-apr26-2', date: '2026-04-01' },
  { slug: 'from-models-to-infrastructure-stacks--h-apr26-3', date: '2026-04-01' },
  { slug: 'time-recalibrated--a-apr26-2', date: '2026-04-01' },
];

const BASE_URL = 'https://themagorium.com';
const today = new Date().toISOString().split('T')[0];

function generateSitemap() {
  const urls = [
    `  <url>\n    <loc>${BASE_URL}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...articles.map(
      (a) =>
        `  <url>\n    <loc>${BASE_URL}/articles/${a.slug}</loc>\n    <lastmod>${a.date}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

  fs.writeFileSync('public/sitemap.xml', xml);
  console.log(`Sitemap generated with ${articles.length} articles.`);
}

generateSitemap();
