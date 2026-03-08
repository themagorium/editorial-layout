import ContentPage from "./ContentPage";

export default function TermsPage() {
  return (
    <ContentPage title="Terms & Conditions">
      {/* Drop your logo here */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 flex items-center justify-center text-sm text-muted-foreground mb-8">
        <span>Drop a logo or brand image here</span>
      </div>

      <p><strong className="text-foreground">Effective Date:</strong> January 1, 2025</p>

      <h2 className="text-foreground font-editorial text-xl font-semibold mt-8">1. Use of Content</h2>
      <p>All content published on The Magorium — including text, images, videos, and design — is the intellectual property of The Magorium and its contributors. Reproduction, redistribution, or republication without written consent is prohibited.</p>

      <h2 className="text-foreground font-editorial text-xl font-semibold mt-8">2. Editorial Independence</h2>
      <p>The Magorium maintains full editorial independence. Sponsored content and brand partnerships are always disclosed and clearly labelled. Our editorial team retains final approval on all published material.</p>

      <h2 className="text-foreground font-editorial text-xl font-semibold mt-8">3. Advertising & Partnerships</h2>
      <p>Advertisement placements and sponsored features are subject to The Magorium's editorial guidelines. We reserve the right to decline any partnership that does not align with our editorial standards.</p>

      <h2 className="text-foreground font-editorial text-xl font-semibold mt-8">4. Privacy</h2>
      <p>We respect your privacy. Please refer to our Cookie Policy for details on data collection and usage. We do not sell personal information to third parties.</p>

      <h2 className="text-foreground font-editorial text-xl font-semibold mt-8">5. Contact</h2>
      <p>For questions regarding these terms, contact <span className="text-foreground font-medium">concierge@themagorium.com</span>.</p>
    </ContentPage>
  );
}
