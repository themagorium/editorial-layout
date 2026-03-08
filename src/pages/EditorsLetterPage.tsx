import ContentPage from "./ContentPage";

export default function EditorsLetterPage() {
  return (
    <ContentPage title="Editor's Letter">
      {/* Drop your logo here */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 flex items-center justify-center text-sm text-muted-foreground mb-8">
        <span>Drop a logo or brand image here</span>
      </div>

      <p className="text-lg font-editorial italic text-foreground">
        "The world is full of extraordinary things quietly waiting for our wits to grow sharper."
      </p>

      <p>
        Welcome to The Magorium — a private-view journal for those who believe luxury is not a price point but a perspective. Each month, we curate a single volume of the events, destinations, and cultural moments that define the season.
      </p>

      <p>
        From the frozen polo fields of St. Moritz to the fashion ateliers of Paris, from the tech salons of Davos to the design studios of Cape Town — we seek the stories behind the spectacle. Our editorial lens is deliberate: fewer stories, told with greater depth.
      </p>

      <p>
        This is not a news publication. It is a curated companion for the globally curious — those who travel with intention, collect with knowledge, and engage with culture as participants, not spectators.
      </p>

      <p className="text-foreground font-medium">
        With warm regards,<br />
        The Editorial Desk
      </p>
    </ContentPage>
  );
}
