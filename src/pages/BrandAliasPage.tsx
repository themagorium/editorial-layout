import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { applyHomeSeo } from "@/lib/seo";

type BrandAliasPageProps = {
  queryHint?: string;
};

export default function BrandAliasPage({ queryHint }: BrandAliasPageProps) {
  useEffect(() => {
    applyHomeSeo(queryHint);
  }, [queryHint]);

  return <Navigate to="/" replace />;
}
