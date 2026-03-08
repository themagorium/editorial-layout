import { useState, useEffect } from "react";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import HeroCarousel from "@/components/editorial/HeroCarousel";
import ArticleCard from "@/components/editorial/ArticleCard";
import AdPlacement from "@/components/editorial/AdPlacement";
import { getHeroes, getArticles, getAds } from "@/lib/content-store";
import type { HeroItem, Article, AdSlot } from "@/lib/content-store";

export default function Index() {
  const [heroes, setHeroes] = useState<HeroItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [ads, setAds] = useState<AdSlot[]>([]);

  useEffect(() => {
    setHeroes(getHeroes());
    setArticles(getArticles());
    setAds(getAds());
  }, []);

  const sidebarAd = ads.find((a) => a.position === "hero-sidebar");
  const midAd = ads.find((a) => a.position === "mid-feed");
  const bottomAd = ads.find((a) => a.position === "bottom-banner");
  const sideAd = ads.find((a) => a.position === "sidebar");

  const featuredArticle = articles.find((a) => a.featured);
  const regularArticles = articles.filter((a) => !a.featured);

  return (
    <div className="min-h-screen bg-background">
      <EditorialHeader />

      {/* Hero + Sidebar Ad */}
      <section className="container mx-auto px-4 mt-10 md:mt-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <HeroCarousel heroes={heroes} />
          {sidebarAd && (
            <div className="hidden lg:block">
              <AdPlacement ad={sidebarAd} className="h-full" />
            </div>
          )}
        </div>
      </section>

      {/* Featured + Grid */}
      <section className="container mx-auto px-4 mt-16 md:mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div>
            <h2 className="font-serif text-2xl font-bold mb-8 text-primary">Editor’s Picks</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredArticle && (
                <ArticleCard article={featuredArticle} variant="large" />
              )}
              {regularArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {/* Mid-feed ad */}
            {midAd && (
              <div className="mt-10">
                <AdPlacement ad={midAd} className="w-full" />
              </div>
            )}
          </div>

          {/* Right sidebar ad */}
          {sideAd && (
            <div className="hidden lg:block">
              <div className="sticky top-6">
                <AdPlacement ad={sideAd} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bottom banner */}
      {bottomAd && (
        <section className="container mx-auto px-4 mt-12">
          <AdPlacement ad={bottomAd} className="w-full" />
        </section>
      )}

      <EditorialFooter />
    </div>
  );
}
