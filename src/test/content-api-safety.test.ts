import { beforeAll, describe, expect, it } from "vitest";
import handler from "../../api/content";

// Runs against the handler's in-memory store (no KV env vars in tests).
type Res = { statusCode: number; body: any };

async function call(method: "GET" | "POST", { query = {}, body }: { query?: Record<string, string>; body?: unknown } = {}): Promise<Res> {
  const out: Res = { statusCode: 0, body: null };
  const req = {
    method,
    query,
    body,
    headers: { "x-admin-password": "test-pw", origin: "https://www.themagorium.com" },
  } as unknown as Parameters<typeof handler>[0];
  const res = {
    status(code: number) { out.statusCode = code; return this; },
    json(payload: unknown) { out.body = payload; return this; },
    setHeader() { return this; },
  } as unknown as Parameters<typeof handler>[1];
  await handler(req, res);
  return out;
}

const story = (id: string, edition: string, title = id) => ({
  id, edition, title, subtitle: "", category: "Yachting", imageUrl: "/x.webp", author: "Millie Sealana", date: `${edition}-01`,
  excerpt: "x", body: [{ id: `${id}-t`, type: "text", content: `Body of ${title}` }],
});

const editionContent = async (edition: string) => (await call("GET", { query: { edition } })).body.content;

describe("content API never wipes editions by accident", () => {
  beforeAll(async () => {
    process.env.ADMIN_PASSWORD = "test-pw";
    for (const edition of ["2025-10", "2026-02", "2026-07"]) {
      const r = await call("POST", {
        body: { phase: "edition", edition, heroes: [story(`h-${edition}`, edition)], articles: [story(`a-${edition}`, edition)] },
      });
      expect(r.statusCode).toBe(200);
    }
  });

  it("a one-edition full-site publish (no phase) leaves every other edition intact", async () => {
    const r = await call("POST", {
      query: { edition: "2026-02" },
      body: { heroes: [story("h-2026-02", "2026-02", "Updated")], articles: [], ads: [] },
    });
    expect(r.statusCode).toBe(200);
    expect((await editionContent("2025-10")).heroes).toHaveLength(1);
    expect((await editionContent("2026-07")).articles).toHaveLength(1);
    const feb = await editionContent("2026-02");
    expect(feb.heroes[0].title).toBe("Updated");
    expect(feb.articles).toHaveLength(1); // story missing from payload is kept
  });

  it("refuses an empty edition save instead of deleting the edition", async () => {
    const r = await call("POST", { body: { phase: "edition", edition: "2026-07", heroes: [], articles: [] } });
    expect(r.statusCode).toBe(400);
    expect((await editionContent("2026-07")).heroes).toHaveLength(1);
  });

  it("deleting an edition needs explicit confirmation, and can be undone from the automatic backup", async () => {
    expect((await call("POST", { body: { phase: "delete-edition", edition: "2026-07" } })).statusCode).toBe(400);
    const del = await call("POST", { body: { phase: "delete-edition", edition: "2026-07", confirm: "2026-07" } });
    expect(del.statusCode).toBe(200);
    expect((await editionContent("2026-07")).heroes).toHaveLength(0);

    const restore = await call("POST", { body: { phase: "restore-backup", backupId: del.body.backupId } });
    expect(restore.statusCode).toBe(200);
    expect((await editionContent("2026-07")).heroes).toHaveLength(1);
    expect((await editionContent("2025-10")).heroes).toHaveLength(1);
  });

  it("only lists backups for an authorised admin", async () => {
    const r = await call("GET", { query: { list: "backups" } });
    expect(r.statusCode).toBe(200);
    expect(r.body.backups.length).toBeGreaterThan(0);
  });
});
