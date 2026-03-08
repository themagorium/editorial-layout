import { CATEGORIES } from "@/lib/content-store";

export default function EditorialFooter() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="font-serif text-2xl font-bold">
              <span className="text-foreground">THE </span>
              <span className="text-primary">EDITORIAL</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-3 font-sans max-w-xs">
              Curated stories from the worlds of travel, sport, fashion, art, and culture. Published monthly.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-sans uppercase tracking-widest text-primary mb-4">Categories</h4>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <span key={cat} className="text-xs font-sans text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  {cat}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-sans uppercase tracking-widest text-primary mb-4">Advertise</h4>
            <p className="text-sm text-muted-foreground font-sans">
              Reach a discerning audience. Contact our team for ad placement opportunities across our digital editorial.
            </p>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border text-center text-xs font-sans text-muted-foreground">
          © {new Date().getFullYear()} The Editorial. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
