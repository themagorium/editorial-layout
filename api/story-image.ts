import type { VercelRequest, VercelResponse } from "@vercel/node";

// Serves a story's cover photo at a real, crawlable URL.
// Most photos are stored inside the story itself (as data: URIs), which
// search engines and link-preview bots (Google Images, WhatsApp, LinkedIn,
// iMessage, X) cannot use. This turns them into a normal image response.
//   /api/story-image?type=hero|article&id=<story id>[&v=<version>]
const SITE_URL = "https://www.themagorium.com";

function firstBodyImage(body: unknown): string {
  if (!Array.isArray(body)) return "";
  for (const block of body as Array<{ type?: string; content?: string }>) {
    if (block?.type === "image" && typeof block.content === "string" && block.content.trim()) return block.content.trim();
  }
  return "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const type = String(req.query.type || "") === "hero" ? "hero" : "article";
  const id = String(req.query.id || "").trim();
  if (!id) {
    res.status(400).send("Missing id");
    return;
  }
  try {
    const response = await fetch(
      `${SITE_URL}/api/content?storyType=${type}&storyId=${encodeURIComponent(id)}`,
      { headers: { "User-Agent": "MagoriumImageProxy/1.0" } },
    );
    const payload = (await response.json()) as { content?: { story?: { imageUrl?: string; body?: unknown } } };
    const story = payload?.content?.story;
    const source = (story?.imageUrl || "").trim() || firstBodyImage(story?.body);

    const dataMatch = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(source);
    if (dataMatch) {
      res.setHeader("Content-Type", dataMatch[1]);
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
      res.status(200).send(Buffer.from(dataMatch[2], "base64"));
      return;
    }
    if (source.startsWith("/") || /^https?:\/\//i.test(source)) {
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
      res.redirect(302, source.startsWith("/") ? `${SITE_URL}${source}` : source);
      return;
    }
    res.redirect(302, `${SITE_URL}/og-image.png`);
  } catch {
    res.redirect(302, `${SITE_URL}/og-image.png`);
  }
}
