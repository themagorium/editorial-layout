import { useState } from "react";
import { CATEGORIES } from "@/lib/content-store";
import { Link } from "react-router-dom";
import PrivacyPopupButton from "@/components/editorial/PrivacyPopupButton";
import { toast } from "sonner";

function SubscribeSection() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    // Send subscription via mailto link
    window.open(`mailto:subscribe@themagorium.com?subject=New Subscription&body=Please subscribe me: ${encodeURIComponent(email)}`);
    toast("Thank you for subscribing", {
      style: { background: "hsl(248, 44%, 26%)", color: "hsl(40, 60%, 65%)", border: "1px solid hsl(40, 60%, 65%, 0.3)" },
    });
    setEmail("");
  };

  return (
    <div className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-14">
        <h3 style={{ fontFamily: "'Playfair Display', serif", textTransform: "none" }} className="text-2xl md:text-3xl font-semibold italic text-foreground mb-2 tracking-tight">Stay in the Loop</h3>
        <p className="text-sm font-sans text-muted-foreground mb-6 max-w-2xl">
          Subscribe to The Magorium for the latest on art, culture, travel, tech, motorsport, sailing, fashion, and more.
        </p>
        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className="flex-1 rounded-full border border-muted-foreground/30 bg-transparent px-6 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
            maxLength={255}
          />
          <button
            type="submit"
            className="rounded-full border border-muted-foreground/40 px-8 py-3 text-sm font-sans font-medium text-foreground hover:bg-foreground/5 transition-colors whitespace-nowrap"
          >
            Subscribe
          </button>
        </form>
      </div>
    </div>
  );
}

export default function EditorialFooter() {
  return (
    <footer className="border-t border-border mt-20">
      <SubscribeSection />
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <Link to="/">
              <h3 className="masthead-font text-4xl leading-none font-extrabold tracking-tight">
                <span className="text-foreground">THE </span>
                <span className="text-primary">MAGORIUM</span>
              </h3>
            </Link>
          </div>

          <div>
            <h4 className="text-xs font-sans uppercase tracking-widest text-primary mb-4">Sections</h4>
            <div className="space-y-2">
              {CATEGORIES.slice(0, 6).map((cat) => (
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
            <p className="text-sm text-foreground font-sans mt-3">concierge@themagorium.com</p>
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
