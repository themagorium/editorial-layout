import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomBytes } from "node:crypto";
import { getKv, setAdminPassword, sha256 } from "./lib/admin-auth-store.js";
import { isSmtpConfigured, sendSmtp } from "./lib/smtp.js";

// Admin "Forgot password".
// POST { action: "request" }               -> emails a one-time link to the owner
// POST { action: "reset", token, password } -> sets the new admin password
//
// The link only ever goes to ADMIN_RESET_TO (default millie@themagorium.com);
// the request cannot choose the recipient.

const RESET_TO = process.env.ADMIN_RESET_TO || "millie@themagorium.com";
const SITE = process.env.SITE_URL || "https://www.themagorium.com";
const TOKEN_TTL_SECONDS = 30 * 60;
const MAX_REQUESTS_PER_HOUR = 5;
const MIN_PASSWORD_LENGTH = 10;

const tokenKey = (hash: string) => `magorium:admin-reset:${hash}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "Method not allowed." }); return; }
  const kv = await getKv();
  if (!kv) { res.status(503).json({ ok: false, error: "Database is not configured." }); return; }

  const body = (typeof req.body === "string" ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : req.body) || {};
  const action = String(body.action || "");

  if (action === "request") {
    const hits = await kv.incr("magorium:admin-reset-rate").catch(() => 1);
    if (hits === 1) await kv.expire("magorium:admin-reset-rate", 3600).catch(() => undefined);
    if (hits > MAX_REQUESTS_PER_HOUR) {
      res.status(429).json({ ok: false, error: "Too many reset requests. Please wait an hour and try again." });
      return;
    }
    if (!isSmtpConfigured()) { res.status(503).json({ ok: false, error: "Email is not configured on the server." }); return; }

    const token = randomBytes(32).toString("base64url");
    await kv.set(tokenKey(sha256(token)), "1", { ex: TOKEN_TTL_SECONDS });
    const link = `${SITE}/admin?resetToken=${encodeURIComponent(token)}`;
    const when = new Date().toLocaleString("en-GB", { timeZone: "Europe/Zurich", dateStyle: "medium", timeStyle: "short" }) + " (Swiss time)";
    const text = `Someone asked to reset the password for The Magorium admin (${when}).\n\nTo choose a new password, open this link within 30 minutes:\n\n${link}\n\nThe link works once. If you didn't ask for this, ignore this email; your password stays the same.`;
    const html = `<div style="font-family:Georgia,serif;color:#1f1a4d;max-width:520px">
      <h2 style="margin:0 0 12px">Reset your Magorium admin password</h2>
      <p>Someone asked to reset the password for The Magorium admin (${when}).</p>
      <p><a href="${link}" style="display:inline-block;background:#241f5c;color:#e8c36a;padding:12px 22px;border-radius:6px;text-decoration:none">Choose a new password</a></p>
      <p style="font-size:13px;color:#555">The link works once and expires in 30 minutes. If you didn't ask for this, ignore this email; your password stays the same.</p>
    </div>`;
    const sent = await sendSmtp({ from: `The Magorium <${process.env.SMTP_USER}>`, to: RESET_TO, subject: "Reset your Magorium admin password", text, html });
    if (!sent.ok) {
      console.error("[admin-reset] email failed", (sent as { error: string }).error);
      res.status(502).json({ ok: false, error: "The reset email couldn't be sent. Please try again later." });
      return;
    }
    res.status(200).json({ ok: true, sentTo: RESET_TO.replace(/^(.).*(@.*)$/, "$1•••$2") });
    return;
  }

  if (action === "reset") {
    const token = String(body.token || "");
    const password = String(body.password || "").trim();
    if (password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ ok: false, error: `Please use at least ${MIN_PASSWORD_LENGTH} characters.` });
      return;
    }
    const key = tokenKey(sha256(token));
    const valid = token ? await kv.get<unknown>(key) : null;
    if (!valid) {
      res.status(400).json({ ok: false, error: "This reset link has expired or was already used. Please request a new one." });
      return;
    }
    await kv.del(key); // one-time use
    await setAdminPassword(password);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(400).json({ ok: false, error: "Unknown action." });
}
