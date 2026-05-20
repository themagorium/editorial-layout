import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const content = `User-agent: *
Allow: /

Sitemap: https://www.themagorium.com/sitemap.xml
Sitemap: https://www.themagorium.com/api/sitemap
Host: www.themagorium.com`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=86400");
  res.status(200).send(content);
}
