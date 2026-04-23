import { beforeEach, describe, expect, it } from "vitest";
import {
  applyArticleSeo,
  applyAuthorSeo,
  canonicalAuthorName,
  getAuthorPath,
  resolveAuthorNameFromSlug,
} from "@/lib/seo";

describe("seo author helpers", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("keeps named contributors as canonical person authors", () => {
    expect(canonicalAuthorName("Charlotte Thames")).toBe("Charlotte Thames");
    expect(getAuthorPath("Charlotte Thames")).toBe("/author/charlotte-thames");
  });

  it("maps staff aliases to editorial staff author entity", () => {
    expect(canonicalAuthorName("The Magorium")).toBe("The Magorium Editorial Staff");
    expect(canonicalAuthorName("staff")).toBe("The Magorium Editorial Staff");
    expect(getAuthorPath("The Magorium")).toBe("/author/staff");
  });

  it("resolves known author slugs including brand aliases", () => {
    expect(resolveAuthorNameFromSlug("charlotte-thames", ["Charlotte Thames"])).toBe("Charlotte Thames");
    expect(resolveAuthorNameFromSlug("the-magorium")).toBe("The Magorium Editorial Staff");
    expect(resolveAuthorNameFromSlug("staff")).toBe("The Magorium Editorial Staff");
  });

  it("applies article seo with author metadata and author url", () => {
    applyArticleSeo({
      id: "f1-test",
      title: "F1 returns to American soil in the tech haven of Austin.",
      excerpt: "Testing author metadata output.",
      category: "Motorsport",
      imageUrl: "/f1.jpg",
      author: "Charlotte Thames",
      date: "2025-10-06",
      edition: "2025-10",
    });

    const authorMeta = document.head.querySelector('meta[name="author"]');
    const articleAuthorMeta = document.head.querySelector('meta[property="article:author"]');
    expect(authorMeta?.getAttribute("content")).toBe("Charlotte Thames");
    expect(articleAuthorMeta?.getAttribute("content")).toBe(
      "https://www.themagorium.com/author/charlotte-thames",
    );
  });

  it("applies author seo with canonical link and person schema", () => {
    applyAuthorSeo("Millie Sealana", 3);
    const canonical = document.head.querySelector('link[rel="canonical"]');
    const schema = document.head.querySelector('script[data-seo="author-jsonld"]');
    const payload = schema ? (JSON.parse(schema.textContent || "{}") as { name?: string; url?: string }) : {};

    expect(canonical?.getAttribute("href")).toBe("https://www.themagorium.com/author/millie-sealana");
    expect(payload.name).toBe("Millie Sealana");
    expect(payload.url).toBe("https://www.themagorium.com/author/millie-sealana");
  });
});
