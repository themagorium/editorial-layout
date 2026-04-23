import { describe, expect, it } from "vitest";
import { canonicalAuthorName, getAuthorPath } from "@/lib/seo";

describe("seo author helpers", () => {
  it("keeps named contributors as canonical person authors", () => {
    expect(canonicalAuthorName("Charlotte Thames")).toBe("Charlotte Thames");
    expect(getAuthorPath("Charlotte Thames")).toBe("/author/charlotte-thames");
  });

  it("maps staff aliases to editorial staff author entity", () => {
    expect(canonicalAuthorName("The Magorium")).toBe("The Magorium Editorial Staff");
    expect(canonicalAuthorName("staff")).toBe("The Magorium Editorial Staff");
    expect(getAuthorPath("The Magorium")).toBe("/author/staff");
  });
});
