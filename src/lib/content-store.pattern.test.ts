import { describe, expect, it } from "vitest";
import { getArticles, getHeroes, resetToDefaults } from "@/lib/content-store";

function isTextLike(type: string) {
  return type === "text" || type === "heading";
}

function isMedia(type: string) {
  return type === "image" || type === "video";
}

describe("October body pattern normalization", () => {
  it("forces all hero bodies to text/media alternation", () => {
    resetToDefaults();
    const heroes = getHeroes();

    expect(heroes.length).toBeGreaterThan(0);
    for (const hero of heroes) {
      const body = hero.body || [];
      expect(body.length).toBeGreaterThan(0);

      body.forEach((block, idx) => {
        if (idx % 2 === 0) {
          expect(isTextLike(block.type)).toBe(true);
        } else {
          expect(isMedia(block.type)).toBe(true);
        }
      });
    }
  });

  it("forces all article bodies to text/media alternation", () => {
    resetToDefaults();
    const articles = getArticles();

    expect(articles.length).toBeGreaterThan(0);
    for (const article of articles) {
      const body = article.body || [];
      expect(body.length).toBeGreaterThan(0);

      body.forEach((block, idx) => {
        if (idx % 2 === 0) {
          expect(isTextLike(block.type)).toBe(true);
        } else {
          expect(isMedia(block.type)).toBe(true);
        }
      });
    }
  });
});
