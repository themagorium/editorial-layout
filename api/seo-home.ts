import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  BRAND_ALIAS,
  BRAND_NAME,
  SITE_URL,
  escapeHtml,
  getAuthorPath,
  getPublishedSeoStories,
  renderSeoDocument,
} from "./lib/seo-runtime";

function readQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const query = req.query || {};
    const hint = readQueryValue(query.hint).trim();
    const canonicalPathRaw = readQueryValue(query.path).trim();
    const canonicalPath = canonicalPathRaw
      ? canonicalPathRaw.startsWith("/")
        ? canonicalPathRaw
        : `/${canonicalPathRaw}`
      : "/";
    const stories = await getPublishedSeoStories();
    const topStories = stories;
    const storyItems = topStories.map((story, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}${story.path}`,
    }));

    const contributorNames = Array.from(new Set(topStories.map((story) => story.author)));

    const title = `${BRAND_NAME} - A Curated Lifestyle Magazine`;
    const description =
      `${BRAND_NAME} - A Curated Lifestyle Magazine. ${BRAND_ALIAS} covers travel, art, culture, fashion, motorsport, yachting, and global events.`;
    const keywords = [
      BRAND_NAME,
      BRAND_ALIAS,
      "Magorum",
      "TheMagorium",
      "Magorium writers",
      "Magorium journalists",
      "The Magorium contributors",
      ...contributorNames,
    ].join(", ");

    const bodyHtml = `
      <header>
        <h1>${escapeHtml(BRAND_NAME)}</h1>
        <p>${escapeHtml(description)}</p>
      </header>
      <section>
        <h2>Top Stories</h2>
        <ul>
          ${topStories
            .map(
              (story) =>
                `<li><a href="${story.path}">${escapeHtml(story.title)}</a> by <a href="${getAuthorPath(
                  story.author,
                )}">${escapeHtml(story.author)}</a></li>`,
            )
            .join("\n")}
        </ul>
      </section>
      <section>
        <h2>Contributors</h2>
        <ul>
          ${contributorNames
            .map(
              (name) =>
                `<li><a href="${getAuthorPath(name)}">${escapeHtml(name)}</a></li>`,
            )
            .join("\n")}
        </ul>
      </section>
      <p class="muted"><a href="/sitemap.xml">Sitemap</a> · <a href="/contributors">Contributors</a></p>
      <p class="muted"><a href="/seo-history">SEO History</a></p>
    `;

    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          name: `${BRAND_NAME} stories`,
          url: `${SITE_URL}${canonicalPath}`,
          mainEntity: {
            "@type": "ItemList",
            itemListElement: storyItems,
          },
        },
        {
          "@type": "ItemList",
          name: `${BRAND_NAME} contributors`,
          itemListElement: contributorNames.map((name, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Person",
              name,
              url: `${SITE_URL}${getAuthorPath(name)}`,
            },
          })),
        },
      ],
    };

    const html = renderSeoDocument({
      title,
      description,
      canonicalUrl: `${SITE_URL}${canonicalPath}`,
      keywords,
      bodyHtml,
      ogType: "website",
      jsonLd,
    });

    res.status(200).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to render seo homepage",
    });
  }
}
