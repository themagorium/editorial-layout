import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  BRAND_NAME,
  SITE_URL,
  escapeHtml,
  getAuthorPath,
  getPublishedSeoStories,
  renderSeoDocument,
} from "./lib/seo-runtime";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const stories = await getPublishedSeoStories();
    const sortedStories = stories
      .slice()
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .slice(0, 500);
    const contributorNames = Array.from(new Set(sortedStories.map((story) => story.author)));

    const canonicalUrl = `${SITE_URL}/seo-history`;
    const title = `${BRAND_NAME} SEO History | Author & Writer Credit Archive`;
    const description =
      `Visible search history archive for ${BRAND_NAME} showing each article with credited writer and linked author archive.`;
    const keywords = [
      BRAND_NAME,
      "seo history",
      "writer credit",
      "journalist credit",
      "author archive",
      ...contributorNames,
    ].join(", ");

    const byAuthor: Record<string, number> = {};
    sortedStories.forEach((story) => {
      byAuthor[story.author] = (byAuthor[story.author] || 0) + 1;
    });
    const authorRows = Object.entries(byAuthor)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(
        ([name, count]) =>
          `<li><a href="${getAuthorPath(name)}">${escapeHtml(name)}</a> <span class="muted">(${count} credited ${
            count === 1 ? "story" : "stories"
          })</span></li>`,
      )
      .join("");

    const storyRows = sortedStories
      .map(
        (story) =>
          `<li><a href="${story.path}">${escapeHtml(story.title)}</a> <span class="muted">(${escapeHtml(
            story.date,
          )})</span> — <strong>Credited writer:</strong> <a href="${getAuthorPath(story.author)}">${escapeHtml(
            story.author,
          )}</a></li>`,
      )
      .join("");

    const bodyHtml = `
      <h1>${escapeHtml(BRAND_NAME)} SEO History Archive</h1>
      <p class="muted">${escapeHtml(description)}</p>
      <h2>Contributor Credit Ledger</h2>
      <ul>${authorRows}</ul>
      <h2>Story Credit History</h2>
      <ul>${storyRows}</ul>
      <p><a href="/contributors">Contributors</a> · <a href="/sitemap.xml">Sitemap</a></p>
    `;

    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          name: `${BRAND_NAME} SEO history`,
          url: canonicalUrl,
          description,
          mainEntity: {
            "@type": "ItemList",
            itemListElement: sortedStories.map((story, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "NewsArticle",
                headline: story.title,
                url: `${SITE_URL}${story.path}`,
                datePublished: story.date,
                author: {
                  "@type": "Person",
                  name: story.author,
                  url: `${SITE_URL}${getAuthorPath(story.author)}`,
                },
              },
            })),
          },
        },
      ],
    };

    const html = renderSeoDocument({
      title,
      description,
      canonicalUrl,
      keywords,
      bodyHtml,
      ogType: "website",
      jsonLd,
      imageUrl: sortedStories[0]?.imageUrl || `${SITE_URL}/og-image.jpg`,
    });

    res.status(200).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to render seo history.",
    });
  }
}
