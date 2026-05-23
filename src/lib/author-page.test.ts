import { describe, expect, it } from "vitest";
import { normalizeAuthor } from "@/pages/AuthorPage";

describe("author page byline normalization", () => {
  it("maps brand byline to editorial staff profile", () => {
    expect(normalizeAuthor("Magorium")).toBe("The Magorium Editorial Staff");
    expect(normalizeAuthor("The Magorium")).toBe("The Magorium Editorial Staff");
  });

  it("keeps journalist bylines intact", () => {
    expect(normalizeAuthor("Millie Sealana")).toBe("Millie Sealana");
    expect(normalizeAuthor("Charlotte Thames")).toBe("Charlotte Thames");
  });

  it("keeps any admin-entered writer name available for an author archive", () => {
    expect(normalizeAuthor("Avery Stone")).toBe("Avery Stone");
    expect(normalizeAuthor("Nora Vale")).toBe("Nora Vale");
  });
});
