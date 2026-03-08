import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AdminPage from "./pages/AdminPage";
import ArchivePage from "./pages/ArchivePage";
import ArticlePage from "./pages/ArticlePage";
import EditionPage from "./pages/EditionPage";
import EditorsLetterPage from "./pages/EditorsLetterPage";
import ContributorsPage from "./pages/ContributorsPage";
import PartnershipsPage from "./pages/PartnershipsPage";
import TermsPage from "./pages/TermsPage";
import CookiesPage from "./pages/CookiesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/article/:id" element={<ArticlePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/editors-letter" element={<EditorsLetterPage />} />
          <Route path="/contributors" element={<ContributorsPage />} />
          <Route path="/partnerships" element={<PartnershipsPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/cookies" element={<CookiesPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
