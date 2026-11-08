import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";

// Shared "Stay in the Loop" sign-up: the footer box, the pop-up, and the
// centred thank-you message all live here.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{7,15}$/;
const THANKS_EVENT = "magorium:subscribed";
const POPUP_KEY = "magorium-subscribe-popup";
const POPUP_DELAY_MS = 12000;
const POPUP_SCROLL_RATIO = 0.3;
const POPUP_SNOOZE_DAYS = 14;

function isValidContact(value: string): boolean {
  const v = value.trim();
  if (EMAIL_RE.test(v)) return true;
  return PHONE_RE.test(v.replace(/[\s().\-/]/g, "").replace(/^00/, "+"));
}

function readPopupState(): { subscribed?: boolean; dismissedAt?: number } {
  try { return JSON.parse(window.localStorage.getItem(POPUP_KEY) || "{}"); } catch { return {}; }
}
function writePopupState(state: { subscribed?: boolean; dismissedAt?: number }) {
  try { window.localStorage.setItem(POPUP_KEY, JSON.stringify({ ...readPopupState(), ...state })); } catch { /* storage unavailable */ }
}

/** Sends a sign-up. Returns true on success (and shows the centred thank-you). */
export async function submitSubscription(contact: string, website: string): Promise<boolean> {
  if (!isValidContact(contact)) {
    toast.error("Please enter a valid email address or phone number.", { position: "top-center" });
    return false;
  }
  try {
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact: contact.trim(), website, page: window.location.pathname }),
    });
    const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!response.ok || !payload.ok) {
      toast.error(payload.error || "Sorry, we couldn't save your subscription. Please try again.", { position: "top-center" });
      return false;
    }
  } catch {
    toast.error("Sorry, we couldn't reach the server. Please try again.", { position: "top-center" });
    return false;
  }
  writePopupState({ subscribed: true });
  window.dispatchEvent(new Event(THANKS_EVENT));
  return true;
}

/** The email/phone field + Subscribe button, used by the footer and the pop-up. */
export function SubscribeForm({ autoFocus = false, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState(""); // hidden spam trap
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    const ok = await submitSubscription(contact, website);
    setSending(false);
    if (ok) { setContact(""); onDone?.(); }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
      <input
        type="text"
        inputMode="email"
        autoComplete="email"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="Your email, or phone number"
        aria-label="Your email, or phone number"
        className="flex-1 min-w-0 rounded-full border border-muted-foreground/45 bg-transparent px-6 py-3 text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/60 transition-colors"
        maxLength={255}
        required
        autoFocus={autoFocus}
      />
      <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <button
        type="submit"
        disabled={sending}
        className="rounded-full border border-muted-foreground/55 px-8 py-3 text-sm font-sans font-medium text-foreground hover:bg-foreground/5 transition-colors whitespace-nowrap disabled:opacity-70"
      >
        {sending ? "Subscribing…" : "Subscribe"}
      </button>
    </form>
  );
}

/** Centred "Thank you for subscribing" message, shown after any sign-up. */
export function SubscribeThankYou() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    const show = () => {
      setVisible(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setVisible(false), 4000);
    };
    window.addEventListener(THANKS_EVENT, show);
    return () => { window.removeEventListener(THANKS_EVENT, show); window.clearTimeout(timer); };
  }, []);

  if (!visible) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-300" onClick={() => setVisible(false)} role="status" aria-live="polite">
      <div className="rounded-lg border border-primary/30 bg-background px-10 py-8 text-center shadow-2xl max-w-md">
        <p className="text-primary text-xl md:text-2xl" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
          Thank you for subscribing to the Magorium.
        </p>
      </div>
    </div>,
    document.body,
  );
}

/** "Stay in the Loop" pop-up, centred in the lower half of the screen. */
export function SubscribePopup() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const hiddenOnPage = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (hiddenOnPage) { setOpen(false); return; }
    const state = readPopupState();
    if (state.subscribed) return;
    if (state.dismissedAt && Date.now() - state.dismissedAt < POPUP_SNOOZE_DAYS * 86400000) return;

    let shown = false;
    const show = () => { if (shown) return; shown = true; setOpen(true); cleanup(); };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 0 && window.scrollY / max >= POPUP_SCROLL_RATIO) show();
    };
    const timer = window.setTimeout(show, POPUP_DELAY_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    const cleanup = () => { window.clearTimeout(timer); window.removeEventListener("scroll", onScroll); };
    return cleanup;
  }, [hiddenOnPage]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const close = () => { writePopupState({ dismissedAt: Date.now() }); setOpen(false); };

  if (!open || hiddenOnPage) return null;
  return createPortal(
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-labelledby="stay-in-the-loop-title">
      <div className="absolute inset-0 bg-black/10 sm:bg-black/30 animate-in fade-in duration-300" onClick={close} />
      <div className="absolute left-1/2 top-1/2 sm:top-1/2 w-[calc(100%-2rem)] max-w-xl max-h-[calc(66dvh-1rem)] overflow-y-auto -translate-x-1/2 -translate-y-1/2 scale-75 sm:scale-100 rounded-lg border border-primary/25 bg-background px-5 py-6 sm:px-10 sm:py-8 sm:max-h-none shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5 text-lg leading-none">×</button>
        <h3 id="stay-in-the-loop-title" className="text-xl md:text-2xl font-semibold italic text-foreground mb-2 tracking-tight text-center" style={{ fontFamily: "'Playfair Display', serif" }}>Stay in the Loop</h3>
        <p className="text-sm font-sans text-muted-foreground mb-6 text-center">
          Subscribe to The Magorium for the latest on art, culture, travel, tech, motorsport, sailing, fashion, and more.
        </p>
        <SubscribeForm autoFocus onDone={() => setOpen(false)} />
      </div>
    </div>,
    document.body,
  );
}
