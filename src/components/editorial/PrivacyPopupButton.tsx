import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function PrivacyPopupButton() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="fixed bottom-5 left-5 z-50 px-3 py-2 text-[10px] uppercase tracking-widest font-sans border border-border bg-card/90 backdrop-blur text-muted-foreground rounded hover:text-foreground hover:border-primary transition-colors"
        >
          Privacy Preferences
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="bg-card border-border sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl text-foreground">Privacy Preferences</SheetTitle>
          <SheetDescription className="font-sans text-sm text-muted-foreground">
            We use cookies for analytics, performance, and editorial personalization.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 text-sm font-sans text-muted-foreground mt-6">
          <div className="p-3 rounded border border-border bg-secondary/50">
            <p className="text-foreground font-medium">Essential Cookies</p>
            <p className="mt-1">Required for core site functionality and security.</p>
          </div>
          <div className="p-3 rounded border border-border bg-secondary/50">
            <p className="text-foreground font-medium">Analytics Cookies</p>
            <p className="mt-1">Help us understand what stories and media your audience engages with most.</p>
          </div>
          <div className="p-3 rounded border border-border bg-secondary/50">
            <p className="text-foreground font-medium">Media Preferences</p>
            <p className="mt-1">Optimizes video playback and rich article embeds.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-6">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-3 py-2 text-xs uppercase tracking-widest border border-border rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-3 py-2 text-xs uppercase tracking-widest rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Accept
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
