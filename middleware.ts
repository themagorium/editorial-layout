export const config = {
  matcher: '/((?!api|static|.*\\..*).*)',
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

  // Guard against prerender.io hanging indefinitely — cap at 8s and fall
  // back to serving the normal app rather than timing out the whole request.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const prerenderResponse = await fetch(prerenderUrl, {
      headers: {
        'X-Prerender-Token': process.env.PRERENDER_TOKEN || '',
        'User-Agent': userAgent,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return new Response(await prerenderResponse.text(), {
      status: prerenderResponse.status,
      headers: prerenderResponse.headers,
    });
  } catch (err) {
    clearTimeout(timeout);
    // Prerender.io timed out or errored — fall through to normal app
    // rendering instead of hanging the request or serving an error page.
    return;
  }
}
