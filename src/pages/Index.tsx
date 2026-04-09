import { useState, useEffect } from "react";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import AdPlacement from "@/components/editorial/AdPlacement";

import { getPublishedContentSnapshot, formatEditionLabel, buildContentPath } from "@/lib/content-store";
import type { HeroItem, Article, AdSlot } from "@/lib/content-store";
import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { applyHomeSeo } from "@/lib/seo";

function HeroCard({ hero }: { hero: HeroItem }) {
  return (
    <Link
      to={buildContentPath(hero.id, hero.title)}
      className="group relative overflow-hidden rounded cursor-pointer block"
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
    </Link>
  );
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      to={buildContentPath(article.id, article.title)}
      className="group cursor-pointer flex flex-row sm:flex-col gap-3 sm:gap-0"
      onClick={() => trackEvent(article.id, "article", "click")}
    >
      <div className="relative overflow-hidden rounded aspect-square w-[7.2rem] sm:w-full sm:aspect-[4/3] flex-shrink-0">
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
    getPublishedContentSnapshot()
      .then((snapshot) => {
        const editions = new Set<string>();
        snapshot.heroes.forEach((h) => editions.add(h.edition));
        snapshot.articles.forEach((a) => editions.add(a.edition));
        const latestEdition = Array.from(editions).sort().reverse()[0] || "2026-02";

        setHeroes(snapshot.heroes.filter((h) => h.edition === latestEdition).slice(0, 3));
        setArticles(snapshot.articles.filter((a) => a.edition === latestEdition).slice(0, 4));
        setAds(snapshot.ads);
        setEditionLabel(formatEditionLabel(latestEdition));
        applyHomeSeo();
      });
  }, []);

  const hasAdMedia = (ad: AdSlot) => Boolean(ad.imageUrl || ad.videoUrl);
  const midAd = ads.find((a) => a.position === "mid-feed" && hasAdMedia(a));
  const bottomAd = ads.find((a) => a.position === "bottom-banner" && hasAdMedia(a));
  const heroSidebarAds = ads.filter((a) => a.position === "hero-sidebar" && hasAdMedia(a));
  const sidebarAds = ads.filter((a) => a.position === "sidebar" && hasAdMedia(a));

  return (
    <div className="min-h-screen bg-background">
      <EditorialHeader />

      {/* Edition label */}
      {editionLabel && (
        <div className="container mx-auto px-4 mt-4">
          <span className="font-sans text-xs tracking-widest uppercase text-muted-foreground">{editionLabel} Edition</span>
        </div>
      )}

      {/* Heroes + side rail ads */}
      <section className="container mx-auto px-4 mt-4 md:mt-6">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
          <div className="flex flex-col gap-6">
            {heroes.map((hero) => (
              <HeroCard key={hero.id} hero={hero} />
            ))}
          </div>
          <aside className="hidden xl:flex flex-col gap-6 sticky top-24">
            {heroSidebarAds.length > 0 ? (
              heroSidebarAds.map((ad) => (
                <AdPlacement key={ad.id} ad={ad} className="w-full" />
              ))
            ) : (
              sidebarAds.map((ad) => (
                <AdPlacement key={ad.id} ad={ad} className="w-full" />
              ))
            )}
          </aside>
        </div>
      </section>

      {/* Editor's Picks — 4 smaller cards in a 2x2 grid */}
      <section className="container mx-auto px-4 mt-10 md:mt-20">
        <h2 className="font-editorial text-xl md:text-2xl font-bold mb-6 md:mb-8 text-primary tracking-wide">Editor's Picks</h2>
        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

      {sidebarAds.length > 0 && (
        <section className="container mx-auto px-4 mt-8 xl:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sidebarAds.map((ad) => (
              <AdPlacement key={ad.id} ad={ad} className="w-full" />
            ))}
          </div>
        </section>
      )}

      <EditorialFooter />
    </div>
  );
}
