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

export default function EditorsLetterPage() {
  const [content, setContent] = useState({
    quote: "The world is full of extraordinary things quietly waiting for our wits to grow sharper.",
    body1: "Welcome to The Magorium — a private-view journal for those who believe luxury is not a price point but a perspective. Each month, we curate a single volume of the events, destinations, and cultural moments that define the season.",
    body2: "From the frozen polo fields of St. Moritz to the fashion ateliers of Paris, from the tech salons of Davos to the design studios of Cape Town — we seek the stories behind the spectacle. Our editorial lens is deliberate: fewer stories, told with greater depth.",
    body3: "This is not a news publication. It is a curated companion for the globally curious — those who travel with intention, collect with knowledge, and engage with culture as participants, not spectators.",
    signoff: "With warm regards,\nThe Editorial Desk",
    logoUrl: "",
  });

  useEffect(() => {
    const stored = getStoredPageContent();
    if (stored?.editorsLetter) setContent(stored.editorsLetter);
  }, []);

  return (
    <ContentPage title="Editor's Letter">
      {content.logoUrl && (
        <div className="mb-8 flex justify-center">
          <img src={content.logoUrl} alt="The Magorium" className="max-h-84 object-contain" />
        </div>
      )}
      <p className="text-lg font-editorial italic text-foreground">
        "{content.quote}"
      </p>
      <p>{content.body1}</p>
      <p>{content.body2}</p>
      <p>{content.body3}</p>
      <p className="text-foreground font-medium" style={{ whiteSpace: "pre-line" }}>
        {content.signoff}
      </p>
    </ContentPage>
  );
}
