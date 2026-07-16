export const config = {
  matcher: '/((?!api|_next|static|.*\\..*).*)',
};

const BOT_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'yandex',
  'baiduspider',
  'facebookexternalhit',
  'twitterbot',
  'rogerbot',
  'linkedinbot',
  'embedly',
  'quora link preview',
  'showyoubot',
  'outbrain',
  'pinterest',
  'slackbot',
  'vkshare',
  'w3c_validator',
  'whatsapp',
  'gptbot',
  'chatgpt-user',
  'ccbot',
  'anthropic-ai',
  'claudebot',
  'perplexitybot',
  'mcafee',
  'mcafeewebadvisor',
];

export default async function middleware(request: Request) {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';
  const isBot = BOT_USER_AGENTS.some((bot) => userAgent.includes(bot));

  if (!isBot) {
    return;
  }

  const url = new URL(request.url);
  const prerenderUrl = `https://service.prerender.io/${url.toString()}`;

  const prerenderResponse = await fetch(prerenderUrl, {
    headers: {
      'X-Prerender-Token': process.env.PRERENDER_TOKEN || '',
      'User-Agent': userAgent,
    },
  });

  return new Response(await prerenderResponse.text(), {
    status: prerenderResponse.status,
    headers: prerenderResponse.headers,
  });
}
