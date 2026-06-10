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
      <p className="text-foreground font-medium">partnerships@themagorium.com</p>

      {/* Logo and photos — below all text content, above footer */}
      {(logoUrl || images.length > 0) && (
        <div style={{ marginTop: "3rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "2rem" }}>

          {logoUrl && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.5rem" }}>
              <img
                src={logoUrl}
                alt="Partner"
                style={{
                  display: "block",
                  maxWidth: "200px",
                  maxHeight: "120px",
                  objectFit: "contain",
                  borderRadius: "6px",
                }}
              />
            </div>
          )}

          {images.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "12px",
                justifyItems: "center",
              }}
            >
              {images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  style={{
                    display: "block",
                    width: "100%",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </ContentPage>
  );
}
