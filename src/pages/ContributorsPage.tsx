import ContentPage from "./ContentPage";
import { applyContributorsSeo, canonicalAuthorName } from "@/lib/seo";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildContentPath, getSeoContentSnapshot, slugifyText } from "@/lib/content-store";
import { isPublishReadyArticle, isPublishReadyHero } from "@/lib/content-selection";

const STORAGE_KEY = "magorium_page_content";

function getStoredPageContent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

type ContributorProfile = {
  name: string;
  role: string;
  bio: string;
  storyCount: number;
};

const CONTRIBUTOR_PROFILE_BY_NAME: Record<string, Omit<ContributorProfile, "name" | "storyCount">> = {
  "Wilhelmina St. Germain": {
    role: "Art, Fashion & Couture Editor",
    bio: "Former fashion director at Condé Nast Traveller. Wilhelmina covers haute couture, ready-to-wear, and the intersection of fashion and cultural identity from Paris, Milan, and London.",
  },
  "Marcus Demallier": {
    role: "Culture & Music Correspondent",
    bio: "Award-winning arts journalist based in Rio de Janeiro. Marcus brings an insider's perspective to festivals, carnivals, and the global music scene.",
  },
  "Charlotte Thames": {
    role: "Travel & Luxury Editor",
    bio: "Charlotte writes about the world's most compelling destinations, luxury hospitality, and the evolving definition of modern travel. Previously at Financial Times HTSI.",
  },
 
  "Millie Sealana": {
    role: "Managing Editor",
    bio: "Millie writes about contemporary art, business, music, sports, wellness and the tech world's cultural impact. A regular contributor to ART, Equestrian sports, Fashion and Technology.",
  },
  "The Magorium Editorial Staff": {
    role: "Editorial Desk",
    bio: "The Magorium editorial staff produces collaborative reporting and curated coverage across finance, technology, luxury travel, art, fashion, culture, and global sport.",
  },
};

export default function ContributorsPage() {
  const [contributors, setContributors] = useState<ContributorProfile[]>([]);
  const [logoUrl, setLogoUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const stored = getStoredPageContent();
    if (stored?.contributors) {
      setLogoUrl(stored.contributors.logoUrl || "");
      setImages(stored.contributors.images || []);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const snapshot = await getPublishedContentSnapshot();
      if (!active) return;

      const storyPathsByContributor: Record<string, string[]> = {};
      snapshot.articles.filter(isPublishReadyArticle).forEach((article) => {
        const key = canonicalAuthorName(article.author);
        const path = buildContentPath(article.id, article.title);
        storyPathsByContributor[key] = [...(storyPathsByContributor[key] || []), path];
      });
      snapshot.heroes.filter(isPublishReadyHero).forEach((hero) => {
        const key = canonicalAuthorName(hero.author);
        const path = buildContentPath(hero.id, hero.title);
        storyPathsByContributor[key] = [...(storyPathsByContributor[key] || []), path];
      });

      const knownNames = Object.keys(CONTRIBUTOR_PROFILE_BY_NAME);
      const discoveredNames = Object.keys(storyPathsByContributor);
      const contributorNames = Array.from(
        new Set([...knownNames, ...discoveredNames].map((name) => canonicalAuthorName(name))),
      );
      const contributorProfiles = contributorNames
        .map((name) => {
          const profile = CONTRIBUTOR_PROFILE_BY_NAME[name];
          return {
            name,
            role: profile?.role || "Writer",
            bio: profile?.bio || "Contributor to The Magorium covering luxury lifestyle, culture, travel, and global events.",
            storyCount: storyPathsByContributor[name]?.length || 0,
          };
        })
        .sort((a, b) => {
          if (b.storyCount !== a.storyCount) return b.storyCount - a.storyCount;
          return a.name.localeCompare(b.name);
        });
      setContributors(contributorProfiles);
      applyContributorsSeo(contributorNames, storyPathsByContributor);
    };

    void hydrate();
    return () => { active = false; };
  }, []);

  return (
    <ContentPage title="Contributors">
      {logoUrl && (
        <div className="mb-8 flex justify-center">
          <img src={logoUrl} alt="Contributors" className="max-h-24 object-contain" />
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {images.map((src, i) => (
            <img key={i} src={src} alt="" className="w-full h-40 object-cover rounded-lg" />
          ))}
        </div>
      )}

      <p>
        The Magorium is crafted by a network of editors, writers, and cultural correspondents across five continents. Our contributors are embedded in the worlds they cover.
      </p>

      <div className="space-y-8 mt-8">
        {contributors.map((c) => (
          <div key={c.name} className="border-l-2 border-primary pl-5">
            <h3 className="text-foreground font-semibold text-base font-editorial">{c.name}</h3>
            <p className="text-xs uppercase tracking-widest text-primary mt-1">{c.role}</p>
            <p className="mt-2 text-sm">{c.bio}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {c.storyCount} published {c.storyCount === 1 ? "story" : "stories"}
            </p>
            <Link to={`/author/${slugifyText(c.name)}`} className="mt-2 inline-block text-xs text-primary hover:underline">
              View stories by {c.name}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <Link to="/seo-history" className="text-sm text-primary hover:underline">
          View visible SEO history archive
        </Link>
      </div>
    </ContentPage>
  );
}
