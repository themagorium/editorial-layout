#!/usr/bin/env node
// Refreshes the GitHub copy of the published site.
//
//   node scripts/export-published-archive.mjs [https://www.themagorium.com]
//
// Writes:
//   content/published-archive.json  every edition, hero and article with its
//                                   full text and photo-slot layout
//   public/story-media/*            every embedded photo/chart as a real file
//                                   (the archive references /story-media/...)
//
// The content API serves this archive only if the database is empty (wiped) or
// unreachable. Commit both paths after running.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SITE = (process.argv[2] || "https://www.themagorium.com").replace(/\/$/, "");
const API = `${SITE}/api/content`;
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const MEDIA_DIR = path.join(ROOT, "public", "story-media");
const ARCHIVE = path.join(ROOT, "content", "published-archive.json");
const EXT = { "image/webp": "webp", "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png", "image/svg+xml": "svg", "image/gif": "gif", "image/avif": "avif" };

mkdirSync(MEDIA_DIR, { recursive: true });
mkdirSync(path.dirname(ARCHIVE), { recursive: true });

async function getJson(url) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "cache-control": "no-store" } });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return await response.json();
    } catch (error) {
      if (attempt >= 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
}

let written = 0;
function extract(value, id, tag) {
  if (typeof value !== "string" || !value.startsWith("data:")) return value;
  const match = value.match(/^data:([^;,]+)(;base64)?,([\s\S]*)$/);
  const ext = match && EXT[match[1].toLowerCase()];
  if (!ext) return value;
  const bytes = match[2] ? Buffer.from(match[3], "base64") : Buffer.from(decodeURIComponent(match[3]));
  const name = `${id}-${tag}-${createHash("sha1").update(bytes).digest("hex").slice(0, 10)}.${ext}`;
  const file = path.join(MEDIA_DIR, name);
  if (!existsSync(file)) {
    writeFileSync(file, bytes);
    written += 1;
  }
  return `/story-media/${name}`;
}

function externalise(story) {
  const out = { ...story };
  for (const [key, value] of Object.entries(out)) {
    if (typeof value === "string" && value.startsWith("data:image")) out[key] = extract(value, story.id, key.toLowerCase());
  }
  out.body = (story.body || []).map((block, index) =>
    block?.type === "image" ? { ...block, content: extract(block.content, story.id, `b${index + 1}`) } : block,
  );
  return out;
}

const { editions = [] } = await getJson(`${API}?list=editions`);
if (editions.length === 0) {
  console.error("The live site lists no editions — refusing to overwrite the archive with nothing.");
  process.exit(1);
}

const archive = { exportedAt: new Date().toISOString(), source: API, ads: [], editions: {} };
let stories = 0;
for (const edition of editions) {
  const { content } = await getJson(`${API}?edition=${encodeURIComponent(edition)}`);
  archive.editions[edition] = {
    heroes: (content?.heroes || []).map(externalise),
    articles: (content?.articles || []).map(externalise),
  };
  stories += archive.editions[edition].heroes.length + archive.editions[edition].articles.length;
  if (archive.ads.length === 0) archive.ads = content?.ads || [];
}

if (stories === 0) {
  console.error("The live site returned no stories — refusing to overwrite the archive with nothing.");
  process.exit(1);
}

writeFileSync(ARCHIVE, `${JSON.stringify(archive, null, 1)}\n`);
console.log(`Archived ${stories} stories across ${editions.length} editions; ${written} new media files.`);
