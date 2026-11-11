import { describe, expect, it } from "vitest";
import { MAX_INLINE_DATA_URL_CHARS as SERVER_LIMIT } from "../../api/content";
import { MAX_AD_VIDEO_BYTES, MAX_INLINE_DATA_URL_CHARS, fitsInlineDataUrlLimit } from "./media-limits";

const base64Length = (bytes: number) => Math.ceil(bytes / 3) * 4;

describe("inline media limits", () => {
  it("matches the content API's summary cut-off", () => {
    expect(MAX_INLINE_DATA_URL_CHARS).toBe(SERVER_LIMIT);
  });

  it("keeps the largest allowed ad video under the cut-off once base64-encoded", () => {
    const longestPrefix = "data:video/quicktime;base64,";
    expect(longestPrefix.length + base64Length(MAX_AD_VIDEO_BYTES)).toBeLessThanOrEqual(MAX_INLINE_DATA_URL_CHARS);
  });

  it("rejects the old 3.5 MB limit, which the homepage silently dropped", () => {
    const oldLimit = 3.5 * 1024 * 1024;
    expect("data:video/mp4;base64,".length + base64Length(oldLimit)).toBeGreaterThan(MAX_INLINE_DATA_URL_CHARS);
  });

  it("checks only data URLs", () => {
    expect(fitsInlineDataUrlLimit("https://example.com/clip.mp4")).toBe(true);
    expect(fitsInlineDataUrlLimit("data:video/mp4;base64," + "A".repeat(100))).toBe(true);
    expect(fitsInlineDataUrlLimit("data:video/mp4;base64," + "A".repeat(MAX_INLINE_DATA_URL_CHARS))).toBe(false);
  });
});
