import { useRef } from "react";
import type { ArticleBodyBlock } from "@/lib/content-store";
import { Plus, Trash2, Image, Video, Type, GripVertical } from "lucide-react";

interface Props {
  blocks: ArticleBodyBlock[];
  onChange: (blocks: ArticleBodyBlock[]) => void;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export default function ArticleBodyEditor({ blocks, onChange }: Props) {
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

  const addMediaBlock = async (type: "image" | "video", file: File, atIndex?: number) => {
    const idx = atIndex ?? blocks.length;
    const url = await fileToDataUrl(file);
    const newBlock: ArticleBodyBlock = { id: `b-${Date.now()}`, type, content: url, caption: "" };
    const updated = [...blocks];
    updated.splice(idx, 0, newBlock);
    onChange(updated);
  };

  const updateBlock = (id: string, patch: Partial<ArticleBodyBlock>) => {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
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
    if (file) await addMediaBlock("image", file, pendingInsertIndex.current);
    e.target.value = "";
  };

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await addMediaBlock("video", file, pendingInsertIndex.current);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-sans font-medium">Article Body</h4>
      </div>

      {blocks.length === 0 && (
        <p className="text-xs text-muted-foreground font-sans italic py-4 text-center border border-dashed border-border rounded">
          No body content yet. Add text, images, or videos below.
        </p>
      )}

      {blocks.map((block, idx) => (
        <div key={block.id} className="group relative bg-secondary/50 border border-border rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <GripVertical className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans">
              {block.type === "text" ? "Text" : block.type === "image" ? "Image" : "Video"}
            </span>
            <div className="ml-auto flex items-center gap-1">
              {idx > 0 && (
                <button onClick={() => moveBlock(block.id, -1)} className="p-1 text-muted-foreground hover:text-foreground text-xs">↑</button>
              )}
              {idx < blocks.length - 1 && (
                <button onClick={() => moveBlock(block.id, 1)} className="p-1 text-muted-foreground hover:text-foreground text-xs">↓</button>
              )}
              <button onClick={() => removeBlock(block.id)} className="p-1 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {block.type === "text" && (
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Write your paragraph here..."
              rows={4}
              className="w-full bg-background text-foreground px-3 py-2 rounded text-sm font-sans resize-y"
            />
          )}

          {block.type === "image" && (
            <div className="space-y-2">
              {block.content && <img src={block.content} alt="" className="w-full max-h-48 object-cover rounded" />}
              <input
                value={block.caption || ""}
                onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                placeholder="Image caption (optional)"
                className="w-full bg-background text-foreground px-3 py-1.5 rounded text-xs font-sans"
              />
            </div>
          )}

          {block.type === "video" && (
            <div className="space-y-2">
              {block.content && <video src={block.content} className="w-full max-h-48 rounded" controls />}
              <input
                value={block.caption || ""}
                onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                placeholder="Video caption (optional)"
                className="w-full bg-background text-foreground px-3 py-1.5 rounded text-xs font-sans"
              />
            </div>
          )}
        </div>
      ))}

      {/* Add block buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => addTextBlock()}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-wider border border-dashed border-border rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        >
          <Type className="w-3 h-3" /> Add Text
        </button>
        <button
          onClick={() => { pendingInsertIndex.current = blocks.length; imgRef.current?.click(); }}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-wider border border-dashed border-border rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        >
          <Image className="w-3 h-3" /> Add Image
        </button>
        <button
          onClick={() => { pendingInsertIndex.current = blocks.length; vidRef.current?.click(); }}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[10px] uppercase tracking-wider border border-dashed border-border rounded text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        >
          <Video className="w-3 h-3" /> Add Video
        </button>
      </div>

      <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
      <input ref={vidRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFile} />
    </div>
  );
}
