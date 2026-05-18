import { Component, type ErrorInfo, type ReactNode } from "react";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

const STORAGE_KEYS_TO_RESET = [
  "editorial_heroes",
  "editorial_articles",
  "editorial_ads",
  "editorial_content_version",
  "editorial_has_local_draft",
  "editorial_analytics",
  "editorial_geo_cache",
];

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Keep detailed runtime signal in console for debugging while preventing blank page.
    console.error("App crash prevented by boundary:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetLocalCache = () => {
    STORAGE_KEYS_TO_RESET.forEach((key) => localStorage.removeItem(key));
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-lg w-full border border-border rounded-lg bg-card p-6 space-y-4 text-center">
          <h1 className="text-2xl font-semibold">The Magorium recovered from a crash</h1>
          <p className="text-sm text-muted-foreground">
            A runtime error was blocked so the page does not stay blank. You can reload now, or reset local
            browser cache and reload.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              Reload page
            </button>
            <button
              type="button"
              onClick={this.handleResetLocalCache}
              className="px-4 py-2 rounded-md border border-border text-sm font-medium"
            >
              Reset local cache
            </button>
          </div>
        </div>
      </div>
    );
  }
}
