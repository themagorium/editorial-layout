import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  SITE_URL,
  getAuthorPath,
  getPublishedSeoStories,
} from "./lib/seo-runtime";

function xmlEscape(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const stories = await getPublishedSeoStories();
    const authorPaths = Array.from(new Set(stories.map((story) => getAuthorPath(story.author))));
    const storyPaths = Array.from(new Set(stories.map((story) => story.path)));
    const staticPaths = ["/", "/magorium", "/magorum", "/the-magorium", "/archive", "/contributors", "/seo-history"];
    const allPaths = Array.from(new Set([...staticPaths, ...authorPaths, ...storyPaths]));

    const urls = allPaths
      .map((path) => `<url><loc>${xmlEscape(`${SITE_URL}${path}`)}</loc></url>`)
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch {
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>failed</error>');
  }
}
