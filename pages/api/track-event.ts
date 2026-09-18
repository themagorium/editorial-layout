import type { NextApiRequest, NextApiResponse } from "next";
import { kv } from "@vercel/kv";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { contentId, contentType, eventType, metadata } = req.body || {};
  if (!contentId || !contentType || !eventType) {
    res.status(400).json({ error: "Missing contentId, contentType, or eventType" });
    return;
  }
  if (!["article", "hero", "ad"].includes(contentType) || !["view", "click"].includes(eventType)) {
    res.status(400).json({ error: "Invalid contentType or eventType" });
    return;
  }

  const countryCode = (req.headers["x-vercel-ip-country"] as string) || "";
  const cityRaw = (req.headers["x-vercel-ip-city"] as string) || "";
  const city = cityRaw ? decodeURIComponent(cityRaw) : "Unknown";

  let countryName = "Unknown";
  try {
    countryName = countryCode
      ? new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) || countryCode
      : "Unknown";
  } catch {
    countryName = countryCode || "Unknown";
  }

  const event = {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    contentId,
    contentType,
    eventType,
    timestamp: new Date().toISOString(),
    metadata: metadata || {},
    location: countryCode ? { city, country: countryName, countryCode, region: "" } : undefined,
  };

  const bucket = eventType === "view" ? "views" : "clicks";
  const contentKey = `${contentType}:${contentId}`;
  const locKey = countryCode ? `${city}|${countryName}|${countryCode}` : null;

  await Promise.all([
    kv.hincrby(`content:${contentKey}`, bucket, 1),
    kv.sadd("content_keys", contentKey),
    kv.hincrby("totals", bucket, 1),
    locKey ? kv.hincrby(`location:${locKey}`, bucket, 1) : Promise.resolve(),
    locKey ? kv.sadd("location_keys", locKey) : Promise.resolve(),
    kv.lpush("recent_events", JSON.stringify(event)),
    kv.ltrim("recent_events", 0, 49),
  ]);

  res.status(200).json({ success: true });
}
