import { useState } from "react";
import { Mail, X } from "lucide-react";

export default function SubscribeBar() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Mail className="w-4 h-4 text-primary shrink-0" />
          <p className="text-sm font-sans text-muted-foreground truncate">
            <span className="hidden sm:inline">Subscribe to The Magorium — </span>
            <a
              href="mailto:subscribe@themagorium.com"
              className="text-primary hover:text-foreground transition-colors font-medium"
            >
              subscribe@themagorium.com
            </a>
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
