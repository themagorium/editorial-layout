import { useState, useEffect, useCallback } from "react";
import type { HeroItem } from "@/lib/content-store";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface Props {
  heroes: HeroItem[];
}

export default function HeroCarousel({ heroes }: Props) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % heroes.length), [heroes.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + heroes.length) % heroes.length), [heroes.length]);

  // Track view when slide changes
  useEffect(() => {
    if (heroes.length > 0) {
      trackEvent(heroes[current].id, "hero", "view");
    }
  }, [current, heroes]);

  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  if (!heroes.length) return null;
  const hero = heroes[current];

  const handleClick = () => {
    trackEvent(hero.id, "hero", "click");
  };

  return (
    <div className="relative w-full aspect-[16/7] min-h-[400px] overflow-hidden group" onClick={handleClick}>
      <img
        src={hero.imageUrl}
        alt={hero.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700"
      />
      {hero.videoUrl && (
        <video
          src={hero.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="article-overlay absolute inset-0" />

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-10">
        <span className="category-pill mb-4">{hero.category}</span>
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mt-3 max-w-3xl leading-tight font-serif">
          {hero.title}
        </h2>
        <p className="font-sans text-base md:text-lg text-muted-foreground mt-3 max-w-2xl">
          {hero.subtitle}
        </p>
      </div>

      {heroes.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded opacity-0 group-hover:opacity-100 transition-opacity text-foreground hover:bg-background/80"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded opacity-0 group-hover:opacity-100 transition-opacity text-foreground hover:bg-background/80"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {heroes.length > 1 && (
        <div className="absolute bottom-4 right-6 md:right-12 flex gap-2 z-10">
          {heroes.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? "bg-primary w-6" : "bg-foreground/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
