import type { Article } from "@/lib/content-store";
import { Play } from "lucide-react";

interface Props {
  article: Article;
  variant?: "large" | "medium" | "small";
}

export default function ArticleCard({ article, variant = "medium" }: Props) {
  const isLarge = variant === "large";
  const isSmall = variant === "small";

  return (
    <article className={`group cursor-pointer animate-fade-in ${isLarge ? "col-span-2 row-span-2" : ""}`}>
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
        <h3 className={`font-serif font-semibold mt-2 leading-snug group-hover:text-primary transition-colors ${
          isLarge ? "text-2xl md:text-3xl" : isSmall ? "text-base" : "text-lg md:text-xl"
        }`}>
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
    </article>
  );
}
