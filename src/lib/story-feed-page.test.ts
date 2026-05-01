import { describe, expect, it } from "vitest";
import { canonicalAuthorName, getAuthorPath } from "@/lib/seo";

describe("story feed byline links", () => {
  it("maps brand byline variants to staff author archive", () => {
    expect(canonicalAuthorName("Magorium")).toBe("The Magorium Editorial Staff");
    expect(getAuthorPath("Magorium")).toBe("/author/staff");
  });

  it("keeps journalist byline routes discoverable", () => {
    expect(canonicalAuthorName("Millie Sealana")).toBe("Millie Sealana");
    expect(getAuthorPath("Millie Sealana")).toBe("/author/millie-sealana");
  });
});
