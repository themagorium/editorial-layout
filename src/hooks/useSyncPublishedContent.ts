import { useEffect } from "react";
import { syncPublishedContentToLocalStorage } from "@/lib/content-store";

type SyncOptions = {
  enabled?: boolean;
  deferMs?: number;
};

export function useSyncPublishedContent(options?: SyncOptions) {
  useEffect(() => {
    const shouldSync = options?.enabled ?? window.location.pathname.startsWith("/admin");
    if (!shouldSync) return;

    let cancelled = false;
    const deferMs = Math.max(0, options?.deferMs ?? 1500);
    const run = async () => {
      const result = await syncPublishedContentToLocalStorage();
      if (cancelled) return;
      if (result.synced) {
        window.dispatchEvent(new CustomEvent("magorium-content-synced"));
      }
    };

    const timer = window.setTimeout(() => {
      void run();
    }, deferMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [options?.deferMs, options?.enabled]);
}
