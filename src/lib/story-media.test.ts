import { describe, expect, it } from "vitest";
import { getStoryCardImageUrl, getStoryImageUrl, hasUsableStoryImageUrl, STORY_IMAGE_FALLBACK } from "@/lib/story-media";

describe("story media helpers", () => {
  it("rejects logo and generated fallback assets as story images", () => {
    expect(hasUsableStoryImageUrl("/favicon.png?v=1")).toBe(false);
    expect(hasUsableStoryImageUrl("/og-image.jpg")).toBe(false);
    expect(hasUsableStoryImageUrl("/og-image.png?v=1")).toBe(false);
    expect(hasUsableStoryImageUrl("blob:https://example.test/image")).toBe(false);
  });

  it("falls back to the approved simple brand icon for missing images", () => {
    expect(getStoryImageUrl("")).toBe(STORY_IMAGE_FALLBACK);
    expect(getStoryImageUrl("/assets/article.webp")).toBe("/assets/article.webp");
  });

  it("can use the first body image for archive and category cards", () => {
    expect(getStoryCardImageUrl("", [
      { type: "text", content: "copy" },
      { type: "image", content: "/assets/body-photo.webp" },
    ])).toBe("/assets/body-photo.webp");
  });


  it("does not use the brand icon as a story-card fallback", () => {
    expect(getStoryCardImageUrl("", [])).toBe("");
    expect(getStoryCardImageUrl("/favicon.png?v=1", [])).toBe("");
  });

});
