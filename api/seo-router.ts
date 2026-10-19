import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const host = req.headers.host;
  const path = req.url || "/";

  const articleMatch = path.match(/^\/articles\/([^/?]+)/);
  const authorMatch = path.match(/^\/authors?\/([^/?]+)/);
  const categoryMatch = path.match(/^\/category\/([^/?]+)/);
  const archiveMatch = path.match(/^\/archive\/?([^/?]*)/);

  let target = "/api/seo-home";

  if (articleMatch) {
    target = `/api/seo-article?identifier=${encodeURIComponent(articleMatch[1])}`;
  } else if (authorMatch) {
    target = `/api/seo-author?slug=${encodeURIComponent(authorMatch[1])}`;
  } else if (categoryMatch) {
    target = `/api/seo-category?slug=${encodeURIComponent(categoryMatch[1])}`;
  } else if (/^\/contributors\/?$/.test(path.split("?")[0])) {
    target = "/api/seo-contributors";
  } else if (archiveMatch && archiveMatch[1]) {
    target = `/api/seo-history?edition=${encodeURIComponent(archiveMatch[1])}`;
  } else if (path.startsWith("/archive")) {
    target = "/api/seo-history";
  }

  try {
    const upstream = await fetch(`https://${host}${target}`);
    const html = await upstream.text();
    res.status(upstream.status).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
  } catch {
    res.status(500).send("SEO render error");
  }
}
