import ContentPage from "./ContentPage";
import { applyContributorsSeo } from "@/lib/seo";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { slugifyText } from "@/lib/content-store";

export default function ContributorsPage() {
  const contributors = [
    { name: "Elena Voss", role: "Fashion & Couture Editor", bio: "Former fashion director at Condé Nast Traveller. Elena covers haute couture, ready-to-wear, and the intersection of fashion and cultural identity from Paris, Milan, and London." },
    { name: "Marcus Chen", role: "Culture & Music Correspondent", bio: "Award-winning arts journalist based in Rio de Janeiro. Marcus brings an insider's perspective to festivals, carnivals, and the global music scene." },
    { name: "Charlotte Thames", role: "Travel & Luxury Editor", bio: "Charlotte writes about the world's most compelling destinations, luxury hospitality, and the evolving definition of modern travel. Previously at Financial Times HTSI." },
    { name: "James Whitfield", role: "Sport & Lifestyle Editor", bio: "James covers motorsport, polo, sailing, and the luxury lifestyle ecosystem surrounding major sporting events. Based between London and Monaco." },
    { name: "Millie Sealana", role: "Art, Design & Technology Editor", bio: "Millie reports on contemporary art, design fairs, and the tech world's cultural impact. A regular contributor to ART SG, Art Basel, and the CV Summit." },
  ];

  useEffect(() => {
    applyContributorsSeo();
  }, []);

  return (
    <ContentPage title="Contributors">
      {/* Drop your logo here */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 flex items-center justify-center text-sm text-muted-foreground mb-8">
        <span>Drop a logo or brand image here</span>
      </div>

      <p>
        The Magorium is crafted by a network of editors, writers, and cultural correspondents across five continents. Our contributors are embedded in the worlds they cover.
      </p>

      <div className="space-y-8 mt-8">
        {contributors.map((c) => (
          <div key={c.name} className="border-l-2 border-primary pl-5">
            <h3 className="text-foreground font-semibold text-base font-editorial">
              {c.name}
            </h3>
            <p className="text-xs uppercase tracking-widest text-primary mt-1">{c.role}</p>
            <p className="mt-2 text-sm">{c.bio}</p>
            <Link
              to={`/author/${slugifyText(c.name)}`}
              className="mt-2 inline-block text-xs text-primary hover:underline"
            >
              View stories by {c.name}
            </Link>
          </div>
        ))}
      </div>
    </ContentPage>
  );
}
