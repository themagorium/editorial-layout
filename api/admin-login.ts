import type { VercelRequest, VercelResponse } from "@vercel/node";

type LoginRequestBody = {
  password?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
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

  res.status(200).json({ success: true });
}
