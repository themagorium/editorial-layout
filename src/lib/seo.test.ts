import { describe, expect, it } from "vitest";
import { canonicalAuthorName, getAuthorPath } from "@/lib/seo";

describe("seo author helpers", () => {
  it("keeps named contributors as canonical person authors", () => {
    expect(canonicalAuthorName("Charlotte Thames")).toBe("Charlotte Thames");
    expect(getAuthorPath("Charlotte Thames")).toBe("/author/charlotte-thames");
  });

  it("creates stable author paths for any admin-entered writer name", () => {
    expect(canonicalAuthorName("Avery Stone")).toBe("Avery Stone");
    expect(getAuthorPath("Avery Stone")).toBe("/author/avery-stone");
    expect(canonicalAuthorName("Nora Vale")).toBe("Nora Vale");
    expect(getAuthorPath("Nora Vale")).toBe("/author/nora-vale");
  });

  it("maps staff aliases to editorial staff author entity", () => {
    expect(canonicalAuthorName("The Magorium")).toBe("The Magorium Editorial Staff");
    expect(canonicalAuthorName("staff")).toBe("The Magorium Editorial Staff");
    expect(getAuthorPath("The Magorium")).toBe("/author/staff");
  });
});
