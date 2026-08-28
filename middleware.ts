import { next, rewrite } from '@vercel/edge';

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

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|assets).*)',
};

export default function middleware(request) {
  const userAgent = request.headers.get('user-agent');

  if (!isCrawler(userAgent)) {
    return next();
  }

  const url = new URL(request.url);
  const { pathname } = url;

  if (pathname === '/') {
    return rewrite(new URL('/api/seo-home', request.url));
  }

  const articleMatch = pathname.match(/^\/articles\/([^/]+)\/?$/);
  if (articleMatch) {
    return rewrite(
      new URL(`/api/seo-article?slug=${encodeURIComponent(articleMatch[1])}`, request.url)
    );
  }

  const authorMatch = pathname.match(/^\/authors\/([^/]+)\/?$/);
  if (authorMatch) {
    return rewrite(
      new URL(`/api/seo-author?author=${encodeURIComponent(authorMatch[1])}`, request.url)
    );
  }

  return rewrite(new URL(`/api/content?path=${encodeURIComponent(pathname)}`, request.url));
}
