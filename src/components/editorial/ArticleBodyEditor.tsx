import { useRef, useState } from "react";
import type { ArticleBodyBlock } from "@/lib/content-store";
import { Trash2, Image, Video, Type, GripVertical, Heading, Bold, Italic, BookOpen, AlignLeft, AlignCenter, AlignRight, Plus } from "lucide-react";
import { fileToOptimizedDataUrl } from "@/lib/media-optimizer";

interface Props {
  blocks: ArticleBodyBlock[];
  onChange: (blocks: ArticleBodyBlock[]) => void;
  heading?: string;
  preferredPattern?: boolean;
  sources?: string;
  onSourcesChange?: (value: string) => void;
}

const IMAGE_WIDTH_LABELS: Record<NonNullable<ArticleBodyBlock["imageWidth"]>, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  full: "Full Width",
};

const IMAGE_ALIGN_LABELS: Record<NonNullable<ArticleBodyBlock["imageAlign"]>, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
};

function getImageLayoutClasses(block: ArticleBodyBlock) {
  const width = block.imageWidth || "full";
  const align = block.imageAlign || "center";
  const widthClassMap: Record<NonNullable<ArticleBodyBlock["imageWidth"]>, string> = {
    small: "w-1/2",
    medium: "w-2/3",
    large: "w-5/6",
    full: "w-full",
  };
  const alignClassMap: Record<NonNullable<ArticleBodyBlock["imageAlign"]>, string> = {
    left: "mr-auto",
    center: "mx-auto",
    right: "ml-auto",
  };
  return `${widthClassMap[width]} ${alignClassMap[align]}`;
}

// Insert bar shown between blocks — always visible, not hover-only
function InsertBar({
  atIndex,
  onAddText,
  onAddHeading,
  onAddImage,
  onAddVideo,
}: {
  atIndex: number;
  onAddText: (idx: number) => void;
  onAddHeading: (idx: number) => void;
  onAddImage: (idx: number) => void;
  onAddVideo: (idx: number) => void;
}) {
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative flex items-center gap-1 py-1">
      {/* Always-visible insert row */}
      <div className="flex-1 h-px bg-border/50" />

      <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => { onAddText(atIndex); }}
            className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider border border-border rounded bg-background text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          >
            <Type className="w-3 h-3" /> Text
          </button>
          <button
            type="button"
            onClick={() => { onAddHeading(atIndex); }}
            className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider border border-border rounded bg-background text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          >
            <Heading className="w-3 h-3" /> Heading
          </button>
          <button
            type="button"
            onClick={() => { onAddImage(atIndex); imgRef.current?.click(); }}
            className="flex items-center gap-1.5 px-3 py-1 text-[10px] uppercase tracking-wider border-2 border-primary rounded bg-primary/10 text-primary hover:bg-primary/25 transition-colors font-bold"
          >
            <Image className="w-3 h-3" /> ＋ Insert Photo Here
          </button>
          <button
            type="button"
            onClick={() => { onAddVideo(atIndex); vidRef.current?.click(); }}
            className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider border border-border rounded bg-background text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          >
            <Video className="w-3 h-3" /> Video
          </button>
      </div>

      <div className="flex-1 h-px bg-border/50" />

      {/* Hidden file inputs — trigger from parent via pendingInsertIndex ref */}
      <input
        ref={imgRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) onAddImage(atIndex, file);
          e.target.value = "";
        }}
      />
      <input
        ref={vidRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) onAddVideo(atIndex, file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function ArticleBodyEditor({
  blocks,
  onChange,
  heading = "Article Body",
  preferredPattern = false,
  sources = "",
  onSourcesChange,
}: Props) {
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);
  const pendingInsertIndex = useRef<number>(blocks.length);

  const addTextBlock = (atIndex?: number) => {
    const idx = atIndex ?? blocks.length;
    const newBlock: ArticleBodyBlock = { id: `b-${Date.now()}`, type: "text", content: "" };
    const updated = [...blocks];
    updated.splice(idx, 0, newBlock);
    onChange(updated);
  };

  const addHeadingBlock = (atIndex?: number) => {
    const idx = atIndex ?? blocks.length;
    const newBlock: ArticleBodyBlock = { id: `b-${Date.now()}`, type: "heading", content: "" };
    const updated = [...blocks];
    updated.splice(idx, 0, newBlock);
    onChange(updated);
  };

  const addMediaBlockFromFile = async (type: "image" | "video", file: File, atIndex?: number) => {
    const idx = atIndex ?? blocks.length;
    const url = await fileToOptimizedDataUrl(file);
    const newBlock: ArticleBodyBlock = {
      id: `b-${Date.now()}`,
      type,
      content: url,
      caption: "",
      imageAlign: type === "image" ? "center" : undefined,
      imageWidth: type === "image" ? "full" : undefined,
    };
    const updated = [...blocks];
    updated.splice(idx, 0, newBlock);
    onChange(updated);
  };

  // For the inline InsertBar — receives file directly from its own input
  const handleInsertImage = async (atIndex: number, file?: File) => {
    if (!file) {
      // called before file chosen — just record the index; the input's onChange will call again with file
      pendingInsertIndex.current = atIndex;
      return;
    }
    await addMediaBlockFromFile("image", file, atIndex);
  };

  const handleInsertVideo = async (atIndex: number, file?: File) => {
    if (!file) {
      pendingInsertIndex.current = atIndex;
      return;
    }
    await addMediaBlockFromFile("video", file, atIndex);
  };

  const replaceMediaBlock = async (id: string, file: File) => {
    const url = await fileToOptimizedDataUrl(file);
    updateBlock(id, { content: url });
  };

  const updateBlock = (id: string, patch: Partial<ArticleBodyBlock>) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const isStyleActive = (block: ArticleBodyBlock, style: "bold" | "italic") => {
    if (!block.textStyle || block.textStyle === "normal") return false;
    if (style === "bold") return block.textStyle === "bold" || block.textStyle === "bold-italic";
    return block.textStyle === "italic" || block.textStyle === "bold-italic";
  };

  const toggleStyle = (block: ArticleBodyBlock, style: "bold" | "italic") => {
    const hasBold = isStyleActive(block, "bold");
    const hasItalic = isStyleActive(block, "italic");
    const nextBold = style === "bold" ? !hasBold : hasBold;
    const nextItalic = style === "italic" ? !hasItalic : hasItalic;
    const nextStyle: ArticleBodyBlock["textStyle"] = nextBold && nextItalic
      ? "bold-italic"
      : nextBold ? "bold"
      : nextItalic ? "italic"
      : "normal";
    updateBlock(block.id, { textStyle: nextStyle });
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (id: string, direction: -1 | 1) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const updated = [...blocks];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    onChange(updated);
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await addMediaBlockFromFile("image", file, pendingInsertIndex.current);
    e.target.value = "";
  };

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await addMediaBlockFromFile("video", file, pendingInsertIndex.current);
    e.target.value = "";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-sans font-medium">{heading}</h4>
        <span className="text-[10px] text-muted-foreground font-sans">Hover between blocks to insert · Photo / Text / Photo / Text</span>
      </div>

      {blocks.length === 0 && (
        <p className="text-xs text-muted-foreground font-sans italic py-4 text-center border border-dashed border-border rounded">
          No body content yet. Add text, images, or videos below.
        </p>
      )}

      {/* Insert bar BEFORE first block */}
      {blocks.length > 0 && (
        <InsertBar
          atIndex={0}
          onAddText={addTextBlock}
          onAddHeading={addHeadingBlock}
          onAddImage={handleInsertImage}
          onAddVideo={handleInsertVideo}
        />
      )}

      {blocks.map((block, idx) => (
        <div key={block.id}>
          <div className="group relative bg-secondary/50 border border-border rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <GripVertical className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans">
                {block.type === "text" ? "Text"
                  : block.type === "heading" ? "Heading"
                  : block.type === "image" ? "Image"
                  : "Video"}
              </span>
              <div className="ml-auto flex items-center gap-1">
                {idx > 0 && (
                  <button type="button" onClick={() => moveBlock(block.id, -1)} className="p-1 text-muted-foreground hover:text-foreground text-xs">↑</button>
                )}
                {idx < blocks.length - 1 && (
                  <button type="button" onClick={() => moveBlock(block.id, 1)} className="p-1 text-muted-foreground hover:text-foreground text-xs">↓</button>
                )}
                <button type="button" onClick={() => removeBlock(block.id)} className="p-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {block.type === "text" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button type="button" onClick={() => toggleStyle(block, "bold")}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${isStyleActive(block, "bold") ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    <Bold className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => toggleStyle(block, "italic")}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${isStyleActive(block, "italic") ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    <Italic className="w-3 h-3" />
                  </button>
                  <div className="w-px bg-border mx-1" />
                  <button type="button" onClick={() => updateBlock(block.id, { textAlign: "left" })}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${(block.textAlign || "left") === "left" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    <AlignLeft className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => updateBlock(block.id, { textAlign: "center" })}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${block.textAlign === "center" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    <AlignCenter className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => updateBlock(block.id, { textAlign: "right" })}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${block.textAlign === "right" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    <AlignRight className="w-3 h-3" />
                  </button>
                </div>
                <textarea
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                  placeholder="Write your paragraph here..."
                  rows={4}
                  className="w-full bg-background text-foreground px-3 py-2 rounded text-sm font-sans resize-y"
                />
              </div>
            )}

            {block.type === "heading" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button type="button" onClick={() => toggleStyle(block, "bold")}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${isStyleActive(block, "bold") ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    <Bold className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => toggleStyle(block, "italic")}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${isStyleActive(block, "italic") ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    <Italic className="w-3 h-3" />
                  </button>
                  <div className="w-px bg-border mx-1" />
                  <button type="button" onClick={() => updateBlock(block.id, { textAlign: "left" })}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${(block.textAlign || "left") === "left" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    <AlignLeft className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => updateBlock(block.id, { textAlign: "center" })}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${block.textAlign === "center" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    <AlignCenter className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => updateBlock(block.id, { textAlign: "right" })}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${block.textAlign === "right" ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}>
                    <AlignRight className="w-3 h-3" />
                  </button>
                  <select
                    value={block.headingVariant || "subsection"}
                    onChange={(e) => updateBlock(block.id, { headingVariant: e.target.value as "title" | "subsection" })}
                    className="bg-background text-foreground px-2 py-1 rounded text-xs border border-border">
                    <option value="title">Title</option>
                    <option value="subsection">Sub-section</option>
                  </select>
                </div>
                <input
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                  placeholder="Section title / sub-heading"
                  className="w-full bg-background text-foreground px-3 py-2 rounded text-sm font-semibold"
                />
              </div>
            )}

            {block.type === "image" && (
              <div className="space-y-2">
                {block.content ? (
                  <div className={getImageLayoutClasses(block)}>
                    <img src={block.content} alt="" className="w-full max-h-48 object-cover rounded" />
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 rounded border-2 border-dashed border-primary/50 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
                    <Image className="w-6 h-6 text-primary/60 mb-1" />
                    <span className="text-[11px] text-primary font-medium uppercase tracking-wider">Click to upload photo</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) void replaceMediaBlock(block.id, file); e.target.value = ""; }} />
                  </label>
                )}
                <div className="flex gap-2">
                  <label className="px-2 py-1 text-[10px] uppercase tracking-wider border border-border rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors cursor-pointer">
                    {block.content ? "Replace Photo" : "Upload Photo"}
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) void replaceMediaBlock(block.id, file); e.target.value = ""; }} />
                  </label>
                  {block.content && (
                    <button type="button" onClick={() => updateBlock(block.id, { content: "" })}
                      className="px-2 py-1 text-[10px] uppercase tracking-wider border border-border rounded text-muted-foreground hover:text-destructive hover:border-destructive transition-colors">
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select value={block.imageAlign || "center"}
                    onChange={(e) => updateBlock(block.id, { imageAlign: e.target.value as NonNullable<ArticleBodyBlock["imageAlign"]> })}
                    className="bg-background text-foreground px-3 py-1.5 rounded text-xs font-sans">
                    {Object.entries(IMAGE_ALIGN_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>Align: {label}</option>
                    ))}
                  </select>
                  <select value={block.imageWidth || "full"}
                    onChange={(e) => updateBlock(block.id, { imageWidth: e.target.value as NonNullable<ArticleBodyBlock["imageWidth"]> })}
                    className="bg-background text-foreground px-3 py-1.5 rounded text-xs font-sans">
                    {Object.entries(IMAGE_WIDTH_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>Size: {label}</option>
                    ))}
                  </select>
                </div>
                <input value={block.caption || ""} onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                  placeholder="Image caption (optional)" className="w-full bg-background text-foreground px-3 py-1.5 rounded text-xs font-sans" />
                <input value={block.citation || ""} onChange={(e) => updateBlock(block.id, { citation: e.target.value })}
                  placeholder="Photo credit / citation (e.g. Photo: John Smith / Getty)" className="w-full bg-background text-foreground px-3 py-1.5 rounded text-xs font-sans text-right" />
              </div>
            )}

            {block.type === "video" && (
              <div className="space-y-2">
                {block.content && <video src={block.content} className="w-full max-h-48 rounded" controls />}
                <div className="flex gap-2">
                  <label className="px-2 py-1 text-[10px] uppercase tracking-wider border border-border rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors cursor-pointer">
                    Replace Video
                    <input type="file" accept="video/*" className="hidden"
                      onChange={(e) => { const file = e.target.files?.[0]; if (file) void replaceMediaBlock(block.id, file); e.target.value = ""; }} />
                  </label>
                  <button type="button" onClick={() => updateBlock(block.id, { content: "" })}
                    className="px-2 py-1 text-[10px] uppercase tracking-wider border border-border rounded text-muted-foreground hover:text-destructive hover:border-destructive transition-colors">
                    Clear
                  </button>
                </div>
                <input value={block.content || ""} onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                  placeholder="Video URL or data URI" className="w-full bg-background text-foreground px-3 py-1.5 rounded text-xs font-sans" />
                <input value={block.caption || ""} onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                  placeholder="Video caption (optional)" className="w-full bg-background text-foreground px-3 py-1.5 rounded text-xs font-sans" />
                <input value={block.citation || ""} onChange={(e) => updateBlock(block.id, { citation: e.target.value })}
                  placeholder="Video credit / citation (e.g. Video: BBC Sport)" className="w-full bg-background text-foreground px-3 py-1.5 rounded text-xs font-sans text-right" />
              </div>
            )}
          </div>

          {/* Insert bar AFTER every block */}
          <InsertBar
            atIndex={idx + 1}
            onAddText={addTextBlock}
            onAddHeading={addHeadingBlock}
            onAddImage={handleInsertImage}
            onAddVideo={handleInsertVideo}
          />
        </div>
      ))}

      {/* Append buttons at bottom */}
      <div className="flex gap-2 pt-2 border-t border-border mt-2">
        <button type="button" onClick={() => { pendingInsertIndex.current = blocks.length; addTextBlock(); }}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-wider border border-dashed border-border rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors">
          <Type className="w-3 h-3" /> Add Text
        </button>
        <button type="button" onClick={() => addHeadingBlock()}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-wider border border-dashed border-border rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors">
          <Heading className="w-3 h-3" /> Add Heading
        </button>
        <button type="button"
          onClick={() => { pendingInsertIndex.current = blocks.length; imgRef.current?.click(); }}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-wider border border-dashed border-primary rounded text-primary hover:bg-primary/10 transition-colors font-medium">
          <Image className="w-3 h-3" /> Add Photo
        </button>
        <button type="button"
          onClick={() => { pendingInsertIndex.current = blocks.length; vidRef.current?.click(); }}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-wider border border-dashed border-border rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors">
          <Video className="w-3 h-3" /> Add Video
        </button>
      </div>

      {onSourcesChange !== undefined && (
        <div className="mt-6 pt-4 border-t border-border space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3 h-3 text-muted-foreground" />
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-sans font-medium">
              Sources & Verification
            </h4>
          </div>
          <p className="text-[10px] text-muted-foreground font-sans">
            Appears at the bottom of the article in small footnote text. Paste all source credits here.
          </p>
          <textarea
            value={sources}
            onChange={(e) => onSourcesChange(e.target.value)}
            placeholder="Sources & Verification · e.g. Monochrome Watches (Apr 14), Robb Report (Apr 15), Patek Philippe official site..."
            rows={4}
            className="w-full bg-background text-foreground px-3 py-2 rounded text-xs font-sans resize-y border border-border"
          />
        </div>
      )}

      <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
      <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFile} />
    </div>
  );
}
