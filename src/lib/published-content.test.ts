import { describe, expect, it, vi } from "vitest";
import { getPublishedContentSnapshot } from "@/lib/content-store";

describe("published content snapshot", () => {
  it("returns fallback defaults when API request fails", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    const snapshot = await getPublishedContentSnapshot();
    expect(Array.isArray(snapshot.heroes)).toBe(true);
    expect(Array.isArray(snapshot.articles)).toBe(true);
    expect(Array.isArray(snapshot.ads)).toBe(true);
    expect(snapshot.heroes.length).toBeGreaterThan(0);
    expect(snapshot.articles.length).toBeGreaterThan(0);

    globalThis.fetch = originalFetch;
  });
});
