/**
 * Size limits for media stored inline as data URLs.
 *
 * The content API (`api/content.ts`) drops any data URL longer than
 * MAX_INLINE_DATA_URL_CHARS from the homepage and "latest" summaries, so
 * anything larger uploads fine but silently never appears there. Admin
 * upload limits must stay at or below this. Keep the two values in sync —
 * `media-limits.test.ts` fails if they drift apart.
 */
export const MAX_INLINE_DATA_URL_CHARS = 2_400_000;

/**
 * Largest ad video file the admin accepts. Base64 grows the file by 4/3, and
 * the data URL adds a short "data:video/...;base64," prefix, so 1.7 MB of
 * video comes to roughly 2.38 million characters — just under the limit.
 */
export const MAX_AD_VIDEO_MB = 1.7;
export const MAX_AD_VIDEO_BYTES = Math.floor(MAX_AD_VIDEO_MB * 1024 * 1024);

/** True when a data URL is small enough to survive the content API's summaries. */
export function fitsInlineDataUrlLimit(value: string): boolean {
  const normalized = (value || "").trim();
  if (!normalized.startsWith("data:")) return true;
  return normalized.length <= MAX_INLINE_DATA_URL_CHARS;
}
