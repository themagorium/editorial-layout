import { describe, expect, it } from "vitest";
import handler from "../../api/content";
import archive from "../../content/published-archive.json";

// Fresh module per test file, so the handler's in-memory store starts EMPTY —
// the same situation as a wiped database.
type Res = { statusCode: number; body: any; headers: Record<string, string> };

async function call(method: "GET" | "POST", { query = {}, body }: { query?: Record<string, string>; body?: unknown } = {}): Promise<Res> {
  const out: Res = { statusCode: 0, body: null, headers: {} };
  const req = {
    method,
    query,
    body,
    headers: { "x-admin-password": "test-pw", origin: "https://www.themagorium.com" },
  } as unknown as Parameters<typeof handler>[0];
  const res = {
    headersSent: false,
    status(code: number) { out.statusCode = code; return this; },
    json(payload: unknown) { out.body = payload; return this; },
    setHeader(key: string, value: string) { out.headers[key] = value; return this; },
  } as unknown as Parameters<typeof handler>[1];
  await handler(req, res);
  return out;
}

const archived = archive as unknown as {
  editions: Record<string, { heroes: Array<{ id: string; body: Array<{ type: string; content: string }> }>; articles: Array<{ id: string }> }>;
};

describe("GitHub archive keeps the site readable when the database is empty", () => {
  it("the committed archive holds every edition with full text and file-based photos", () => {
    const editions = Object.keys(archived.editions);
    expect(editions.length).toBeGreaterThanOrEqual(7);
    const raw = JSON.stringify(archive);
    expect(raw).not.toContain("data:image");
    const stories = editions.reduce((n, e) => n + archived.editions[e].heroes.length + archived.editions[e].articles.length, 0);
    expect(stories).toBeGreaterThanOrEqual(42);
  });

  it("serves editions, a full edition, the homepage and single stories from the archive", async () => {
    const list = await call("GET", { query: { list: "editions" } });
    expect(list.statusCode).toBe(200);
    expect(list.body.source).toBe("github-archive");
    expect(list.body.editions).toEqual(expect.arrayContaining(["2025-10", "2026-02", "2026-09"]));

    const feb = await call("GET", { query: { edition: "2026-02" } });
    const hero = feb.body.content.heroes[0];
    expect(hero).toBeTruthy();
    expect(hero.body.some((block: { type: string }) => block.type === "image")).toBe(true);
    expect(hero.body.some((block: { type: string; content: string }) => block.type === "text" && block.content.length > 200)).toBe(true);

    const latest = await call("GET", { query: { view: "latest", heroLimit: "3", articleLimit: "4" } });
    expect(latest.body.content.latestEdition).toBe("2026-09");
    expect(latest.body.content.heroes.length + latest.body.content.articles.length).toBeGreaterThan(0);

    const one = await call("GET", { query: { storyId: "a1", storyType: "article" } });
    expect(one.body.content.story.id).toBe("a1");
  });

  it("stops using the archive the moment the database holds content (never mixes or resurrects)", async () => {
    process.env.ADMIN_PASSWORD = "test-pw";
    const story = {
      id: "only-live", edition: "2026-02", title: "Only live", subtitle: "", category: "Yachting", imageUrl: "/x.webp",
      author: "Millie Sealana", date: "2026-02-01", excerpt: "x", body: [{ id: "t", type: "text", content: "Live body" }],
    };
    const saved = await call("POST", { body: { phase: "story", edition: "2026-02", storyType: "article", story } });
    expect(saved.statusCode).toBe(200);

    const feb = await call("GET", { query: { edition: "2026-02" } });
    expect(feb.body.source).toBeUndefined();
    expect(feb.body.content.articles.map((a: { id: string }) => a.id)).toEqual(["only-live"]);
    expect(feb.body.content.heroes).toHaveLength(0);
  });
});
