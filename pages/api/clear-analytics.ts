import type { NextApiRequest, NextApiResponse } from "next";
import { Redis } from "@upstash/redis";
const kv = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
// PLACEHOLDER — will be corrected once you paste your admin-login file's contents.
function isValidAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  return token === process.env.ADMIN_PUBLISH_TOKEN;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  if (!isValidAdminToken(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [contentKeys, locationKeys] = await Promise.all([
    kv.smembers("content_keys"),
    kv.smembers("location_keys"),
  ]);

  await Promise.all([
    kv.del("totals"),
    kv.del("recent_events"),
    kv.del("content_keys"),
    kv.del("location_keys"),
    ...(contentKeys || []).map((k) => kv.del(`content:${k}`)),
    ...(locationKeys || []).map((k) => kv.del(`location:${k}`)),
  ]);

  res.status(200).json({ success: true });
}
