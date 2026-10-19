import type { VercelRequest, VercelResponse } from "@vercel/node";

// TEMPORARY, READ-ONLY recovery endpoint. Lives only on the `recovery-readonly`
// preview branch. Never merged to main. Only issues read commands.
const READ_ONLY = new Set(["SCAN", "STRLEN", "TYPE", "GET", "GETRANGE", "DBSIZE", "LLEN", "HLEN", "HKEYS"]);

async function redis(cmd: (string | number)[]) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("KV not configured");
  if (!READ_ONLY.has(String(cmd[0]).toUpperCase())) throw new Error("blocked");
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const j = (await r.json()) as { result?: unknown; error?: string };
  if (j.error) throw new Error(j.error);
  return j.result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pw = process.env.ADMIN_PASSWORD;
  const given = String(req.headers["x-admin-password"] || "").trim();
  if (!pw || given !== pw) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  try {
    const action = String(req.query.action || "keys");
    if (action === "keys") {
      const match = String(req.query.match || "*");
      const keys: string[] = [];
      let cursor = "0";
      do {
        const out = (await redis(["SCAN", cursor, "MATCH", match, "COUNT", 1000])) as [string, string[]];
        cursor = out[0];
        keys.push(...out[1]);
      } while (cursor !== "0" && keys.length < 20000);
      const detailed = [];
      for (const k of keys) {
        const type = (await redis(["TYPE", k])) as string;
        const len = type === "string" ? ((await redis(["STRLEN", k])) as number) : null;
        detailed.push({ key: k, type, len });
      }
      res.status(200).json({ count: keys.length, dbsize: await redis(["DBSIZE"]), keys: detailed });
      return;
    }
    if (action === "get") {
      const key = String(req.query.key || "");
      const start = Number(req.query.start || 0);
      const end = Number(req.query.end || -1);
      const value = await redis(["GETRANGE", key, start, end]);
      res.status(200).json({ key, value });
      return;
    }
    res.status(400).json({ error: "unknown action" });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
