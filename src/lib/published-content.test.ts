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

  it("keeps local snapshot when an admin draft marker exists", async () => {
    localStorage.setItem("editorial_heroes", JSON.stringify([createHero("draft-hero")]));
    localStorage.setItem("editorial_articles", JSON.stringify([createArticle("draft-article")]));
    localStorage.setItem("editorial_ads", JSON.stringify([]));
    localStorage.setItem("editorial_content_version", "4");
    localStorage.setItem("editorial_has_local_draft", "1");

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
    expect(snapshot.heroes[0]?.id).toBe("draft-hero");
    expect(snapshot.articles[0]?.id).toBe("draft-article");
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

  it("upgrades legacy October 2025 story copy to restored authored versions", async () => {
    localStorage.setItem(
      "editorial_heroes",
      JSON.stringify([
        {
          ...createHero("h-cv-summit"),
          title: "Zurich's CV Summit: Capital Meets AI by the Lake",
          subtitle:
            "CV Summit 2025 at the Kongresshaus united 3,000+ tech leaders, investors and innovators — shifting from spectacle to substance",
          author: "Millie Sealana",
          edition: "2025-10",
        },
        {
          ...createHero("h-f1-austin"),
          title: "F1 Returns to the Circuit of the Americas",
          subtitle: "Austin's tech haven welcomes Formula 1 — where Russell amazed and Hamilton raced for Roscoe",
          author: "Charlotte Thames",
          date: "2025-10-20",
          edition: "2025-10",
        },
      ]),
    );
    localStorage.setItem(
      "editorial_articles",
      JSON.stringify([
        {
          ...createArticle("v1-cambiaso"),
          title: "Cambiaso x Cambiaso: The Hurlingham Open",
          excerpt:
            "Father and son reunite on the historic turf of Buenos Aires as La Natividad La Dolfina begin their Triple Crown campaign.",
          author: "Millie Sealana",
          edition: "2025-10",
        },
        {
          ...createArticle("v1-engadin"),
          title: "Winter Awaits the Engadin",
          excerpt:
            "As the first snows dust the peaks, the Engadin Valley prepares for another season of Alpine luxury — from St. Moritz's frozen lake to Pontresina's quiet elegance.",
          author: "Charlotte Thames",
          date: "2025-10-20",
          edition: "2025-10",
        },
      ]),
    );
    localStorage.setItem("editorial_ads", JSON.stringify([]));
    localStorage.setItem("editorial_content_version", "4");
    localStorage.setItem("editorial_has_local_draft", "1");

    const snapshot = await getPublishedContentSnapshot();
    const cvHero = snapshot.heroes.find((hero) => hero.id === "h-cv-summit");
    const f1Hero = snapshot.heroes.find((hero) => hero.id === "h-f1-austin");
    const cambiasoArticle = snapshot.articles.find((article) => article.id === "v1-cambiaso");
    const engadinArticle = snapshot.articles.find((article) => article.id === "v1-engadin");

    expect(cvHero).toMatchObject({
      title: "Zurich's CV Summit: Capital Meets AI Coding by the Lake",
      author: "Millie Sealana",
    });
    expect(f1Hero).toMatchObject({
      subtitle: "Just on the heels of Singapore, F1 heads to Austin's tech haven — where Russell amazed and Hamilton raced for Roscoe.",
      date: "2025-10-06",
    });
    expect(cambiasoArticle).toMatchObject({
      title: "Cambiaso x Cambiaso: Hurlingham and a New Legacy Begins",
    });
    expect(cambiasoArticle?.body?.some((block) => block.type === "text" && /Proxima parada, Tortugas/i.test(block.content))).toBe(true);
    expect(engadinArticle).toMatchObject({
      title: "Engadin Awaits the Winter",
      author: "Millie Sealana",
      date: "2025-10-06",
    });
  });

  it("upgrades legacy SailGP hero body copy to restored edited version", async () => {
    localStorage.setItem(
      "editorial_heroes",
      JSON.stringify([
        {
          ...createHero("h-sailgp"),
          title: "SailGP from Geneva to Cadiz",
          subtitle:
            "Rolex Switzerland SailGP Grand Prix on Lake Geneva delivered a dramatic mix of tactics, light winds, and a breakthrough victory for Germany",
          author: "Charlotte Thames",
          edition: "2025-10",
          body: [
            {
              id: "legacy-sg-b1",
              type: "text",
              content:
                "The Rolex Switzerland SailGP Grand Prix transformed Lake Geneva into the most spectacular racecourse in sailing history. With the Jet d'Eau as a backdrop and the Alps framing the horizon, eight national teams battled across two days of intense F50 catamaran racing in conditions that tested tactics as much as speed.",
            },
          ],
        },
      ]),
    );
    localStorage.setItem("editorial_articles", JSON.stringify([]));
    localStorage.setItem("editorial_ads", JSON.stringify([]));
    localStorage.setItem("editorial_content_version", "4");
    localStorage.setItem("editorial_has_local_draft", "1");

    const snapshot = await getPublishedContentSnapshot();
    const sailGp = snapshot.heroes.find((hero) => hero.id === "h-sailgp");
    expect(sailGp).toMatchObject({
      title: "SailGP from Geneva to Cadiz",
      body: expect.arrayContaining([
        expect.objectContaining({
          content:
            "Last week's Rolex Switzerland SailGP Grand Prix on Lake Geneva delivered a dramatic mix of tactics, light winds, and a breakthrough victory for Germany in its first final and first win. Switzerland hosted SailGP for the first time, and the local crowd got more than just a glimpse of world-class foiling — they saw history.",
        }),
      ]),
    });
  });
});
