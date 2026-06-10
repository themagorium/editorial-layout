import ContentPage from "./ContentPage";
import { useEffect, useState } from "react";

const STORAGE_KEY = "magorium_page_content";

function getStoredPageContent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export default function PartnershipsPage() {
  const [logoUrl, setLogoUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    const stored = getStoredPageContent();
    if (stored?.partnerships) {
      setLogoUrl(stored.partnerships.logoUrl || "");
      setImages(stored.partnerships.images || []);
    }
  }, []);

  return (
    <ContentPage title="Partnerships">
      {logoUrl && (
        <div className="mb-8 flex justify-center">
          <img src={logoUrl} alt="Partner" className="max-h-24 object-contain" />
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {images.map((src, i) => (
            <img key={i} src={src} alt="" className="w-full h-40 object-cover rounded-lg" />
          ))}
        </div>
      )}

      <p>
        The Magorium partners with a curated selection of luxury houses, cultural institutions, and global brands to deliver editorial features, bespoke activations, and immersive content experiences.
      </p>
      <h2 className="text-foreground font-editorial text-xl font-semibold mt-8">What We Offer</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong className="text-foreground">Editorial Features</strong> — Bespoke long-form stories placed within our monthly volumes, crafted by our editorial team.</li>
        <li><strong className="text-foreground">Hero Placements</strong> — Premium visibility as a full-width hero card on the homepage.</li>
        <li><strong className="text-foreground">Display Advertising</strong> — Mid-feed banners, sidebar units, and bottom-banner placements.</li>
        <li><strong className="text-foreground">Event Coverage</strong> — On-the-ground editorial coverage of brand activations and private events.</li>
      </ul>
      <h2 className="text-foreground font-editorial text-xl font-semibold mt-8">Get in Touch</h2>
      <p>For partnership enquiries, editorial features, and brand placements, contact our private desk:</p>
      <p className="text-foreground font-medium">concierge@themagorium.com</p>
    </ContentPage>
  );
}
