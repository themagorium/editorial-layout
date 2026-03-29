import { buildContentPath, type Article } from "@/lib/content-store";
import { Play } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

interface Props {
  article: Article;
  variant?: "large" | "medium" | "small";
}

export default function ArticleCard({ article, variant = "medium" }: Props) {
  const isLarge = variant === "large";
  const isSmall = variant === "small";
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      trackEvent(article.id, "article", "view");
      tracked.current = true;
    }
  }, [article.id]);

  const handleClick = () => {
    trackEvent(article.id, "article", "click");
  };

  return (
    <Link
      to={buildContentPath(article.id, article.title)}
      className={`group cursor-pointer animate-fade-in block ${isLarge ? "col-span-2 row-span-2" : ""}`}
      onClick={handleClick}
    >
      <div className={`relative overflow-hidden rounded ${isSmall ? "aspect-[4/3]" : isLarge ? "aspect-[16/10]" : "aspect-[3/2]"}`}>
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {article.videoUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center text-primary">
              <Play className="w-6 h-6 ml-0.5" />
            </div>
          </div>
        )}
        <div className="article-overlay absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="mt-3">
        <span className="category-pill text-[10px]">{article.category}</span>
        <h3 className={`font-editorial font-semibold mt-2 leading-snug group-hover:text-primary transition-colors text-xl md:text-2xl`}>
          {article.title}
        </h3>
        {!isSmall && (
          <p className="font-sans text-sm text-muted-foreground mt-2 line-clamp-2">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2 text-xs font-sans text-muted-foreground">
          <span>{article.author}</span>
          <span className="text-primary">·</span>
          <span>{new Date(article.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
      </div>
    </Link>
  );
}
