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
        <div className="flex items-center justify-between py-6">
          <Link to="/" className="block">
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">
              <span className="text-foreground">THE </span>
              <span className="text-primary">EDITORIAL</span>
            </h1>
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mt-1">
              where curated becomes legend
            </p>
          </Link>
          <Link
            to={isAdmin ? "/" : "/admin"}
            className="flex items-center gap-2 px-4 py-2 text-sm font-sans text-muted-foreground hover:text-primary transition-colors border border-border rounded hover:border-primary"
          >
            <Settings className="w-4 h-4" />
            {isAdmin ? "View Site" : "Manage Content"}
          </Link>
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
