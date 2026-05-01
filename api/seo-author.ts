import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  BRAND_ALIAS,
  BRAND_NAME,
  SITE_URL,
  canonicalAuthorName,
  contentIdentifierMatches,
  escapeHtml,
  getAuthorPath,
  getPublishedSeoStories,
  guessAuthorNameFromSlug,
  renderSeoDocument,
} from "./lib/seo-runtime";

function getSlugFromRequest(req: VercelRequest) {
  const direct = (req.query.slug || req.query.author || "") as string;
  if (direct) return Array.isArray(direct) ? direct[0] : direct;
  const pathFromQuery = (req.query.path || "") as string;
  const fromQuery = Array.isArray(pathFromQuery) ? pathFromQuery[0] : pathFromQuery;
  const source = fromQuery || req.url || "";
  const cleaned = source.split("?")[0].replace(/^\/+|\/+$/g, "");
  const parts = cleaned.split("/");
  return parts[parts.length - 1] || "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).send("Method not allowed");
    return;
  }

  const slug = getSlugFromRequest(req);
  const inferredAuthor = guessAuthorNameFromSlug(slug);
  const stories = await getPublishedSeoStories();
  const normalizedSlug = (slug || "").toLowerCase().trim();
  const canonicalFromStories =
    stories.find((story) => getAuthorPath(story.author).split("/").pop() === normalizedSlug)?.author ||
    inferredAuthor;
  const authorName = canonicalAuthorName(canonicalFromStories);
  const canonicalPath = getAuthorPath(authorName);
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  const authorStories = stories
    .filter((story) => canonicalAuthorName(story.author) === authorName)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  if (authorStories.length === 0) {
    const html = renderSeoDocument({
      title: `${authorName} | ${BRAND_NAME} Contributor`,
      description: `Author archive for ${authorName} on ${BRAND_NAME}.`,
      canonicalUrl,
      keywords: `${authorName}, ${authorName} writer, ${authorName} author, ${BRAND_NAME}, ${BRAND_ALIAS}`,
      bodyHtml: `<h1>${escapeHtml(authorName)}</h1>
<p class="muted">No published stories found yet for this contributor.</p>
<p><a href="${SITE_URL}/contributors">View all contributors</a></p>`,
      ogType: "profile",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": authorName === "The Magorium Editorial Staff" ? "Organization" : "Person",
        name: authorName,
        url: canonicalUrl,
      },
      noIndex: true,
    });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
    return;
  }

  const description = `${authorStories.length} published ${
    authorStories.length === 1 ? "story" : "stories"
  } by ${authorName} on ${BRAND_NAME}. Read every article and hero feature.`;
  const keywords = [
    authorName,
    `${authorName} writer`,
    `${authorName} author`,
    `${authorName} journalist`,
    `${BRAND_NAME} contributors`,
    `${BRAND_ALIAS} contributors`,
    ...authorStories.map((story) => story.title),
  ]
    .filter(Boolean)
    .slice(0, 30)
    .join(", ");

  const listMarkup = authorStories
    .slice(0, 200)
    .map(
      (story) =>
        `<li><span class="tag">${escapeHtml(story.category)}</span> <a href="${SITE_URL}${story.path}">${escapeHtml(
          story.title,
        )}</a> <span class="muted">(${escapeHtml(story.date)})</span></li>`,
    )
    .join("");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": authorName === "The Magorium Editorial Staff" ? "Organization" : "Person",
        name: authorName,
        url: canonicalUrl,
        mainEntityOfPage: {
          "@type": "ProfilePage",
          "@id": canonicalUrl,
        },
      },
      {
        "@type": "ItemList",
        itemListElement: authorStories.slice(0, 200).map((story, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "NewsArticle",
            headline: story.title,
            url: `${SITE_URL}${story.path}`,
            datePublished: story.date,
            author: {
              "@type": authorName === "The Magorium Editorial Staff" ? "Organization" : "Person",
              name: authorName,
              url: canonicalUrl,
            },
          },
        })),
      },
    ],
  };

  const html = renderSeoDocument({
    title: `${authorName} | ${BRAND_NAME} Journalist & Author Archive`,
    description,
    canonicalUrl,
    keywords,
    ogType: "profile",
    bodyHtml: `<h1>${escapeHtml(authorName)}</h1>
<p><strong>Writer credit:</strong> ${escapeHtml(authorName)} · <a href="${SITE_URL}/seo-history">SEO history archive</a></p>
<p class="muted">${escapeHtml(description)}</p>
<ul>${listMarkup}</ul>
<p><a href="${SITE_URL}/contributors">Browse all contributors</a></p>`,
    jsonLd,
    imageUrl: authorStories[0]?.imageUrl,
  });

  const pathFromUrl = decodeURIComponent((req.url || "").split("?")[0] || "");
  const canonicalIdentifier = canonicalPath.split("/").pop() || "";
  if (
    normalizedSlug &&
    normalizedSlug !== canonicalIdentifier &&
    !contentIdentifierMatches(
      {
        ...authorStories[0],
        id: canonicalIdentifier,
        title: authorName,
      },
      slug,
    )
  ) {
    res.setHeader("Location", canonicalPath);
    res.status(301).send("");
    return;
  }

  if (pathFromUrl && pathFromUrl !== canonicalPath && pathFromUrl !== `/api/seo-author`) {
    res.setHeader("Location", canonicalPath);
    res.status(301).send("");
    return;
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
