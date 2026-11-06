import { Link } from "react-router-dom";import { useState, useEffect } from "react";
import { CATEGORIES, formatEditionLabel } from "@/lib/content-public";
import { getKnownEditions } from "@/lib/content-store";
import PrivacyPopupButton from "@/components/editorial/PrivacyPopupButton";
import { SubscribeForm } from "@/components/editorial/Subscribe";

function SubscribeSection() {
  return (
    <div className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-14">
        <h3 style={{ fontFamily: "'Playfair Display', serif", textTransform: "none" }} className="text-lg md:text-xl font-semibold italic text-foreground mb-2 tracking-tight">Stay in the Loop</h3>
        <p className="text-sm font-sans text-muted-foreground mb-6 max-w-2xl">
          Subscribe to The Magorium for the latest on art, culture, travel, tech, motorsport, sailing, fashion, and more.
        </p>
        <div className="max-w-2xl">
          <SubscribeForm />
        </div>
      </div>
    </div>
  );
}

export default function EditorialFooter() {
  const [recentEditions, setRecentEditions] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    getKnownEditions().then((editions) => {
      if (!active) return;
      setRecentEditions(editions.slice(0, 3));
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <footer className="border-t border-border mt-20">
      <SubscribeSection />
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          <div>
            <Link to="/">
              <h3 className="masthead-font text-3xl leading-none font-extrabold tracking-tight">
                <span className="text-foreground">THE </span>
                <span className="text-primary">MAGORIUM</span>
              </h3>
            </Link>
            <div className="mt-5">
              <h4 className="text-xs font-sans uppercase tracking-widest text-primary mb-3">Archive</h4>
              <div className="space-y-2">
               {recentEditions.map((ed) => (
                  <Link key={ed} to={`/archive/${ed}`} className="block text-sm font-sans text-muted-foreground hover:text-foreground transition-colors">
                    {formatEditionLabel(ed)}
                  </Link>
                ))}
                <Link to="/archive" className="block text-sm font-sans text-primary hover:text-foreground transition-colors mt-1">
                  View all →
                </Link>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-sans uppercase tracking-widest text-primary mb-4">Sections</h4>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => (
                <Link key={cat} to={`/archive?category=${encodeURIComponent(cat)}`} className="block text-sm font-sans text-muted-foreground hover:text-foreground transition-colors">
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-sans uppercase tracking-widest text-primary mb-4">The Journal</h4>
            <div className="space-y-2 text-sm font-sans text-muted-foreground">
              <Link to="/editors-letter" className="block hover:text-foreground transition-colors">Editor's Letter</Link>
              <Link to="/contributors" className="block hover:text-foreground transition-colors">Contributors</Link>
              <Link to="/archive" className="block hover:text-foreground transition-colors">Archive</Link>
              <Link to="/partnerships" className="block hover:text-foreground transition-colors">Partnerships</Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-sans uppercase tracking-widest text-primary mb-4">Contact</h4>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              For editorial features and brand placements, contact our private desk.
            </p>
            <a
              href="mailto:concierge@themagorium.com"
              className="text-sm text-foreground font-sans mt-3 inline-block underline-offset-2 hover:underline transition-colors"
            >
              concierge@themagorium.com
            </a>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-sans text-muted-foreground">
          <p>© {new Date().getFullYear()} The Magorium. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </div>
      <PrivacyPopupButton />
    </footer>
  );
}
