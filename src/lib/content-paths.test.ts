import { describe, expect, it } from "vitest";
import { buildContentPath } from "@/lib/content-store";

describe("content path routing", () => {
  it("builds article detail links under /articles/:id", () => {
    const path = buildContentPath("a1", "Sample Story");
    expect(path).toBe("/articles/sample-story--a1");
  });
});
