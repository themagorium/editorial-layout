import type { VercelRequest, VercelResponse } from "@vercel/node";

async function loadSeoRuntime() {
  try {
    return await import("./lib/seo-runtime.js");
  } catch {
    return await import("./lib/seo-runtime.js");
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
    DEFAULT_FAVICON,
    DEFAULT_OG_IMAGE,
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
story.title = story.title?.trim() || "Untitled Story";
story.category = story.category?.trim() || "Uncategorized";
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
const safeTitle = (story.title || "").trim() || `Untitled Story — ${BRAND_NAME}`;
const safeCategory = (story.category || "").trim() || "Editorial";
story.title = safeTitle;
story.category = safeCategory;
  const bodyTextParagraphs: string[] = Array.isArray(story.bodyText) ? story.bodyText : [];

  const canonicalUrl = `${SITE_URL}${story.path}`;
  const authorPath = getAuthorPath(story.author);
  const authorUrl = `${SITE_URL}${authorPath}`;
  const summarySeed = story.excerpt || bodyTextParagraphs[0] || `${story.title} on ${BRAND_NAME}`;
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

  const articleImage = story.imageUrl || DEFAULT_OG_IMAGE;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "NewsArticle",
        headline: story.title,
        url: canonicalUrl,
        datePublished: story.date,
        dateModified: story.date,
        image: [articleImage],
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
            url: DEFAULT_FAVICON,
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

  // Render full article body — ALL paragraphs and headings — so every crawler
  // (Googlebot, Bingbot, Applebot/Safari, DuckDuckBot, Android, iPhone WebKit)
  // indexes the complete article text, not just the excerpt.
  const bodyBlocks = story.bodyBlocks || [];
  let bodyMarkup: string;
  if (bodyBlocks.length > 0) {
    bodyMarkup = bodyBlocks.map((block) => {
      if (block.type === "heading") {
        return `<h2>${escapeHtml(block.content)}</h2>`;
      }
      return `<p>${escapeHtml(block.content)}</p>`;
    }).join("\n");
  } else if (bodyTextParagraphs.length > 0) {
    // Fallback: use bodyText array if bodyBlocks not populated
    bodyMarkup = bodyTextParagraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
  } else {
    bodyMarkup = `<p>${escapeHtml(story.excerpt || "Read this feature on The Magorium.")}</p>`;
  }

  const html = renderSeoDocument({
    title: `${story.author} | ${story.title} | ${BRAND_NAME}`,
    description,
    canonicalUrl,
    keywords,
    ogType: "article",
    imageUrl: articleImage,
    jsonLd,
    bodyHtml: `
      <p><a href="${SITE_URL}">Home</a> / <a href="${authorUrl}">${escapeHtml(story.author)}</a> / <a href="${SITE_URL}/seo-history">SEO History</a></p>
      <h1>${escapeHtml(story.title)}</h1>
      <p class="muted"><span class="tag">${escapeHtml(story.category)}</span> &nbsp; ${escapeHtml(story.date)} &nbsp; • &nbsp; <strong>Written by:</strong> <a href="${authorUrl}">${escapeHtml(story.author)}</a></p>
      <article itemscope itemtype="https://schema.org/NewsArticle">
        <meta itemprop="headline" content="${escapeHtml(story.title)}">
        <meta itemprop="author" content="${escapeHtml(story.author)}">
        <meta itemprop="datePublished" content="${escapeHtml(story.date)}">
        ${bodyMarkup}
      </article>
      <p><a href="${authorUrl}">Read all stories by ${escapeHtml(story.author)}</a> · <a href="${SITE_URL}/seo-history">View full SEO history</a></p>
    `,
  });

  res.status(200).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
}
