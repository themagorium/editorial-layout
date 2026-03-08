import EditorialHeader from "@/components/editorial/EditorialHeader";
import EditorialFooter from "@/components/editorial/EditorialFooter";

interface ContentPageProps {
  title: string;
  children: React.ReactNode;
}

export default function ContentPage({ title, children }: ContentPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <EditorialHeader />
      <main className="container mx-auto px-4 py-12 md:py-20 max-w-3xl">
        <h1 className="font-editorial text-3xl md:text-4xl font-bold text-foreground mb-8">{title}</h1>
        <div className="prose prose-neutral dark:prose-invert max-w-none font-sans text-muted-foreground leading-relaxed space-y-6">
          {children}
        </div>
      </main>
      <EditorialFooter />
    </div>
  );
}
