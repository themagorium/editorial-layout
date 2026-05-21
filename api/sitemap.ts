import type { VercelRequest, VercelResponse } from "@vercel/node";

async function loadSeoRuntime() {
  try {
    return await import("./lib/seo-runtime.js");
  } catch {
    return await import("./lib/seo-runtime");
  }
}

function xmlEscape(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSitemapXml(
  siteUrl: string,
  pathLastmodPairs: Array<[string, string]>,
): string {
  const urls = pathLastmodPairs
    .map(
      ([path, lastmod]) =>
        `<url><loc>${xmlEscape(`${siteUrl}${path}`)}</loc><lastmod>${xmlEscape(lastmod)}</lastmod></url>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(fallback), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function toIsoDate(value: string | undefined, fallbackIso: string): string {
  const parsed = new Date(value || "");
  if (Number.isNaN(parsed.getTime())) return fallbackIso;
  return parsed.toISOString();
}

function pickLatestIso(left: string, right: string): string {
  const leftTime = +new Date(left);
  const rightTime = +new Date(right);
  if (Number.isNaN(leftTime)) return right;
  if (Number.isNaN(rightTime)) return left;
  return rightTime > leftTime ? right : left;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const fallbackSiteUrl = "https://www.themagorium.com";
  const nowIso = new Date().toISOString();
  const fallbackPaths = ["/", "/archive", "/contributors", "/seo-history", "/sitemap.xml"];

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");

  try {
    const runtime = await withTimeout<Awaited<ReturnType<typeof loadSeoRuntime>> | null>(
      loadSeoRuntime(),
      2000,
      null,
    );
    if (!runtime) {
      const fallbackXml = buildSitemapXml(
        fallbackSiteUrl,
        fallbackPaths.map((path) => [path, nowIso]),
      );
      res.status(200).send(fallbackXml);
      return;
    }
    const { SITE_URL, getCategoryPath, getAuthorPath, getPublishedSeoStories } = runtime;
    const stories = await withTimeout(getPublishedSeoStories(), 3000, [] as Array<{
      path: string;
      date: string;
      category: string;
      author: string;
      edition: string;
    }>);
    const latestStoryIso =
      stories.length > 0
        ? stories
            .map((story) => toIsoDate(story.date, nowIso))
            .reduce((latest, current) => pickLatestIso(latest, current), nowIso)
        : nowIso;

    const staticPaths = [
      "/",
      "/magorium",
      "/magorum",
      "/magoriium",
      "/the-magorium",
      "/the-magoriium",
      "/themagorium",
      "/themagoriium",
      "/archive",
      "/contributors",
      "/seo-history",
      "/categories",
    ];

    const pathLastmod = new Map<string, string>();
    const upsertPath = (path: string, lastmod: string) => {
      const existing = pathLastmod.get(path);
      pathLastmod.set(path, existing ? pickLatestIso(existing, lastmod) : lastmod);
    };

    staticPaths.forEach((path) => upsertPath(path, latestStoryIso));
    stories.forEach((story) => {
      const storyLastmod = toIsoDate(story.date, nowIso);
      upsertPath(story.path, storyLastmod);
      upsertPath(getAuthorPath(story.author), storyLastmod);
      upsertPath(getCategoryPath(story.category), storyLastmod);
      const edition = (story.edition || "").trim();
      if (edition) {
        upsertPath(`/archive/${edition}`, storyLastmod);
      }
    });

    const xml = buildSitemapXml(SITE_URL, Array.from(pathLastmod.entries()).sort(([a], [b]) => a.localeCompare(b)));
    res.status(200).send(xml);
  } catch {
    const fallbackXml = buildSitemapXml(
      fallbackSiteUrl,
      fallbackPaths.map((path) => [path, nowIso]),
    );
    res.status(200).send(fallbackXml);
  }
}
