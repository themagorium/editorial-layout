import type { VercelRequest, VercelResponse } from "@vercel/node";

// Live sitemap, generated from the published content on request (cached for
// 10 minutes at the edge). It replaces the static public/sitemap.xml that was
// written once at build time, which went stale the moment a story changed
// (e.g. it kept advertising a3 under its old Dubai address) and embedded
// photos as data: URIs that Google rejects.
function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function day(value?: string): string {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10);
}

type Entry = { loc: string; lastmod: string; changefreq: string; priority: string; image?: string; imageTitle?: string };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { SITE_URL, getPublishedSeoStories, getAuthorPath, getCategoryPath } = await import("./lib/seo-runtime.js");
  const stories = await getPublishedSeoStories();
  const today = day();

  const entries: Entry[] = [{ loc: `${SITE_URL}/`, lastmod: today, changefreq: "daily", priority: "1.0" }];
  const authors = new Map<string, string>();
  const categories = new Map<string, string>();
  const editions = new Map<string, string>();

  for (const story of stories) {
    const lastmod = day(story.date);
    entries.push({
      loc: `${SITE_URL}${story.path}`,
      lastmod,
      changefreq: "weekly",
      priority: "0.9",
      image: story.imageUrl && /^https?:\/\//.test(story.imageUrl) ? story.imageUrl : undefined,
      imageTitle: story.title,
    });
    if (story.author) authors.set(getAuthorPath(story.author), lastmod > (authors.get(getAuthorPath(story.author)) || "") ? lastmod : authors.get(getAuthorPath(story.author)) || lastmod);
    if (story.category) categories.set(getCategoryPath(story.category), lastmod > (categories.get(getCategoryPath(story.category)) || "") ? lastmod : categories.get(getCategoryPath(story.category)) || lastmod);
    if (story.edition) editions.set(`/archive/${story.edition}`, lastmod > (editions.get(`/archive/${story.edition}`) || "") ? lastmod : editions.get(`/archive/${story.edition}`) || lastmod);
  }
  for (const [path, lastmod] of editions) entries.push({ loc: `${SITE_URL}${path}`, lastmod, changefreq: "monthly", priority: "0.8" });
  for (const [path, lastmod] of categories) entries.push({ loc: `${SITE_URL}${path}`, lastmod, changefreq: "weekly", priority: "0.7" });
  for (const [path, lastmod] of authors) entries.push({ loc: `${SITE_URL}${path}`, lastmod, changefreq: "weekly", priority: "0.6" });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries
  .map((e) => {
    const image = e.image
      ? `\n    <image:image>\n      <image:loc>${xmlEscape(e.image)}</image:loc>\n      <image:title>${xmlEscape(e.imageTitle || "")}</image:title>\n    </image:image>`
      : "";
    return `  <url>\n    <loc>${xmlEscape(e.loc)}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>${image}\n  </url>`;
  })
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=600, s-maxage=600, stale-while-revalidate=3600");
  res.status(200).send(xml);
}
