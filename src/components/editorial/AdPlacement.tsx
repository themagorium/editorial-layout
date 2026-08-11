import type { AdSlot } from "@/lib/content-public";
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
  if (!hasMedia) return null;
  const content = (
    
      href={ad.linkUrl || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full h-full"
      onClick={handleClick}
    >
      {ad.videoUrl ? (
        <video
          src={ad.videoUrl}
          muted
          loop
          playsInline
          preload="none"
          className="w-full h-full object-cover"
        />
      ) : (
        <img src={ad.imageUrl} alt={ad.label} className="w-full h-full object-cover" loading="lazy" decoding="async" />
      )}
    </a>
  );
  // The outer wrapper takes the caller's className (e.g. "w-full") and uses
  // flexbox to reliably center the fixed-size ad box within it. This is more
  // robust than relying on margin:auto on the ad box itself, which silently
  // fails to center if the "ad-slot" class (defined elsewhere) ever sets a
  // display type other than block.
  return (
    <div className={`flex justify-center ${className}`}>
      <div
        className="ad-slot rounded overflow-hidden"
        style={{ width: ad.width, height: ad.height, maxWidth: "100%" }}
      >
        {content}
      </div>
    </div>
  );
}
