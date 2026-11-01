import { describe, expect, it } from "vitest";
import { mergeKeepingExisting } from "../../api/_lib/keep-existing";

const stored = {
  id: "h-1",
  title: "SailGP from Geneva to Cadiz",
  subtitle: "Germany makes history",
  imageUrl: "/story-media/cover.webp",
  secondaryImageUrl: "/story-media/opening.webp",
  body: [
    { id: "t1", type: "text", content: "First paragraph." },
    { id: "p1", type: "image", content: "data:image/webp;base64,AAA", caption: "Foiling on Lake Geneva" },
    { id: "t2", type: "text", content: "Second paragraph." },
    { id: "p2", type: "image", content: "/story-media/two.webp" },
    { id: "t3", type: "text", content: "Third paragraph." },
  ],
};

describe("mergeKeepingExisting — nothing disappears unless deleted", () => {
  it("keeps stored photos when a stripped copy publishes blanks", () => {
    const incoming = {
      ...stored,
      imageUrl: "",
      body: stored.body.map((b) => (b.type === "image" ? { ...b, content: "", caption: "" } : b)),
    };
    const merged = mergeKeepingExisting(stored, incoming);
    expect(merged.imageUrl).toBe("/story-media/cover.webp");
    expect(merged.body.find((b) => b.id === "p1")).toMatchObject({ content: "data:image/webp;base64,AAA", caption: "Foiling on Lake Geneva" });
    expect(merged.body.find((b) => b.id === "p2")?.content).toBe("/story-media/two.webp");
  });

  it("puts back photo blocks that vanished without being deleted, in place", () => {
    const incoming = { ...stored, body: stored.body.filter((b) => b.type === "text") };
    const merged = mergeKeepingExisting(stored, incoming);
    expect(merged.body.map((b) => b.id)).toEqual(["t1", "p1", "t2", "p2", "t3"]);
  });

  it("honours a photo block the editor deleted", () => {
    const incoming = { ...stored, removedBlockIds: ["p2"], body: stored.body.filter((b) => b.id !== "p2") };
    const merged = mergeKeepingExisting(stored, incoming);
    expect(merged.body.map((b) => b.id)).toEqual(["t1", "p1", "t2", "t3"]);
  });

  it("honours a photo the editor cleared, and a cover photo the editor removed", () => {
    const incoming = {
      ...stored,
      secondaryImageUrl: "",
      clearedFields: ["secondaryImageUrl"],
      body: stored.body.map((b) => (b.id === "p1" ? { ...b, content: "", cleared: true } : b)),
    };
    const merged = mergeKeepingExisting(stored, incoming);
    expect(merged.secondaryImageUrl).toBe("");
    expect(merged.body.find((b) => b.id === "p1")?.content).toBe("");
  });

  it("keeps the stored body and text when a save arrives empty", () => {
    const merged = mergeKeepingExisting(stored, { ...stored, title: "", subtitle: "", body: [] });
    expect(merged.title).toBe(stored.title);
    expect(merged.subtitle).toBe(stored.subtitle);
    expect(merged.body).toEqual(stored.body);
  });

  it("lets real edits through", () => {
    const incoming = {
      ...stored,
      title: "SailGP: Geneva to Cadiz",
      body: [...stored.body.slice(0, 1), { id: "t1b", type: "text", content: "New paragraph." }, ...stored.body.slice(1)].map((b) =>
        b.id === "p2" ? { ...b, content: "/story-media/replacement.webp" } : b,
      ),
    };
    const merged = mergeKeepingExisting(stored, incoming);
    expect(merged.title).toBe("SailGP: Geneva to Cadiz");
    expect(merged.body.map((b) => b.id)).toEqual(["t1", "t1b", "p1", "t2", "p2", "t3"]);
    expect(merged.body.find((b) => b.id === "p2")?.content).toBe("/story-media/replacement.webp");
  });

  it("stores brand-new stories unchanged", () => {
    expect(mergeKeepingExisting(null, stored)).toBe(stored);
  });
});
