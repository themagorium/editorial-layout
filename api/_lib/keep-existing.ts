/**
 * "Nothing disappears unless the editor deletes it."
 *
 * Merges a story arriving from a save (Save Changes, a single-story publish,
 * a bulk import, a restore) onto the version already stored, so that a blank
 * value can never overwrite real content. Blanks arrive when the admin was
 * working from a stripped browser copy (photos are removed from that copy to
 * fit browser storage), when a large download failed, or when a stale tab
 * saves over newer work.
 *
 * Rules:
 *  - A photo/video block that arrives empty keeps the stored photo/video
 *    (matched by block id), along with its caption, title and citation.
 *  - Cover image, video and secondary image fields that arrive empty keep the
 *    stored value.
 *  - Title, subtitle, excerpt, author, category, sources and date that arrive
 *    empty keep the stored value.
 *  - A body that arrives with no text at all keeps the stored body.
 *  - A stored photo/video block missing from the incoming body is put back
 *    in its original place, unless the editor deleted it (the admin lists
 *    deleted blocks in `removedBlockIds`). Text blocks the editor removed
 *    stay removed.
 *  - A photo the editor deliberately cleared stays cleared: the admin marks
 *    the block `cleared: true`, or lists the field in `clearedFields`.
 */

type Block = { id?: string; type?: string; content?: string; [key: string]: unknown };
type Story = { body?: Block[]; clearedFields?: unknown; removedBlockIds?: unknown; [key: string]: unknown };

const MEDIA_FIELDS = ["imageUrl", "videoUrl", "secondaryImageUrl"] as const;
const TEXT_FIELDS = ["title", "subtitle", "excerpt", "author", "category", "sources", "date"] as const;
const MEDIA_BLOCK_EXTRAS = ["caption", "title", "citation"] as const;

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

function isMediaBlock(block: Block | undefined): boolean {
  return Boolean(block) && (block!.type === "image" || block!.type === "video");
}

function hasText(body: Block[] | undefined): boolean {
  return (body || []).some((b) => (b.type === "text" || b.type === "heading") && !isBlank(b.content));
}

export function mergeKeepingExisting<T extends Story>(existing: T | null | undefined, incoming: T): T {
  if (!existing || typeof existing !== "object") return incoming;
  const merged: Story = { ...incoming };
  const cleared = new Set(Array.isArray(incoming.clearedFields) ? incoming.clearedFields.map(String) : []);

  for (const field of [...MEDIA_FIELDS, ...TEXT_FIELDS]) {
    if (cleared.has(field)) continue;
    if (isBlank(merged[field]) && !isBlank(existing[field])) merged[field] = existing[field];
  }

  const existingBody = Array.isArray(existing.body) ? existing.body : [];
  const incomingBody = Array.isArray(incoming.body) ? incoming.body : [];

  if (!hasText(incomingBody) && hasText(existingBody)) {
    merged.body = existingBody;
    return merged as T;
  }

  const storedById = new Map(existingBody.filter((b) => b && b.id).map((b) => [b.id as string, b]));
  merged.body = incomingBody.map((block) => {
    if (!isMediaBlock(block) || !isBlank(block.content) || !block.id || block.cleared === true) return block;
    const stored = storedById.get(block.id);
    if (!isMediaBlock(stored) || isBlank(stored!.content)) return block;
    const restored: Block = { ...block, content: stored!.content };
    for (const extra of MEDIA_BLOCK_EXTRAS) {
      if (isBlank(restored[extra]) && !isBlank(stored![extra])) restored[extra] = stored![extra];
    }
    return restored;
  });

  // Put back stored photos whose blocks vanished without being deleted.
  const removedIds = new Set(Array.isArray(incoming.removedBlockIds) ? incoming.removedBlockIds.map(String) : []);
  const body = merged.body as Block[];
  const present = new Set(body.map((b) => b.id));
  existingBody.forEach((stored, index) => {
    if (!isMediaBlock(stored) || isBlank(stored.content) || !stored.id) return;
    if (present.has(stored.id) || removedIds.has(stored.id)) return;
    let insertAt = 0;
    for (let i = index - 1; i >= 0; i -= 1) {
      const prevId = existingBody[i]?.id;
      const pos = prevId ? body.findIndex((b) => b.id === prevId) : -1;
      if (pos >= 0) { insertAt = pos + 1; break; }
    }
    body.splice(insertAt, 0, stored);
    present.add(stored.id);
  });
  return merged as T;
}
