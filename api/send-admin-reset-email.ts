import type { VercelRequest, VercelResponse } from "@vercel/node";

type SendResetRequestBody = {
  to?: string;
  resetLink?: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.ADMIN_RESET_FROM_EMAIL;

  if (req.method === "GET") {
    res.status(200).json({
      configured: Boolean(resendApiKey && fromEmail),
    });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const { to, resetLink } = (req.body || {}) as SendResetRequestBody;
  if (!to || !resetLink) {
    res.status(400).json({ error: "Missing required fields: to, resetLink." });
    return;
  }

  if (!resendApiKey || !fromEmail) {
    res.status(500).json({
      error: "Email service is not configured. Set RESEND_API_KEY and ADMIN_RESET_FROM_EMAIL.",
    });
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: "The Magorium password reset link",
      text: `Use this admin password reset link:\n\n${resetLink}\n\nThis opens the admin login page.`,
    }),
  });

  const responseText = await response.text();
  let responsePayload: { id?: string } | null = null;
  try {
    responsePayload = responseText ? (JSON.parse(responseText) as { id?: string }) : null;
  } catch {
    responsePayload = null;
  }
  if (!response.ok) {
    res.status(502).json({
      error: `Email provider request failed: ${response.status} ${responseText}`,
    });
    return;
  }

  res.status(200).json({ success: true, id: responsePayload?.id ?? null });
}
