import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAdminRequest } from "./lib/admin-auth-store.js";
import { buildXlsx } from "./lib/xlsx.js";
import { isSmtpConfigured, sendSmtp } from "./lib/smtp.js";
import { WELCOME_SUBJECT, welcomeHtml, welcomeText } from "./lib/welcome-email.js";
import { unsubscribeUrl } from "./lib/unsubscribe-token.js";

// Newsletter sign-ups from the "Stay in the Loop" box.
//
// POST { contact }  (public) — an email address
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
const PHONE_RE = /^\+?\d{7,15}$/;

/** Email (lower-cased) or phone (digits, optional leading +). */
function parseContact(raw: string): { kind: "email" | "phone"; value: string } | null {
  const v = raw.trim().slice(0, 255);
  if (EMAIL_RE.test(v)) return { kind: "email", value: v.toLowerCase() };
  const phone = v.replace(/[\s().\-\/]/g, "").replace(/^00/, "+");
  if (PHONE_RE.test(phone)) return { kind: "phone", value: phone };
  return null;
}
const RATE_LIMIT_PER_HOUR = 10;

type SubscriberRecord = {
  email: string; // empty for phone-only sign-ups
  phone?: string;
  createdAt: string;
  lastSeenAt: string;
  count: number;
  page?: string;
  notified: boolean;
  notifyError?: string;
  welcomeSentAt?: string;
  welcomeError?: string;
  unsubscribed?: boolean;
  unsubscribedAt?: string;
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


function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function buildMessage(email: string, page: string, when: string, isRepeat: boolean, to: string) {
  const subject = `${to === NOTIFY_TO ? "" : "[for subscribe@] "}${isRepeat ? "Repeat sign-up" : "New subscriber"}: ${email}`;
  const html = `
    <div style="font-family:Georgia,serif;color:#1f1a4d">
      <h2 style="margin:0 0 12px">${isRepeat ? "Repeat sign-up" : "New Magorium subscriber"}</h2>
      <p style="font-size:16px;margin:0 0 6px"><strong>${email.includes("@") ? "Email" : "Phone"}:</strong> <a href="${email.includes("@") ? "mailto:" : "tel:"}${escapeHtml(email)}">${escapeHtml(email)}</a></p>
      <p style="font-size:14px;margin:0 0 6px"><strong>Signed up:</strong> ${escapeHtml(when)}</p>
      ${page ? `<p style="font-size:14px;margin:0 0 6px"><strong>Page:</strong> ${escapeHtml(page)}</p>` : ""}
      <p style="font-size:12px;color:#666;margin-top:18px">Every subscriber is also saved in the Magorium admin under Subscribers.</p>
    </div>`;
  const text = `${subject}\n\n${email.includes("@") ? "Email" : "Phone"}: ${email}\nSigned up: ${when}${page ? `\nPage: ${page}` : ""}\n\nEvery subscriber is also saved in the Magorium admin under Subscribers.`;
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
      body: JSON.stringify({ from, to: [to], ...(email.includes("@") ? { reply_to: email } : {}), subject, html, text }),
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
    const smtp = await sendSmtp({ from: `The Magorium <${process.env.SMTP_USER}>`, to: NOTIFY_TO, replyTo: email.includes("@") ? email : undefined, subject, html, text });
    if (smtp.ok) return { ok: true as const, via: "smtp" };
    else errors.push((smtp as { error: string }).error);
  }
  // 2) Resend.
  const senders = Array.from(new Set([from, DEFAULT_FROM]));
  for (const sender of senders) {
    const result = await sendResend(sender, email, page, when, isRepeat);
    if (result.ok) return { ok: true as const, via: sender };
    errors.push(result.error || "unknown error");
  }
  return { ok: false as const, error: errors.join(" | ") };
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");
  const kv = await getKv();

  if (req.method === "GET") {
    if (!(await isAdminRequest(req))) { res.status(401).json({ ok: false, error: "Unauthorized." }); return; }
    if (!kv) { res.status(503).json({ ok: false, error: "Database is not configured." }); return; }
    const all = (await kv.hgetall<unknown>(SUBSCRIBERS_KEY)) || {};
    const subscribers = Object.values(all).map(parseRecord).filter((r): r is SubscriberRecord => Boolean(r))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (first(req.query?.format as string | string[]).toLowerCase() === "xlsx") {
      const rows = [
        ["Email", "Phone", "Status", "Welcome email", "Signed up", "Last sign-up", "Times signed up", "Page", "Emailed to subscribe inbox"],
        ...subscribers.map((s) => [s.email, s.phone || "", s.unsubscribed ? "Unsubscribed" : "Subscribed", s.welcomeSentAt ? "Sent" : s.email ? "Not sent" : "—", new Date(s.createdAt), new Date(s.lastSeenAt), s.count || 1, s.page || "", s.notified ? "Yes" : "No"]),
      ];
      const buffer = buildXlsx("Subscribers", rows, [38, 20, 16, 16, 22, 22, 16, 36, 26]);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="magorium-subscribers.xlsx"`);
      res.status(200).send(buffer);
      return;
    }
    if (first(req.query?.format as string | string[]).toLowerCase() === "csv") {
      const rows = [["email", "phone", "status", "signed_up", "last_signup", "signups", "page", "emailed_to_subscribe_inbox"],
        ...subscribers.map((s) => [s.email, s.phone || "", s.unsubscribed ? "unsubscribed" : "subscribed", s.createdAt, s.lastSeenAt, String(s.count), s.page || "", s.notified ? "yes" : "no"])];
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
  const contact = parseContact(String(body.contact ?? body.email ?? ""));
  // Sign-ups are email only (phone sign-ups were retired Nov 2026; earlier phone records stay in the list).
  if (!contact || contact.kind !== "email") { res.status(400).json({ ok: false, error: "Please enter a valid email address." }); return; }
  // "email" below is the contact value (an email address or a phone number).
  const email = contact.value;
  const field = contact.kind === "email" ? email : `phone:${email}`;
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
      existing = parseRecord(await kv.hget<unknown>(SUBSCRIBERS_KEY, field));
      const record: SubscriberRecord = existing
        ? { ...existing, lastSeenAt: now.toISOString(), count: (existing.count || 1) + 1, unsubscribed: false }
        : { email: contact.kind === "email" ? email : "", ...(contact.kind === "phone" ? { phone: email } : {}), createdAt: now.toISOString(), lastSeenAt: now.toISOString(), count: 1, page, notified: false };
      await kv.hset(SUBSCRIBERS_KEY, { [field]: JSON.stringify(record) });
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
      const current = parseRecord(await kv.hget<unknown>(SUBSCRIBERS_KEY, field));
      if (current) {
        await kv.hset(SUBSCRIBERS_KEY, {
          [field]: JSON.stringify({ ...current, notified: current.notified || result.ok, notifiedVia: result.ok ? result.via : current.notifiedVia, lastWarnings: result.ok && "warnings" in result ? result.warnings : undefined, notifyError: result.ok ? undefined : result.error }),
        });
      }
    } catch { /* status flag only */ }
  }

  // 3) Welcome email to the subscriber: email sign-ups only, first time (or
  //    after they had unsubscribed), never twice.
  if (contact.kind === "email" && isSmtpConfigured() && (!existing || existing.unsubscribed || !existing.welcomeSentAt)) {
    try {
      const unsubUrl = await unsubscribeUrl(email);
      const welcome = await sendSmtp({
        from: DEFAULT_FROM,
        to: email,
        replyTo: NOTIFY_TO,
        subject: WELCOME_SUBJECT,
        html: welcomeHtml(unsubUrl),
        text: welcomeText(unsubUrl),
        headers: { "List-Unsubscribe": `<${unsubUrl}>, <mailto:${NOTIFY_TO}?subject=unsubscribe>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      });
      if (kv && saved) {
        const current = parseRecord(await kv.hget<unknown>(SUBSCRIBERS_KEY, field));
        if (current) {
          await kv.hset(SUBSCRIBERS_KEY, {
            [field]: JSON.stringify({ ...current, ...(welcome.ok ? { welcomeSentAt: new Date().toISOString(), welcomeError: undefined } : { welcomeError: (welcome as { error: string }).error }) }),
          });
        }
      }
      if (!welcome.ok) console.error("[subscribe] welcome email failed", (welcome as { error: string }).error);
    } catch (error) {
      console.error("[subscribe] welcome email failed", error);
    }
  }

  if (!saved && !result.ok) {
    res.status(500).json({ ok: false, error: "Sorry, we couldn't save your subscription. Please try again." });
    return;
  }
  res.status(200).json({ ok: true, saved, emailed: result.ok });
}
