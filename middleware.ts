// Crawlers are handled by the user-agent rewrite in vercel.json, which serves
// the full HTML page (via /api/seo-router) at the page's own URL.
//
// This middleware used to 307-redirect crawlers to /api/seo-* URLs instead,
// and sent every other path (categories, archives, singular /author/ pages)
// to /api/content, which returned a multi-megabyte raw JSON dump of the whole
// site in place of the page. Redirecting only crawlers is also something
// search engines treat with suspicion. It now lets every request through.
export const config = {
  runtime: 'nodejs',
  matcher: '/((?!_next/static|_next/image|favicon.ico|assets|api).*)',
};

export default function middleware() {
  return;
}
