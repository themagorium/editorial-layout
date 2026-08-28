const CRAWLER_USER_AGENTS = [
  'Googlebot',
  'Google-Extended',
  'Bingbot',
  'GPTBot',
  'ClaudeBot',
  'PerplexityBot',
  'OAI-SearchBot',
  'Applebot',
  'Applebot-Extended',
];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  return CRAWLER_USER_AGENTS.some((bot) =>
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|assets).*)',
};

export default function middleware(request) {
  const userAgent = request.headers.get('user-agent');

  if (!isCrawler(userAgent)) {
    return; // regular visitors: no rewrite, normal SPA loads as-is
  }

  const url = new URL(request.url);
  const { pathname } = url;

  if (pathname === '/') {
    return Response.redirect(new URL('/api/seo-home', request.url), 307);
  }

  const articleMatch = pathname.match(/^\/articles\/([^/]+)\/?$/);
  if (articleMatch) {
    return Response.redirect(
      new URL(`/api/seo-article?slug=${encodeURIComponent(articleMatch[1])}`, request.url),
      307
    );
  }

  const authorMatch = pathname.match(/^\/authors\/([^/]+)\/?$/);
  if (authorMatch) {
    return Response.redirect(
      new URL(`/api/seo-author?author=${encodeURIComponent(authorMatch[1])}`, request.url),
      307
    );
  }

  return Response.redirect(
    new URL(`/api/content?path=${encodeURIComponent(pathname)}`, request.url),
    307
  );
}
