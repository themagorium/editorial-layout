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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const runtime = await loadSeoRuntime();
    const {
      BRAND_NAME,
      SITE_URL,
      DEFAULT_FAVICON,
      HOME_SEO_DESCRIPTION,
      escapeHtml,
      getAuthorPath,
      getPublishedSeoStories,
      renderSeoDocument,
    } = runtime;
    const query = req.query || {};
    const canonicalPathRaw = readQueryValue(query.path).trim();
    const canonicalPath = canonicalPathRaw
      ? canonicalPathRaw.startsWith("/")
        ? canonicalPathRaw
        : `/${canonicalPathRaw}`
      : "/";
    const isHiddenAliasPath = /^\/(magorium|magorum|magoriium|the-magorium|the-magoriium|themagorium|themagoriium)\/?$/i
      .test(canonicalPath);
    const stories = await getPublishedSeoStories();
    const topStories = stories;
    const storyItems = topStories.map((story, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}${story.path}`,
    }));
    const editionPaths = Array.from(
      new Set(
        topStories
          .map((story) => (story.edition || "").trim())
          .filter(Boolean)
          .map((edition) => `/archive/${edition}`),
      ),
    );

    const contributorNames = Array.from(new Set(topStories.map((story) => story.author)));

    const title = BRAND_NAME;
    const description = HOME_SEO_DESCRIPTION;
    const keywords = [
      BRAND_NAME,
      "curated lifestyle magazine",
      "travel",
      "art",
      "culture",
      "fashion",
      "motorsport",
      "yachting",
      "global events",
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
      ${
        editionPaths.length > 0
          ? `<section><h2>Edition Archive</h2><ul>${editionPaths
              .map((path) => `<li><a href="${path}">${escapeHtml(path.replace("/archive/", ""))}</a></li>`)
              .join("")}</ul></section>`
          : ""
      }
      <p class="muted"><a href="/sitemap.xml">Sitemap</a> · <a href="/contributors">Contributors</a></p>
      <p class="muted"><a href="/seo-history">SEO History</a></p>
    `;

    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          name: BRAND_NAME,
          logo: DEFAULT_FAVICON,
          url: SITE_URL,
        },
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
      canonicalUrl: isHiddenAliasPath ? SITE_URL : `${SITE_URL}${canonicalPath}`,
      keywords,
      bodyHtml,
      ogType: "website",
      jsonLd,
      noIndex: isHiddenAliasPath,
    });

    res.status(200).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to render seo homepage",
    });
  }
}
