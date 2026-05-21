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
  try {
    const runtime = await loadSeoRuntime();
    const { SITE_URL, getCategoryPath, getAuthorPath, getPublishedSeoStories } = runtime;
    const stories = await getPublishedSeoStories();
    const nowIso = new Date().toISOString();
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

    const urls = Array.from(pathLastmod.entries())
      .map(
        ([path, lastmod]) =>
          `<url><loc>${xmlEscape(`${SITE_URL}${path}`)}</loc><lastmod>${xmlEscape(lastmod)}</lastmod></url>`,
      )
      .join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(xml);
  } catch {
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>failed</error>');
  }
}
