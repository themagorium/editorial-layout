import type { VercelRequest, VercelResponse } from "@vercel/node";

type LoginRequestBody = {
  password?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }

  const auth = await import("./lib/admin-auth-store.js");
  if (!(await auth.isAdminConfigured())) {
    res.status(500).json({ error: "Server authentication is not configured." });
    return;
  }

  const { password } = (req.body || {}) as LoginRequestBody;
  if (!(await auth.checkAdminPassword(password || ""))) {
    res.status(401).json({ error: "Invalid credentials." });
    return;
  }
  const signingKey = (await auth.getSigningKey()) as string;

  try {
    const tokenModule = await import("./lib/publish-token.js");
    const { token, expiresAt } = tokenModule.createPublishToken(signingKey);
    res.status(200).json({ success: true, token, expiresAt });
    return;
  } catch {
    // Fallback for environments where token helper import fails at runtime.
    // Admin UI can continue by using direct password authorization headers.
    res.status(200).json({ success: true });
    return;
  }
}
