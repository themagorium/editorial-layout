import StoryFeedPage from "@/components/editorial/StoryFeedPage";

type BrandAliasPageProps = {
  queryHint?: string;
};

export default function BrandAliasPage({ queryHint }: BrandAliasPageProps) {
  return <StoryFeedPage seoHint={queryHint} canonicalAliasPath="/magorium" />;
}
