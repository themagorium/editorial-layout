import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPublishedContentSnapshot,
  syncPublishedContentToLocalStorage,
} from "@/lib/content-store";

function createHero(id: string, edition = "2025-10") {
  return {
    id,
    title: `Hero ${id}`,
    subtitle: "Subtitle",
    category: "Travel",
    imageUrl: "/hero.jpg",
    author: "Staff",
    date: "2025-10-01",
    edition,
    body: [{ id: `${id}-b1`, type: "text", content: "Body copy" }],
  };
}

function createArticle(id: string, edition = "2025-10") {
  return {
    id,
    title: `Article ${id}`,
    excerpt: "Excerpt",
    category: "Travel",
    imageUrl: "/article.jpg",
    author: "Staff",
    date: "2025-10-02",
    edition,
    body: [{ id: `${id}-b1`, type: "text", content: "Body copy" }],
  };
}

describe("published content snapshot", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it("returns fallback defaults when API request fails", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const snapshot = await getPublishedContentSnapshot();
    expect(Array.isArray(snapshot.heroes)).toBe(true);
    expect(Array.isArray(snapshot.articles)).toBe(true);
    expect(Array.isArray(snapshot.ads)).toBe(true);
    expect(snapshot.heroes.length).toBeGreaterThan(0);
    expect(snapshot.articles.length).toBeGreaterThan(0);

    globalThis.fetch = originalFetch;
  });

  it("prefers published API content over stale local cache when no local draft exists", async () => {
    localStorage.setItem("editorial_heroes", JSON.stringify([createHero("local-hero")]));
    localStorage.setItem("editorial_articles", JSON.stringify([createArticle("local-article")]));
    localStorage.setItem("editorial_ads", JSON.stringify([]));
    localStorage.setItem("editorial_content_version", "4");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        content: {
          heroes: [createHero("remote-hero", "2026-01")],
          articles: [createArticle("remote-article", "2026-01")],
          ads: [],
        },
      }),
    }) as unknown as typeof fetch;

    const snapshot = await getPublishedContentSnapshot();
    expect(snapshot.heroes[0]?.id).toBe("remote-hero");
    expect(snapshot.articles[0]?.id).toBe("remote-article");
  });

  it("falls back to cached local snapshot when API is unreachable", async () => {
    localStorage.setItem("editorial_heroes", JSON.stringify([createHero("cached-hero")]));
    localStorage.setItem("editorial_articles", JSON.stringify([createArticle("cached-article")]));
    localStorage.setItem("editorial_ads", JSON.stringify([]));
    localStorage.setItem("editorial_content_version", "4");

    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const snapshot = await getPublishedContentSnapshot();
    expect(snapshot.heroes[0]?.id).toBe("cached-hero");
    expect(snapshot.articles[0]?.id).toBe("cached-article");
  });

  it("syncs published content into local storage when only stale cache exists", async () => {
    localStorage.setItem("editorial_heroes", JSON.stringify([createHero("stale-hero")]));
    localStorage.setItem("editorial_articles", JSON.stringify([createArticle("stale-article")]));
    localStorage.setItem("editorial_ads", JSON.stringify([]));
    localStorage.setItem("editorial_content_version", "4");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        content: {
          heroes: [createHero("fresh-hero", "2026-02")],
          articles: [createArticle("fresh-article", "2026-02")],
          ads: [],
          publishedAt: "2026-04-22T00:00:00.000Z",
        },
      }),
    }) as unknown as typeof fetch;

    const result = await syncPublishedContentToLocalStorage();
    expect(result.synced).toBe(true);

    const storedHeroes = JSON.parse(localStorage.getItem("editorial_heroes") || "[]") as Array<{ id: string }>;
    const storedArticles = JSON.parse(localStorage.getItem("editorial_articles") || "[]") as Array<{ id: string }>;
    expect(storedHeroes[0]?.id).toBe("fresh-hero");
    expect(storedArticles[0]?.id).toBe("fresh-article");
  });
});
