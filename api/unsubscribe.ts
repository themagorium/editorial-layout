import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getKv } from "./lib/admin-auth-store.js";
import { verifyUnsubscribeToken } from "./lib/unsubscribe-token.js";

// One-click unsubscribe from the welcome (and future) emails.
// GET  /api/unsubscribe?e=<email>&t=<token>  -> confirmation page
// POST same URL                               -> mail apps' one-click unsubscribe

const SUBSCRIBERS_KEY = "magorium:subscribers:v1";

function first(v: unknown): string { return (Array.isArray(v) ? v[0] : v as string) || ""; }

function page(title: string, message: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} · The Magorium</title><meta name="robots" content="noindex"></head>
<body style="margin:0;background:#262065;font-family:Calibri,Helvetica,Arial,sans-serif;color:#f3f1ed;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box">
<div style="max-width:520px;text-align:center">
<div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:2px"><span>THE </span><span style="color:#dbb870">MAGORIUM</span></div>
<div style="font-family:Georgia,serif;font-size:10px;letter-spacing:4px;color:#dbb870;margin:8px 0 36px">WHERE CURATED BECOMES LEGEND</div>
<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 14px">${title}</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 28px;color:#d9d5e8">${message}</p>
<a href="https://www.themagorium.com/" style="color:#dbb870;font-size:14px">Visit themagorium.com</a>
</div></body></html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  const email = first(req.query?.e).trim().toLowerCase();
  const token = first(req.query?.t).trim();
  const send = (code: number, title: string, message: string) => {
    if (req.method === "POST") { res.status(code).json({ ok: code === 200 }); return; }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(code).send(page(title, message));
  };

  if (!email || !token || !(await verifyUnsubscribeToken(email, token).catch(() => false))) {
    send(400, "This link isn't valid", "Please use the unsubscribe link from your most recent email from The Magorium, or reply to that email and we'll remove you.");
    return;
  }
  const kv = (await getKv()) as unknown as { hget: <T>(k: string, f: string) => Promise<T | null>; hset: (k: string, v: Record<string, unknown>) => Promise<unknown> } | null;
  if (!kv) { send(503, "Please try again", "We couldn't process this right now. Please try again in a few minutes."); return; }
  const raw = await kv.hget<unknown>(SUBSCRIBERS_KEY, email);
  const record = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (record) {
    await kv.hset(SUBSCRIBERS_KEY, { [email]: JSON.stringify({ ...record, unsubscribed: true, unsubscribedAt: new Date().toISOString() }) });
  }
  send(200, "You've been unsubscribed", `${email.replace(/[<>&"]/g, "")} will no longer receive emails from The Magorium. If this was a mistake, you can subscribe again at themagorium.com.`);
}
