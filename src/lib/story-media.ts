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
  const bodyImage = getFirstBodyImageUrl(body);
  if (bodyImage) return bodyImage;
  const normalized = (imageUrl || "").trim();
  return hasUsableStoryImageUrl(normalized) ? normalized : "";
}
