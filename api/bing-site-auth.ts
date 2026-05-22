import type { VercelRequest, VercelResponse } from "@vercel/node";

const BING_SITE_VERIFICATION_TOKEN = "A28C29B769451A568A699A7479DF03F8";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=600, s-maxage=600");
  res.status(200).send(
    `<?xml version="1.0"?>\n<users>\n  <user>${BING_SITE_VERIFICATION_TOKEN}</user>\n</users>\n`,
  );
}
