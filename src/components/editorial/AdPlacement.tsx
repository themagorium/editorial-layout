import type { AdSlot } from "@/lib/content-public";
import { trackEvent } from "@/lib/analytics";
import { useEffect, useRef } from "react";

interface Props {
  ad: AdSlot;
  className?: string;
  /** Admin preview: no tracking, no click-through. */
  preview?: boolean;
  align?: "left" | "center" | "right";
}

/**
 * An advertisement that blends into the page: it sits directly on the site's
 * dark blue/purple backdrop, with a hairline gold edge and a soft fade so the
 * ad's own edges melt into the page. Shows a photo or a looping silent video.
 */
export default function AdPlacement({ ad, className = "", preview = false, align = "center" }: Props) {
  const tracked = useRef(false);
  useEffect(() => {
    if (!preview && !tracked.current) {
      trackEvent(ad.id, "ad", "view");
      tracked.current = true;
    }
  }, [ad.id, preview]);

  const useVideo = ad.mediaType ? ad.mediaType === "video" && Boolean(ad.videoUrl) : Boolean(ad.videoUrl);
  const src = useVideo ? ad.videoUrl : ad.imageUrl;
  if (!src) return null;

  const width = ad.width > 0 ? ad.width : 300;
  const height = ad.height > 0 ? ad.height : 250;
  const fit = ad.fit === "cover" ? "object-cover" : "object-contain";

  const media = useVideo ? (
    <video src={src} autoPlay muted loop playsInline preload="metadata" className={`w-full h-full ${fit}`} aria-label={ad.label || "Advertisement"} />
  ) : (
    <img src={src} alt={ad.label || "Advertisement"} className={`w-full h-full ${fit}`} loading="lazy" decoding="async" />
  );

  return (
    <aside className={`flex flex-col ${align === "left" ? "items-start" : align === "right" ? "items-end" : "items-center"} ${className}`} aria-label="Advertisement">
      <span className="mb-2 text-[9px] font-sans uppercase tracking-[0.35em] text-muted-foreground/60">Advertisement</span>
      <div
        className="ad-frame relative overflow-hidden rounded-sm bg-background ring-1 ring-primary/15"
        style={{ width, maxWidth: "100%", aspectRatio: `${width} / ${height}` }}
      >
        {preview ? (
          media
        ) : (
          <a
            href={ad.linkUrl || "#"}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block w-full h-full"
            onClick={() => trackEvent(ad.id, "ad", "click")}
          >
            {media}
          </a>
        )}
        {/* Soft inner fade into the page backdrop so the ad never looks pasted on. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ boxShadow: "inset 0 0 28px 6px hsl(var(--background))" }}
        />
      </div>
    </aside>
  );
}
