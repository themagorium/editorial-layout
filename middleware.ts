import { NextResponse } from 'next/server';

// Crawlers this site explicitly invites in via robots.txt.
// Keep this list in sync with robots.txt.
const CRAWLER_USER_AGENTS = [
  'Googlebot',
  'Bingbot',
  'GPTBot',
  'ClaudeBot',
  'PerplexityBot',
  'OAI-SearchBot',
  'Applebot',
];

function isCrawler(userAgent) {
  if (!userAgent) return false;
  return CRAWLER_USER_AGENTS.some((bot) =>
    userAgent.toLowerCase().includes(bot.toLowerCase())
  );
}

export function middleware(request) {
  const userAgent = request.headers.get('user-agent');

  if (!isCrawler(userAgent)) {
    // Regular visitors: serve the normal client-side SPA, untouched.
    return NextResponse.next();
  }

  // Route known crawlers to the prerendered HTML snapshot routes.
  // This replaces the old broken `x-prerender-token` gate — that check
  // compared an incoming header against an env var that was never set
  // (or was mismatched), so every legitimate crawler was rejected with
  // a 503 before ever reaching these routes. There's no reason to gate
  // content that robots.txt already publishes openly, so the token
  // check is removed rather than repaired.

  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/api/seo-home', request.url));
  }

  const articleMatch = pathname.match(/^\/articles\/([^/]+)\/?$/);
  if (articleMatch) {
    const slug = articleMatch[1];
    return NextResponse.rewrite(
      new URL(`/api/seo-article?slug=${encodeURIComponent(slug)}`, request.url)
    );
  }

  const authorMatch = pathname.match(/^\/authors\/([^/]+)\/?$/);
  if (authorMatch) {
    const author = authorMatch[1];
    return NextResponse.rewrite(
      new URL(`/api/seo-author?author=${encodeURIComponent(author)}`, request.url)
    );
  }

  return NextResponse.rewrite(
    new URL(`/api/content?path=${encodeURIComponent(pathname)}`, request.url)
  );
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
