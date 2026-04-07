import { useEffect } from "react";
import { syncPublishedContentToLocalStorage } from "@/lib/content-store";

export function useSyncPublishedContent() {
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const result = await syncPublishedContentToLocalStorage();
      if (cancelled) return;
      if (result.synced) {
        window.dispatchEvent(new CustomEvent("magorium-content-synced"));
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);
}
