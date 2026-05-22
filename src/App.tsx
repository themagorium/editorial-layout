import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";

const AdminPage = lazy(() => import("./pages/AdminPage"));
const ArchivePage = lazy(() => import("./pages/ArchivePage"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const EditionPage = lazy(() => import("./pages/EditionPage"));
const AuthorPage = lazy(() => import("./pages/AuthorPage"));
const EditorsLetterPage = lazy(() => import("./pages/EditorsLetterPage"));
const ContributorsPage = lazy(() => import("./pages/ContributorsPage"));
const SeoHistoryPage = lazy(() => import("./pages/SeoHistoryPage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const PartnershipsPage = lazy(() => import("./pages/PartnershipsPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const CookiesPage = lazy(() => import("./pages/CookiesPage"));
const BrandAliasPage = lazy(() => import("./pages/BrandAliasPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense
          fallback={(
            <div className="min-h-screen bg-background flex items-center justify-center">
              <p className="font-sans text-sm text-muted-foreground tracking-wide">Loading latest edition...</p>
            </div>
          )}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/magorium" element={<BrandAliasPage />} />
            <Route path="/magorum" element={<BrandAliasPage />} />
            <Route path="/magoriium" element={<BrandAliasPage />} />
            <Route path="/themagorium" element={<BrandAliasPage />} />
            <Route path="/themagoriium" element={<BrandAliasPage />} />
            <Route path="/the-magorium" element={<BrandAliasPage />} />
            <Route path="/the-magoriium" element={<BrandAliasPage />} />
            <Route path="/article/:id" element={<ArticlePage />} />
            <Route path="/articles/:id" element={<ArticlePage />} />
            <Route path="/hidden-menu/stories/:id" element={<ArticlePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/archive/:edition" element={<EditionPage />} />
            <Route path="/author/:slug" element={<AuthorPage />} />
            <Route path="/authors/:slug" element={<AuthorPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/editors-letter" element={<EditorsLetterPage />} />
            <Route path="/contributors" element={<ContributorsPage />} />
            <Route path="/seo-history" element={<SeoHistoryPage />} />
            <Route path="/partnerships" element={<PartnershipsPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookies" element={<CookiesPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
