import type { VercelRequest, VercelResponse } from "@vercel/node";

async function loadSeoRuntime() {
  try {
    return await import("./lib/seo-runtime.js");
  } catch {
    return await import("./lib/seo-runtime.js");
  }
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const runtime = await loadSeoRuntime();
    const {
      BRAND_ALIAS,
      BRAND_NAME,
      SITE_URL,
      STAFF_AUTHOR_NAME,
      escapeHtml,
      getAuthorPath,
      getPublishedSeoStories,
      renderSeoDocument,
    } = runtime;
    const stories = await getPublishedSeoStories();
    const storyPathsByAuthor: Record<string, string[]> = {};
    stories.forEach((story) => {
      storyPathsByAuthor[story.author] = [...(storyPathsByAuthor[story.author] || []), story.path];
    });

    const authorNames = Object.keys(storyPathsByAuthor).sort((a, b) => {
      const delta = (storyPathsByAuthor[b]?.length || 0) - (storyPathsByAuthor[a]?.length || 0);
      if (delta !== 0) return delta;
      return a.localeCompare(b);
    });

    const fallbackAuthorList = [
      "Millie Sealana",
      "Charlotte Thames",
      "Elena Voss",
      "James Whitfield",
      "Taylor Chen",
      "Christoph Drachenfels",
      "Marcus Demallier",
      "Wilhelmina St. Germain",
      STAFF_AUTHOR_NAME,
    ];
    const contributors = authorNames.length > 0 ? authorNames : fallbackAuthorList;

    const canonicalUrl = `${SITE_URL}/contributors`;
    const title = `Contributors | ${BRAND_NAME} Journalists & Writers`;
    const samplePairs = stories
      .map((story) => `${story.author}: ${story.title}`)
      .join(" | ");
    const description = `${BRAND_NAME} contributors directory. Browse each writer and journalist profile with linked published stories and author archives.${samplePairs ? ` Featured writer-story pairs: ${samplePairs}.` : ""}`;
    const keywords = [
      BRAND_NAME,
      `${BRAND_ALIAS} contributors`,
      "journalists",
      "writers",
      "authors",
      ...contributors,
    ].join(", ");

    const bodyHtml = `
      <h1>${escapeHtml(BRAND_NAME)} Contributors</h1>
      <p class="muted">Browse every writer and journalist profile with direct links to published stories.</p>
      <ul>
        ${contributors
          .map((name) => {
            const path = getAuthorPath(name);
            const count = storyPathsByAuthor[name]?.length || 0;
            const countLabel = `${count} ${count === 1 ? "story" : "stories"}`;
            const firstStoryPath = storyPathsByAuthor[name]?.[0];
            const firstStory = stories.find((story) => story.path === firstStoryPath);
            const pair = firstStory ? ` — ${escapeHtml(firstStory.title)}` : "";
            return `<li><a href="${path}">${escapeHtml(name)}</a> <span class="muted">(${countLabel})</span>${pair ? `<br/><span class="muted">Featured article: <a href="${firstStoryPath}">${pair.replace(/^ — /, "")}</a></span>` : ""}</li>`;
          })
          .join("")}
      </ul>
      <p><a href="/seo-history">View visible SEO history archive</a></p>
    `;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${BRAND_NAME} contributors`,
      url: canonicalUrl,
      mainEntity: {
        "@type": "ItemList",
        itemListElement: contributors.map((name, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": name === STAFF_AUTHOR_NAME ? "Organization" : "Person",
            name,
            url: `${SITE_URL}${getAuthorPath(name)}`,
          },
        })),
      },
      mentions: contributors.flatMap((name) =>
        (storyPathsByAuthor[name] || []).map((path) => ({
          "@type": "CreativeWork",
          url: `${SITE_URL}${path}`,
          author: {
            "@type": name === STAFF_AUTHOR_NAME ? "Organization" : "Person",
            name,
            url: `${SITE_URL}${getAuthorPath(name)}`,
          },
        })),
      ),
    };

    const html = renderSeoDocument({
      title,
      description,
      canonicalUrl,
      keywords,
      bodyHtml,
      ogType: "website",
      jsonLd,
    });

    res.status(200).setHeader("content-type", "text/html; charset=utf-8").send(html);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to render contributor SEO.",
    });
  }
}
