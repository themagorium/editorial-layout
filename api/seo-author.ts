import type { VercelRequest, VercelResponse } from "@vercel/node";

const SITE_URL = "https://www.themagorium.com";
const BRAND_NAME = "The Magorium";
const STAFF_AUTHOR_NAME = "The Magorium";

function slugifyText(text: string): string {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function canonicalAuthorName(raw: string): string {
  if (!raw || raw.trim() === "") return STAFF_AUTHOR_NAME;
  const lower = raw.toLowerCase().trim();
  if (["staff", "editorial", "the magorium", "magorium"].includes(lower)) return STAFF_AUTHOR_NAME;
  return raw.trim();
}

function buildContentPath(id: string, title: string): string {
  const slug = slugifyText(title);
  return `/story/${id}/${slug}`;
}

type HeroItem = {
  id: string;
  title: string;
  subtitle: string;
  excerpt?: string;
  imageUrl: string;
  date: string;
  category: string;
  author: string;
};

type Article = {
  id: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  date: string;
  category: string;
  author: string;
};

type Snapshot = {
  heroes: HeroItem[];
  articles: Article[];
};

async function fetchSnapshot(): Promise<Snapshot> {
  try {
    const { getPublishedContentSnapshot } = await import(
      "../src/lib/content-store"
    );
    return await getPublishedContentSnapshot();
  } catch {
    return { heroes: [], articles: [] };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = (req.query.slug as string) || "";

  const snapshot = await fetchSnapshot();

  const allStories = [
    ...snapshot.heroes.map((h) => ({
      id: h.id,
      title: h.title,
      excerpt: h.excerpt || h.subtitle || "",
      imageUrl: h.imageUrl,
      date: h.date,
      category: h.category,
      author: canonicalAuthorName(h.author),
      path: buildContentPath(h.id, h.title),
    })),
    ...snapshot.articles.map((a) => ({
      id: a.id,
      title: a.title,
      excerpt: a.excerpt || "",
      imageUrl: a.imageUrl,
      date: a.date,
      category: a.category,
      author: canonicalAuthorName(a.author),
      path: buildContentPath(a.id, a.title),
    })),
  ];

  const authorStories = allStories
    .filter((s) => slugifyText(s.author) === slug)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const authorName =
    authorStories.length > 0
      ? authorStories[0].author
      : slug
          .replace(/-/g, " ")
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase());

  const canonicalUrl = `${SITE_URL}/author/${slug}`;
  const isOrg = canonicalAuthorName(authorName) === STAFF_AUTHOR_NAME;

  const itemList = authorStories.map((s, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `${SITE_URL}${s.path}`,
    name: s.title,
    description: s.excerpt,
    image: s.imageUrl,
    datePublished: s.date,
  }));

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": isOrg ? "Organization" : "Person",
      name: authorName,
      url: canonicalUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Articles by ${authorName} on ${BRAND_NAME}`,
      numberOfItems: itemList.length,
      itemListElement: itemList,
    },
  ];

  const description = `Articles by ${authorName} on ${BRAND_NAME}.`;

  const storyListHtml = authorStories
    .map(
      (s) =>
        `<li style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #eee">
          <a href="${SITE_URL}${s.path}" style="font-weight:600;font-size:1.05em;text-decoration:none;color:#1a1a1a">${s.title}</a>
          <br/>
          <span style="font-size:0.82em;color:#888;margin-top:4px;display:block">
            ${new Date(s.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </li>`
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${authorName} | ${BRAND_NAME}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta property="og:title" content="${authorName} | ${BRAND_NAME}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:type" content="profile" />
  <meta property="og:site_name" content="${BRAND_NAME}" />
  <script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>
</head>
<body style="font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a">
  <nav><a href="${SITE_URL}" style="font-size:0.85em;color:#888">← ${BRAND_NAME}</a></nav>
  <h1 style="margin-top:24px;font-size:2em">${authorName}</h1>
  <ul style="list-style:none;padding:0;margin-top:32px">
    ${storyListHtml || "<li>No published stories yet.</li>"}
  </ul>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
  res.status(200).send(html);
}
