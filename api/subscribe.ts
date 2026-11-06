import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyPublishToken } from "./lib/publish-token.js";
import { buildXlsx } from "./lib/xlsx.js";
import { isSmtpConfigured, sendSmtp } from "./lib/smtp.js";

// Newsletter sign-ups from the "Stay in the Loop" box.
//
// POST { email }  (public)
//   1. Saves the address in the database FIRST, so a sign-up is never lost
//      even if email delivery fails.
//   2. Emails the address to subscribe@themagorium.com (via Resend).
//
// GET  (admin only: x-admin-password or admin Bearer token)
//   Returns every subscriber, newest first. ?format=csv downloads a CSV.

const SUBSCRIBERS_KEY = "magorium:subscribers:v1"; // hash: email -> JSON record
const NOTIFY_TO = process.env.SUBSCRIBE_NOTIFY_TO || "subscribe@themagorium.com";
const DEFAULT_FROM = "The Magorium <subscribe@themagorium.com>";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_PER_HOUR = 10;

type SubscriberRecord = {
  email: string;
  createdAt: string;
  lastSeenAt: string;
  count: number;
  page?: string;
  notified: boolean;
  notifyError?: string;
  notifiedVia?: string;
  lastWarnings?: string;
};

type Kv = {
  hget: <T>(key: string, field: string) => Promise<T | null>;
  hset: (key: string, value: Record<string, unknown>) => Promise<unknown>;
  hgetall: <T>(key: string) => Promise<Record<string, T> | null>;
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<unknown>;
};

async function getKv(): Promise<Kv | null> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  try {
    const mod = await import("@vercel/kv");
    return mod.kv as unknown as Kv;
  } catch {
    return null;
  }
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) || "";
}

function parseRecord(raw: unknown): SubscriberRecord | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try { return JSON.parse(raw) as SubscriberRecord; } catch { return null; }
  }
  return raw as SubscriberRecord;
}

function isAdmin(req: VercelRequest): boolean {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return false;
  const bearer = first(req.headers.authorization).replace(/^Bearer\s+/i, "").trim();
  if (bearer && verifyPublishToken(bearer, configured)) return true;
  return first(req.headers["x-admin-password"]).trim() === configured;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function buildMessage(email: string, page: string, when: string, isRepeat: boolean, to: string) {
  const subject = `${to === NOTIFY_TO ? "" : "[for subscribe@] "}${isRepeat ? "Repeat sign-up" : "New subscriber"}: ${email}`;
  const html = `
    <div style="font-family:Georgia,serif;color:#1f1a4d">
      <h2 style="margin:0 0 12px">${isRepeat ? "Repeat sign-up" : "New Magorium subscriber"}</h2>
      <p style="font-size:16px;margin:0 0 6px"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
      <p style="font-size:14px;margin:0 0 6px"><strong>Signed up:</strong> ${escapeHtml(when)}</p>
      ${page ? `<p style="font-size:14px;margin:0 0 6px"><strong>Page:</strong> ${escapeHtml(page)}</p>` : ""}
      <p style="font-size:12px;color:#666;margin-top:18px">Every subscriber is also saved in the Magorium admin under Subscribers.</p>
    </div>`;
  const text = `${subject}\n\nEmail: ${email}\nSigned up: ${when}${page ? `\nPage: ${page}` : ""}\n\nEvery subscriber is also saved in the Magorium admin under Subscribers.`;
  return { subject, html, text };
}

async function sendResend(from: string, email: string, page: string, when: string, isRepeat: boolean, to: string = NOTIFY_TO) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set." };
  const { subject, html, text } = buildMessage(email, page, when, isRepeat, to);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], reply_to: email, subject, html, text }),
    });
    if (response.ok) return { ok: true as const };
    const body = await response.text().catch(() => "");
    return { ok: false as const, error: `Resend ${response.status}: ${body.slice(0, 300)}` };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Email request failed." };
  }
}

async function notify(email: string, page: string, when: string, isRepeat: boolean) {
  const configuredFrom = (process.env.SUBSCRIBE_FROM_EMAIL || process.env.ADMIN_RESET_FROM_EMAIL || "").trim();
  const from = configuredFrom || DEFAULT_FROM;
  const errors: string[] = [];
  // 1) Preferred: the Magorium's own mail server (GoDaddy), straight to subscribe@.
  if (isSmtpConfigured()) {
    const { subject, html, text } = buildMessage(email, page, when, isRepeat, NOTIFY_TO);
    const smtp = await sendSmtp({ from: `The Magorium <${process.env.SMTP_USER}>`, to: NOTIFY_TO, replyTo: email, subject, html, text });
    if (smtp.ok) return { ok: true as const, via: "smtp" };
    else errors.push((smtp as { error: string }).error);
  }
  // 2) Resend.
  const senders = Array.from(new Set([from, DEFAULT_FROM, RESEND_TEST_FROM]));
  for (const sender of senders) {
    const result = await sendResend(sender, email, page, when, isRepeat);
    if (result.ok) return { ok: true as const, via: sender };
    errors.push(result.error || "unknown error");
  }
  // Until themagorium.com is verified in Resend, Resend will only deliver to
  // the Resend account owner. Send it there so no sign-up goes unseen.
  const fallback = await sendResend(RESEND_TEST_FROM, email, page, when, isRepeat, OWNER_FALLBACK_TO);
  if (fallback.ok) {
    console.warn("[subscribe] delivered via owner fallback; earlier attempts failed:", errors.join(" | "));
    return { ok: true as const, via: `fallback to ${OWNER_FALLBACK_TO}`, warnings: errors.join(" | ").slice(0, 900) };
  }
  errors.push(fallback.error || "unknown error");
  return { ok: false as const, error: errors.join(" | ") };
}

// Resend's shared test sender works before themagorium.com is verified in
// Resend, but Resend only delivers it to the Resend account owner's address.
const RESEND_TEST_FROM = "The Magorium <onboarding@resend.dev>";
const OWNER_FALLBACK_TO = process.env.SUBSCRIBE_FALLBACK_TO || "millie@themagorium.com";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  const kv = await getKv();

  if (req.method === "GET") {
    if (!isAdmin(req)) { res.status(401).json({ ok: false, error: "Unauthorized." }); return; }
    if (!kv) { res.status(503).json({ ok: false, error: "Database is not configured." }); return; }
    const all = (await kv.hgetall<unknown>(SUBSCRIBERS_KEY)) || {};
    const subscribers = Object.values(all).map(parseRecord).filter((r): r is SubscriberRecord => Boolean(r))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (first(req.query?.format as string | string[]).toLowerCase() === "xlsx") {
      const rows = [
        ["Email", "Signed up", "Last sign-up", "Times signed up", "Page", "Emailed to subscribe inbox"],
        ...subscribers.map((s) => [s.email, new Date(s.createdAt), new Date(s.lastSeenAt), s.count || 1, s.page || "", s.notified ? "Yes" : "No"]),
      ];
      const buffer = buildXlsx("Subscribers", rows, [38, 22, 22, 16, 36, 26]);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="magorium-subscribers.xlsx"`);
      res.status(200).send(buffer);
      return;
    }
    if (first(req.query?.format as string | string[]).toLowerCase() === "csv") {
      const rows = [["email", "signed_up", "last_signup", "signups", "page", "emailed_to_subscribe_inbox"],
        ...subscribers.map((s) => [s.email, s.createdAt, s.lastSeenAt, String(s.count), s.page || "", s.notified ? "yes" : "no"])];
      const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="magorium-subscribers.csv"`);
      res.status(200).send(csv);
      return;
    }
    res.status(200).json({ ok: true, count: subscribers.length, subscribers });
    return;
  }

  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "Method not allowed." }); return; }

  const body = (typeof req.body === "string" ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : req.body) || {};
  // Honeypot: real visitors never fill this hidden field.
  if (typeof body.website === "string" && body.website.trim()) { res.status(200).json({ ok: true }); return; }
  const email = String(body.email || "").trim().toLowerCase().slice(0, 255);
  if (!EMAIL_RE.test(email)) { res.status(400).json({ ok: false, error: "Please enter a valid email address." }); return; }
  const page = String(body.page || "").slice(0, 300);
  const now = new Date();
  const when = now.toLocaleString("en-GB", { timeZone: "Europe/Zurich", dateStyle: "medium", timeStyle: "short" }) + " (Swiss time)";

  if (kv) {
    const ip = first(req.headers["x-forwarded-for"]).split(",")[0].trim() || "unknown";
    try {
      const rateKey = `magorium:subscribe-rate:${ip}`;
      const hits = await kv.incr(rateKey);
      if (hits === 1) await kv.expire(rateKey, 3600);
      if (hits > RATE_LIMIT_PER_HOUR) { res.status(429).json({ ok: false, error: "Too many attempts. Please try again later." }); return; }
    } catch { /* rate limiting is best-effort */ }
  }

  // 1) Save first.
  let existing: SubscriberRecord | null = null;
  let saved = false;
  if (kv) {
    try {
      existing = parseRecord(await kv.hget<unknown>(SUBSCRIBERS_KEY, email));
      const record: SubscriberRecord = existing
        ? { ...existing, lastSeenAt: now.toISOString(), count: (existing.count || 1) + 1 }
        : { email, createdAt: now.toISOString(), lastSeenAt: now.toISOString(), count: 1, page, notified: false };
      await kv.hset(SUBSCRIBERS_KEY, { [email]: JSON.stringify(record) });
      saved = true;
    } catch (error) {
      console.error("[subscribe] save failed", error);
    }
  }

  // 2) Email the subscribe inbox.
  const result = await notify(email, page, when, Boolean(existing));
  if (!result.ok) console.error("[subscribe] email failed", result.error);
  if (kv && saved) {
    try {
      const current = parseRecord(await kv.hget<unknown>(SUBSCRIBERS_KEY, email));
      if (current) {
        await kv.hset(SUBSCRIBERS_KEY, {
          [email]: JSON.stringify({ ...current, notified: current.notified || result.ok, notifiedVia: result.ok ? result.via : current.notifiedVia, lastWarnings: result.ok && "warnings" in result ? result.warnings : undefined, notifyError: result.ok ? undefined : result.error }),
        });
      }
    } catch { /* status flag only */ }
  }

  if (!saved && !result.ok) {
    res.status(500).json({ ok: false, error: "Sorry, we couldn't save your subscription. Please try again." });
    return;
  }
  res.status(200).json({ ok: true, saved, emailed: result.ok, ...(result.ok && result.via?.startsWith("fallback") ? { emailedTo: "owner" } : {}) });
}
