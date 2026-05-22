import type { VercelRequest, VercelResponse } from "@vercel/node";

async function loadSeoRuntime() {
  try {
    return await import("./lib/seo-runtime.js");
  } catch {
    return await import("./lib/seo-runtime");
  }
}

function readQueryValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function trimToSummary(text: string, maxLength = 220) {
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).send("Method not allowed");
    return;
  }

  const runtime = await loadSeoRuntime();
  const {
    BRAND_NAME,
    SITE_URL,
    STAFF_AUTHOR_NAME,
    contentIdentifierMatches,
    escapeHtml,
    getAuthorPath,
    getPublishedSeoStories,
    renderSeoDocument,
  } = runtime;
  const query = req.query || {};
  const identifier = readQueryValue(query.identifier).trim();
  if (!identifier) {
    res.status(400).send("Missing article identifier.");
    return;
  }

  const stories = await getPublishedSeoStories();
  const story = stories.find((candidate) => contentIdentifierMatches(candidate, identifier));

  if (!story) {
    const canonicalUrl = `${SITE_URL}/articles/${encodeURIComponent(identifier)}`;
    const html = renderSeoDocument({
      title: `${BRAND_NAME} Article`,
      description: "The requested article could not be found.",
      canonicalUrl,
      keywords: `${BRAND_NAME}, article`,
      ogType: "article",
      bodyHtml: `<h1>Article not found</h1><p class="muted">This story is unavailable.</p><p><a href="${SITE_URL}">Return to ${BRAND_NAME}</a></p>`,
      noIndex: true,
    });
    res.status(404).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
    return;
  }

  const canonicalUrl = `${SITE_URL}${story.path}`;
  const authorPath = getAuthorPath(story.author);
  const authorUrl = `${SITE_URL}${authorPath}`;
  const summarySeed = story.excerpt || story.bodyText[0] || `${story.title} on ${BRAND_NAME}`;
  const description = trimToSummary(
    `${story.author} on ${BRAND_NAME}: ${story.title}. ${summarySeed}`,
  );
  const keywordTerms = [
    BRAND_NAME,
    story.title,
    story.author,
    `${story.author} writer`,
    `${story.author} journalist`,
    story.category,
    ...(story.seoTags || []),
    "Magorium",
    "The Magorium",
  ];
  const keywords = keywordTerms
    .filter(Boolean)
    .join(", ");

  const jsonLdAuthor = story.author === STAFF_AUTHOR_NAME
    ? {
        "@type": "Organization",
        name: story.author,
        url: authorUrl,
      }
    : {
        "@type": "Person",
        name: story.author,
        url: authorUrl,
      };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        headline: story.title,
        url: canonicalUrl,
        datePublished: story.date,
        dateModified: story.date,
        image: [story.imageUrl],
        description,
        keywords,
        articleSection: story.category,
        author: jsonLdAuthor,
        creator: jsonLdAuthor,
        publisher: {
          "@type": "Organization",
          name: BRAND_NAME,
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/favicon.png?v=20260522-0630`,
          },
        },
        about: [jsonLdAuthor],
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": canonicalUrl,
        },
      },
      {
        "@type": "WebPage",
        "@id": canonicalUrl,
        name: story.title,
        isPartOf: {
          "@type": "WebSite",
          name: BRAND_NAME,
          url: SITE_URL,
        },
      },
    ],
  };

  const bodyParagraphs = story.bodyText.slice(0, 5);
  const bodyMarkup = bodyParagraphs.length > 0
    ? bodyParagraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")
    : `<p>${escapeHtml(story.excerpt || "Read this feature on The Magorium.")}</p>`;

  const html = renderSeoDocument({
    title: `${story.author} | ${story.title} | ${BRAND_NAME}`,
    description,
    canonicalUrl,
    keywords,
    ogType: "article",
    imageUrl: story.imageUrl,
    jsonLd,
    bodyHtml: `
      <p><a href="${SITE_URL}">Home</a> / <a href="${authorUrl}">${escapeHtml(story.author)}</a> / <a href="${SITE_URL}/seo-history">SEO History</a></p>
      <h1>${escapeHtml(story.title)}</h1>
      <p class="muted"><span class="tag">${escapeHtml(story.category)}</span> &nbsp; ${escapeHtml(story.date)} &nbsp; • &nbsp; <strong>Written by:</strong> <a href="${authorUrl}">${escapeHtml(story.author)}</a></p>
      ${bodyMarkup}
      <p><a href="${authorUrl}">Read all stories by ${escapeHtml(story.author)}</a> · <a href="${SITE_URL}/seo-history">View full SEO history</a></p>
    `,
  });

  res.status(200).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
}
