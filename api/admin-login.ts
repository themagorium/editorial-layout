import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isTrustedAdminRequest } from "./lib/trusted-admin-origin";

type LoginRequestBody = {
  password?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  if (!isTrustedAdminRequest(req)) {
    res.status(403).json({ error: "Untrusted admin origin." });
    return;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.status(500).json({ error: "Server authentication is not configured." });
    return;
  }

  const { password } = (req.body || {}) as LoginRequestBody;
  const normalizedInput = (password || "").trim();
  if (!normalizedInput) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  if (normalizedInput !== adminPassword) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }

  try {
    const tokenModule = await import("./lib/publish-token");
    const { token, expiresAt } = tokenModule.createPublishToken(adminPassword);
    res.status(200).json({ success: true, token, expiresAt });
    return;
  } catch {
    // Fallback for environments where token helper import fails at runtime.
    // Admin UI can continue by using direct password authorization headers.
    res.status(200).json({ success: true });
    return;
  }
}
