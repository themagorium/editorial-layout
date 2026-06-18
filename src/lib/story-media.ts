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

export type StoryMediaBlock = {
  type?: string;
  content?: string;
};

export function getFirstBodyImageUrl(body?: StoryMediaBlock[]): string {
  if (!Array.isArray(body)) return "";
  for (const block of body) {
    if (!block || block.type !== "image") continue;
    const candidate = (block.content || "").trim();
    if (hasUsableStoryImageUrl(candidate)) return candidate;
  }
  return "";
}

export function getStoryCardImageUrl(imageUrl?: string, body?: StoryMediaBlock[]): string {
  const normalized = (imageUrl || "").trim();
  if (hasUsableStoryImageUrl(normalized)) return normalized;
  const bodyImage = getFirstBodyImageUrl(body);
  if (bodyImage) return bodyImage;
  return "";
}
