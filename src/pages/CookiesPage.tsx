import ContentPage from "./ContentPage";

export default function CookiesPage() {
  return (
    <ContentPage title="Cookie Policy">
      {/* Drop your logo here */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 flex items-center justify-center text-sm text-muted-foreground mb-8">
        <span>Drop a logo or brand image here</span>
      </div>

      <p><strong className="text-foreground">Effective Date:</strong> January 1, 2025</p>

      <h2 className="text-foreground font-editorial text-xl font-semibold mt-8">What Are Cookies?</h2>
      <p>Cookies are small text files stored on your device when you visit a website. They help us understand how you interact with The Magorium and improve your experience.</p>

      <h2 className="text-foreground font-editorial text-xl font-semibold mt-8">Cookies We Use</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong className="text-foreground">Essential Cookies</strong> — Required for the site to function, including navigation and content display.</li>
        <li><strong className="text-foreground">Analytics Cookies</strong> — Help us understand which articles and features are most popular.</li>
        <li><strong className="text-foreground">Preference Cookies</strong> — Remember your settings such as theme and language preferences.</li>
      </ul>

      <h2 className="text-foreground font-editorial text-xl font-semibold mt-8">Managing Cookies</h2>
      <p>You can manage your cookie preferences through the Privacy Preferences panel available at the bottom of every page, or through your browser settings.</p>

      <h2 className="text-foreground font-editorial text-xl font-semibold mt-8">Contact</h2>
      <p>For questions about our cookie policy, contact <span className="text-foreground font-medium">concierge@themagorium.com</span>.</p>
    </ContentPage>
  );
}
