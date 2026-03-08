import { CATEGORIES } from "@/lib/content-store";
import { Link, useLocation } from "react-router-dom";
import { Settings, Archive } from "lucide-react";

export default function EditorialHeader() {
  const location = useLocation();
  const isAdmin = location.pathname === "/admin";

  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-10 md:py-14">
          <Link to="/" className="block">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight masthead-font whitespace-nowrap">
              <span className="text-foreground">THE </span>
              <span className="text-primary">MAGORIUM</span>
            </h1>
            <p className="text-[10px] tracking-[0.4em] uppercase text-primary mt-1.5 font-light">
              where curated becomes legend
            </p>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/archive"
              className="flex items-center gap-2 px-4 py-2 text-sm font-sans text-muted-foreground hover:text-primary transition-colors border border-border rounded hover:border-primary"
            >
              <Archive className="w-4 h-4" />
              Archive
            </Link>
            <Link
              to={isAdmin ? "/" : "/admin"}
              className="flex items-center gap-2 px-4 py-2 text-sm font-sans text-muted-foreground hover:text-primary transition-colors border border-border rounded hover:border-primary"
            >
              <Settings className="w-4 h-4" />
              {isAdmin ? "View Site" : "Manage Content"}
            </Link>
          </div>
        </div>

        {/* Category nav */}
        <nav className="flex gap-1 overflow-x-auto pb-3 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <span
              key={cat}
              className="whitespace-nowrap px-3 py-1.5 text-xs font-sans font-medium uppercase tracking-widest text-muted-foreground hover:text-primary cursor-pointer transition-colors"
            >
              {cat}
            </span>
          ))}
        </nav>
      </div>
    </header>
  );
}
