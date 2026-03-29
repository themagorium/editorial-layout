import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { applyHomeSeo } from "@/lib/seo";

export default function BrandAliasPage() {
  useEffect(() => {
    applyHomeSeo();
  }, []);

  return <Navigate to="/" replace />;
}
