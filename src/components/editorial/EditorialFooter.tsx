import { CATEGORIES } from "@/lib/content-store";
import { Link } from "react-router-dom";
import PrivacyPopupButton from "@/components/editorial/PrivacyPopupButton";

export default function EditorialFooter() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <h3 className="masthead-font text-4xl leading-none">
              <span className="text-foreground">THE </span>
              <span className="text-primary">MAGORIUM</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-4 font-sans max-w-xs leading-relaxed">
              A private-view magazine for travel, style, culture, and modern luxury.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-sans uppercase tracking-widest text-primary mb-4">Sections</h4>
            <div className="space-y-2">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <p key={cat} className="text-sm font-sans text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  {cat}
                </p>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-sans uppercase tracking-widest text-primary mb-4">The Journal</h4>
            <div className="space-y-2 text-sm font-sans text-muted-foreground">
              <p className="hover:text-foreground cursor-pointer transition-colors">Editor’s Letter</p>
              <p className="hover:text-foreground cursor-pointer transition-colors">Contributors</p>
              <p className="hover:text-foreground cursor-pointer transition-colors">Archive</p>
              <p className="hover:text-foreground cursor-pointer transition-colors">Partnerships</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-sans uppercase tracking-widest text-primary mb-4">Contact</h4>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              For editorial features and brand placements, contact our private desk.
            </p>
            <p className="text-sm text-foreground font-sans mt-3">concierge@themagorium.com</p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-sans text-muted-foreground">
          <p>© {new Date().getFullYear()} The Magorium. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <button type="button" className="hover:text-foreground transition-colors">Cookies</button>
            <button type="button" className="hover:text-foreground transition-colors">Terms</button>
          </div>
        </div>
      </div>
      <PrivacyPopupButton />
    </footer>
  );
}
