export const STORY_IMAGE_FALLBACK = "/magorium-m-icon.svg";

export function hasUsableStoryImageUrl(value?: string): boolean {
  const normalized = (value || "").trim();
  if (!normalized) return false;
  if (normalized === "undefined" || normalized === "null") return false;
  if (normalized.startsWith("blob:")) return false;
  if (normalized.includes("/favicon.png")) return false;
  if (normalized.includes("/og-image.jpg")) return false;
  if (normalized.includes("/og-image.png")) return false;
  if (normalized.includes("/placeholder.svg")) return false;
  return true;
}

export function getStoryImageUrl(value?: string): string {
  const normalized = (value || "").trim();
  return hasUsableStoryImageUrl(normalized) ? normalized : STORY_IMAGE_FALLBACK;
}
