import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { SITE_URL, getPublishedSeoStories } = await import("./lib/seo-runtime.js");
  const stories = await getPublishedSeoStories();

  const urls = [
    { loc: `${SITE_URL}/`, lastmod: new Date().toISOString().split("T")[0], priority: "1.0" },
    ...stories.map((s) => ({
      loc: `${SITE_URL}${s.path}`,
      lastmod: s.date || new Date().toISOString().split("T")[0],
      priority: "0.8",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`).join("\n")}
</urlset>`;

  res.status(200).setHeader("Content-Type", "application/xml").send(xml);
}
