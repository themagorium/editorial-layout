import fs from "fs";
import path from "path";

let cachedShell: string | null = null;

function loadShell(): string {
  if (cachedShell) return cachedShell;
  const shellPath = path.join(process.cwd(), "dist", "index.html");
  cachedShell = fs.readFileSync(shellPath, "utf-8");
  return cachedShell;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderPage(opts: {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogType?: string;
  structuredData: object | object[];
  bodyHtml: string;
}): string {
  let html = loadShell();

  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(opts.title)}</title>`);

  const headInjection = `
  <meta name="description" content="${escapeHtml(opts.description)}" />
  <link rel="canonical" href="${opts.canonical}" />
  <meta property="og:title" content="${escapeHtml(opts.title)}" />
  <meta property="og:description" content="${escapeHtml(opts.description)}" />
  <meta property="og:url" content="${opts.canonical}" />
  <meta property="og:type" content="${opts.ogType || "article"}" />
  ${opts.ogImage ? `<meta property="og:image" content="${opts.ogImage}" />` : ""}
  <script type="application/ld+json">${JSON.stringify(opts.structuredData)}</script>
  `;
  html = html.replace("</head>", `${headInjection}</head>`);

  html = html.replace(/<div id="root">.*?<\/div>/is, `<div id="root">${opts.bodyHtml}</div>`);

  return html;
}
