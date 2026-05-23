import { describe, expect, it } from "vitest";
import { applyHomeSeo, canonicalAuthorName, getAuthorPath, HOME_SEO_DESCRIPTION } from "@/lib/seo";

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

  it("keeps home search metadata focused on the public brand description", () => {
    document.head.innerHTML = "";

    applyHomeSeo("Magorium");

    expect(document.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(HOME_SEO_DESCRIPTION);
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute("content")).toBe(HOME_SEO_DESCRIPTION);
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute("content")).toContain("/og-image.png");
    expect(document.querySelector('meta[name="keywords"]')?.getAttribute("content")).not.toContain("TheMagorium");
    expect(document.head.textContent).not.toContain("alternateName");
  });
});
