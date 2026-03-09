import { useState, useEffect } from "react";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import AdPlacement from "@/components/editorial/AdPlacement";

import { getAds, getLatestEdition, getHeroesByEdition, getArticlesByEdition, formatEditionLabel } from "@/lib/content-store";
import type { HeroItem, Article, AdSlot } from "@/lib/content-store";
import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

function HeroCard({ hero }: { hero: HeroItem }) {
  return (
    <div
      className="group relative overflow-hidden rounded cursor-pointer"
      onClick={() => trackEvent(hero.id, "hero", "click")}
    >
      <div className="aspect-[3/4] sm:aspect-[16/9] md:aspect-[16/7] overflow-hidden">
        <img
          src={hero.imageUrl}
          alt={hero.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {hero.videoUrl && (
          <video
            src={hero.videoUrl}
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="article-overlay absolute inset-0" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8 z-10">
        <span className="category-pill">{hero.category}</span>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mt-2 leading-snug font-editorial">
          {hero.title}
        </h2>
        <p className="font-sans text-sm md:text-base text-muted-foreground mt-2 line-clamp-3">
          {hero.subtitle}
        </p>
      </div>
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      to={`/article/${article.id}`}
      className="group cursor-pointer flex flex-row sm:flex-col gap-3 sm:gap-0"
      onClick={() => trackEvent(article.id, "article", "click")}
    >
      <div className="relative overflow-hidden rounded aspect-square w-24 sm:w-full sm:aspect-[4/3] flex-shrink-0">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="article-overlay absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="sm:mt-3 flex flex-col justify-center">
        <span className="category-pill text-[10px]">{article.category}</span>
        <h3 className="font-editorial font-semibold mt-1 sm:mt-2 leading-snug group-hover:text-primary transition-colors text-sm sm:text-base md:text-lg">
          {article.title}
        </h3>
        <p className="font-sans text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 hidden sm:block">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-2 mt-1 sm:mt-2 text-[10px] sm:text-xs font-sans text-muted-foreground">
          <span>{article.author}</span>
          <span className="text-primary">·</span>
          <span>{new Date(article.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
      </div>
    </Link>
  );
}

export default function Index() {
  const [heroes, setHeroes] = useState<HeroItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [ads, setAds] = useState<AdSlot[]>([]);
  const [editionLabel, setEditionLabel] = useState("");

  useEffect(() => {
    const edition = getLatestEdition();
    setHeroes(getHeroesByEdition(edition).slice(0, 3));
    setArticles(getArticlesByEdition(edition).slice(0, 4));
    setAds(getAds());
    setEditionLabel(formatEditionLabel(edition));
  }, []);

  const midAd = ads.find((a) => a.position === "mid-feed");
  const bottomAd = ads.find((a) => a.position === "bottom-banner");

  return (
    <div className="min-h-screen bg-background">
      <EditorialHeader />

      {/* Edition label */}
      {editionLabel && (
        <div className="container mx-auto px-4 mt-4">
          <span className="font-sans text-xs tracking-widest uppercase text-muted-foreground">{editionLabel} Edition</span>
        </div>
      )}

      {/* Heroes — 3 large cards */}
      <section className="container mx-auto px-4 mt-4 md:mt-6">
        <div className="flex flex-col gap-6">
          {heroes.map((hero) => (
            <HeroCard key={hero.id} hero={hero} />
          ))}
        </div>
      </section>

      {/* Editor's Picks — 4 smaller cards in a 2x2 grid */}
      <section className="container mx-auto px-4 mt-16 md:mt-20">
        <h2 className="font-editorial text-2xl font-bold mb-8 text-primary tracking-wide">Editor's Picks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>

        {midAd && (
          <div className="mt-10">
            <AdPlacement ad={midAd} className="w-full" />
          </div>
        )}
      </section>

      {bottomAd && (
        <section className="container mx-auto px-4 mt-12">
          <AdPlacement ad={bottomAd} className="w-full" />
        </section>
      )}

      <EditorialFooter />
    </div>
  );
}
