import type { VercelRequest, VercelResponse } from "@vercel/node";

const SITE_URL = "https://www.themagorium.com";

function slugifyText(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function canonicalAuthorName(raw: string): string {
  if (!raw || raw.trim() === "") return "The Magorium";
  const lower = raw.toLowerCase().trim();
  if (["staff", "editorial", "the magorium", "magorium"].includes(lower)) return "The Magorium";
  return raw.trim();
}

function buildContentPath(id: string, title: string): string {
  return `/story/${id}/${slugifyText(title)}`;
}

async function fetchSnapshot() {
  try {
    const { getPublishedContentSnapshot } = await import(
      "../src/lib/content-store"
    );
    return await getPublishedContentSnapshot();
  } catch {
    return { heroes: [], articles: [] };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const snapshot = await fetchSnapshot();

  const heroes = snapshot.heroes || [];
  const articles = snapshot.articles || [];

  // Collect all unique authors
  const authorSlugs = new Set<string>();
  const categorySlugs = new Set<string>();

  const storyUrls: { url: string; date: string }[] = [];

  for (const h of heroes) {
    storyUrls.push({
      url: `${SITE_URL}${buildContentPath(h.id, h.title)}`,
      date: h.date,
    });
    if (h.author) authorSlugs.add(slugifyText(canonicalAuthorName(h.author)));
    if (h.category) categorySlugs.add(slugifyText(h.category));
  }

  for (const a of articles) {
    storyUrls.push({
      url: `${SITE_URL}${buildContentPath(a.id, a.title)}`,
      date: a.date,
    });
    if (a.author) authorSlugs.add(slugifyText(canonicalAuthorName(a.author)));
    if (a.category) categorySlugs.add(slugifyText(a.category));
  }

  // Remove staff/empty slugs
  authorSlugs.delete("the-magorium");
  authorSlugs.delete("");

  const today = new Date().toISOString().split("T")[0];

  const staticUrls = [
    { url: `${SITE_URL}/`, date: today },
    { url: `${SITE_URL}/archive`, date: today },
  ];

  const authorUrls = Array.from(authorSlugs).map((slug) => ({
    url: `${SITE_URL}/author/${slug}`,
    date: today,
  }));

  const categoryUrls = Array.from(categorySlugs).map((slug) => ({
    url: `${SITE_URL}/category/${slug}`,
    date: today,
  }));

  const allUrls = [
    ...staticUrls,
    ...storyUrls,
    ...authorUrls,
    ...categoryUrls,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    ({ url, date }) => `  <url>
    <loc>${url}</loc>
    <lastmod>${date.split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url === `${SITE_URL}/` ? "1.0" : url.includes("/story/") ? "0.9" : url.includes("/author/") ? "0.8" : "0.7"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=7200");
  res.status(200).send(xml);
}
