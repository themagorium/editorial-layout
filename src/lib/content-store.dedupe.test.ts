import { describe, expect, it } from "vitest";
import { getArticles, saveArticles } from "@/lib/content-store";

describe("content dedupe on save", () => {
  it("removes duplicate image/video blocks with identical media URLs", () => {
    const seed = getArticles();
    const target = seed[0];
    const mediaUrl = "data:image/png;base64,abc123";
    const duplicateBody = [
      { id: "txt-1", type: "text" as const, content: "Intro paragraph" },
      { id: "img-1", type: "image" as const, content: mediaUrl, caption: "cap one" },
      { id: "img-2", type: "image" as const, content: mediaUrl, caption: "cap two" },
      { id: "vid-1", type: "video" as const, content: "data:video/mp4;base64,zzz" },
      { id: "vid-2", type: "video" as const, content: "data:video/mp4;base64,zzz" },
    ];

    saveArticles(
      seed.map((article) =>
        article.id === target.id
          ? {
              ...article,
              body: duplicateBody,
            }
          : article,
      ),
    );

    const reloaded = getArticles().find((article) => article.id === target.id);
    expect(reloaded).toBeTruthy();
    const mediaBlocks = (reloaded?.body || []).filter(
      (block) => block.type === "image" || block.type === "video",
    );
    const keys = mediaBlocks.map((block) => `${block.type}:${block.content}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
