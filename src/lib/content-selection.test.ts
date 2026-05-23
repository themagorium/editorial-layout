import { describe, expect, it } from "vitest";
import { isPublishReadyArticle, isPublishReadyHero } from "@/lib/content-selection";
import type { Article, HeroItem } from "@/lib/content-store";

const readyHero: HeroItem = {
  id: "hero-by-writer",
  title: "Published Hero",
  subtitle: "A complete published story deck.",
  category: "Travel",
  imageUrl: "/assets/story.webp",
  author: "Avery Stone",
  date: "2026-04-01",
  edition: "2026-04",
};

const readyArticle: Article = {
  id: "article-by-writer",
  title: "Published Article",
  excerpt: "A complete published article excerpt.",
  category: "Art & Design",
  imageUrl: "/assets/article.webp",
  author: "Nora Vale",
  date: "2026-04-02",
  edition: "2026-04",
};

describe("publish-ready author story selection", () => {
  it("keeps publish-ready stories for arbitrary admin-entered writers", () => {
    expect(isPublishReadyHero(readyHero)).toBe(true);
    expect(isPublishReadyArticle(readyArticle)).toBe(true);
  });

  it("excludes admin placeholder stories from author and contributor indexes", () => {
    expect(isPublishReadyHero({ ...readyHero, title: "New Hero 1" })).toBe(false);
    expect(isPublishReadyHero({ ...readyHero, subtitle: "Add your second hero story" })).toBe(false);
    expect(isPublishReadyArticle({ ...readyArticle, excerpt: "Add your fourth article" })).toBe(false);
  });
});
