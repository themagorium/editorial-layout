import { useParams, Link } from "react-router-dom";
import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";
import AdPlacement from "@/components/editorial/AdPlacement";
import { getAds, getHeroesByEdition, getArticlesByEdition, formatEditionLabel } from "@/lib/content-store";
import { trackEvent } from "@/lib/analytics";

export default function EditionPage() {
  const { edition } = useParams<{ edition: string }>();
  if (!edition) return null;

  const heroes = getHeroesByEdition(edition).slice(0, 3);
  const articles = getArticlesByEdition(edition).slice(0, 4);
  const ads = getAds();
  const heroSidebarAd = ads.find((a) => a.position === "hero-sidebar");
  const sidebarAd = ads.find((a) => a.position === "sidebar");
  const midAd = ads.find((a) => a.position === "mid-feed");
  const bottomAd = ads.find((a) => a.position === "bottom-banner");
  const label = formatEditionLabel(edition);

  const hasHeroMedia = (hero: (typeof heroes)[number]) => Boolean(hero.imageUrl || hero.videoUrl);
  const hasArticleMedia = (article: (typeof articles)[number]) => Boolean(article.imageUrl || article.videoUrl);

  if (heroes.length === 0 && articles.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <EditorialHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="font-editorial text-3xl font-bold text-foreground mb-4">Volume Not Found</h2>
          <p className="text-muted-foreground font-sans mb-6">No content found for this edition.</p>
          <Link to="/archive" className="text-primary hover:underline font-sans text-sm">← Back to Archive</Link>
        </div>
        <EditorialFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EditorialHeader />

      <div className="container mx-auto px-4 mt-4">
        <Link to="/archive" className="text-xs font-sans text-muted-foreground hover:text-primary transition-colors">← Back to Archive</Link>
      </div>

      {/* Edition label */}
      <div className="container mx-auto px-4 mt-4">
        <span className="font-sans text-xs tracking-widest uppercase text-muted-foreground">{label} Edition</span>
      </div>

      {/* Heroes — 3 large cards */}
      <section className="container mx-auto px-4 mt-4 md:mt-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
          <div className="flex flex-col gap-6">
            {heroes.map((hero) => (
              <Link
                key={hero.id}
                to={`/article/${hero.id}`}
                className="group relative overflow-hidden rounded cursor-pointer block"
                onClick={() => trackEvent(hero.id, "hero", "click")}
              >
                <div className="aspect-[16/7] overflow-hidden">
                  {hero.imageUrl ? (
                    <img
                      src={hero.imageUrl}
                      alt={hero.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : hero.videoUrl ? (
                    <video
                      src={hero.videoUrl}
                      autoPlay muted loop playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary" />
                  )}
                  {hero.imageUrl && hero.videoUrl && (
                    <video
                      src={hero.videoUrl}
                      autoPlay muted loop playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  {hasHeroMedia(hero) && <div className="article-overlay absolute inset-0" />}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                  <span className="category-pill">{hero.category}</span>
                  <h2 className="text-xl md:text-2xl font-semibold text-foreground mt-2 leading-snug font-editorial">
                    {hero.title}
                  </h2>
                  {hero.subtitle?.trim() && (
                    <p className="font-sans text-sm text-muted-foreground mt-2 line-clamp-2">
                      {hero.subtitle}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
          {heroSidebarAd && (
            <aside className="w-full xl:sticky xl:top-24">
              <AdPlacement ad={heroSidebarAd} className="w-full" />
            </aside>
          )}
        </div>
      </section>

      {/* Editor's Picks — 4 cards */}
      <section className="container mx-auto px-4 mt-16 md:mt-20">
        <h2 className="font-editorial text-2xl font-bold mb-8 text-primary tracking-wide">Editor's Picks</h2>
        <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {articles.map((article) => (
            <Link
              key={article.id}
              to={`/article/${article.id}`}
              className="group cursor-pointer flex flex-row sm:flex-col gap-3 sm:gap-0"
              onClick={() => trackEvent(article.id, "article", "click")}
            >
              <div className="relative overflow-hidden rounded aspect-square w-[7.2rem] sm:w-full sm:aspect-[4/3] flex-shrink-0">
                {article.imageUrl ? (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : article.videoUrl ? (
                  <video
                    src={article.videoUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary" />
                )}
                {hasArticleMedia(article) && (
                  <div className="article-overlay absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <div className="sm:mt-3 flex flex-col justify-center">
                <span className="category-pill text-[10px]">{article.category}</span>
                <h3 className="font-editorial font-semibold mt-1 sm:mt-2 leading-snug group-hover:text-primary transition-colors text-sm sm:text-base md:text-lg">
                  {article.title}
                </h3>
                {article.excerpt?.trim() && (
                  <p className="font-sans text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 hidden sm:block">
                    {article.excerpt}
                  </p>
                )}
                {(article.author?.trim() || article.date) && (
                  <div className="flex items-center gap-2 mt-1 sm:mt-2 text-[10px] sm:text-xs font-sans text-muted-foreground">
                    {article.author?.trim() && <span>{article.author}</span>}
                    {article.author?.trim() && article.date && <span className="text-primary">·</span>}
                    {article.date && (
                      <span>{new Date(article.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
        {midAd && (
          <div className="mt-10">
            <AdPlacement ad={midAd} className="w-full" />
          </div>
        )}
      </section>

      {sidebarAd && (
        <section className="container mx-auto px-4 mt-10">
          <div className="flex justify-end">
            <div className="w-full max-w-[300px]">
              <AdPlacement ad={sidebarAd} className="w-full" />
            </div>
          </div>
        </section>
      )}

      {bottomAd && (
        <section className="container mx-auto px-4 mt-12">
          <AdPlacement ad={bottomAd} className="w-full" />
        </section>
      )}

      <EditorialFooter />
    </div>
  );
}
