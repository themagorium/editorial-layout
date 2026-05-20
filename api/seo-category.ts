import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  BRAND_NAME,
  SITE_URL,
  normalizeCategoryName,
  escapeHtml,
  getCategoryPath,
  getPublishedSeoStories,
  renderSeoDocument,
  slugifyText,
} from "./lib/seo-runtime";

function readQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).send("Method not allowed");
    return;
  }

  try {
    const slug = readQueryValue(req.query.slug).trim();
    const requestedCategory = normalizeCategoryName(slug || "all");
    const canonicalPath = getCategoryPath(requestedCategory);
    const canonicalUrl = `${SITE_URL}${canonicalPath}`;

    const stories = await getPublishedSeoStories();
    const categoryStories = stories
      .filter((story) => slugifyText(story.category) === slugifyText(requestedCategory))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));

    const hasStories = categoryStories.length > 0;
    const title = hasStories
      ? `${requestedCategory} stories | ${BRAND_NAME}`
      : `${requestedCategory} | ${BRAND_NAME} category`;
    const description = hasStories
      ? `${categoryStories.length} ${requestedCategory.toLowerCase()} stories on ${BRAND_NAME}, including credited writers and journalists.`
      : `Category archive for ${requestedCategory} on ${BRAND_NAME}.`;

    const keywords = [
      BRAND_NAME,
      `${requestedCategory} stories`,
      `${requestedCategory} journalists`,
      `${requestedCategory} writers`,
      ...categoryStories.map((story) => `${story.author} ${story.title}`),
    ]
      .filter(Boolean)
      .join(", ");

    const storyRows = categoryStories
      .map(
        (story) =>
          `<li><a href="${story.path}">${escapeHtml(story.title)}</a> <span class="muted">(${escapeHtml(
            story.date,
          )})</span> — <strong>Written by:</strong> <a href="/author/${slugifyText(story.author)}">${escapeHtml(
            story.author,
          )}</a></li>`,
      )
      .join("");

    const bodyHtml = `
      <h1>${escapeHtml(requestedCategory)} stories</h1>
      <p class="muted">${escapeHtml(description)}</p>
      ${hasStories ? `<ul>${storyRows}</ul>` : "<p class=\"muted\">No stories yet in this category.</p>"}
      <p><a href="/archive">Archive</a> · <a href="/seo-history">SEO History</a> · <a href="/contributors">Contributors</a></p>
    `;

    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "CollectionPage",
          name: `${requestedCategory} stories`,
          url: canonicalUrl,
          description,
          mainEntity: {
            "@type": "ItemList",
            itemListElement: categoryStories.map((story, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "NewsArticle",
                headline: story.title,
                url: `${SITE_URL}${story.path}`,
                datePublished: story.date,
                articleSection: requestedCategory,
                author: {
                  "@type": "Person",
                  name: story.author,
                  url: `${SITE_URL}/author/${slugifyText(story.author)}`,
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
      imageUrl: categoryStories[0]?.imageUrl || `${SITE_URL}/og-image.jpg?v=20260520-0548`,
      noIndex: !hasStories,
    });

    res.status(200).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to render category SEO page.",
    });
  }
}
