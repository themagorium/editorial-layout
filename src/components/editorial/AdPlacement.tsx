import type { AdSlot } from "@/lib/content-store";
import { Megaphone } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useEffect, useRef } from "react";

interface Props {
  ad: AdSlot;
  className?: string;
}

export default function AdPlacement({ ad, className = "" }: Props) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      trackEvent(ad.id, "ad", "view");
      tracked.current = true;
    }
  }, [ad.id]);

  const handleClick = () => {
    trackEvent(ad.id, "ad", "click");
  };

  const hasMedia = Boolean(ad.imageUrl || ad.videoUrl);

  const content = hasMedia ? (
    <a
      href={ad.linkUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full h-full"
      onClick={handleClick}
    >
      {ad.videoUrl ? (
        <video src={ad.videoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
      ) : (
        <img src={ad.imageUrl} alt={ad.label} className="w-full h-full object-cover" />
      )}
    </a>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 h-full text-muted-foreground">
      <Megaphone className="w-6 h-6" />
      <span className="text-xs font-sans uppercase tracking-widest">{ad.label}</span>
      <span className="text-[10px] font-sans opacity-50">{ad.width}×{ad.height}</span>
    </div>
  );

  return (
    <div className={`ad-slot rounded overflow-hidden ${className}`} style={{ minHeight: Math.min(ad.height, 250) }}>
      {content}
    </div>
  );
}
