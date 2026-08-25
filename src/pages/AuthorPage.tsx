import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { slugifyText, buildContentPath } from "@/lib/content-store";
import { Link } from "react-router-dom";

export function normalizeAuthor(raw: string): string {
  const lower = (raw || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
  const staffPatterns = [
    "", "staff", "editorial",
    "the magorium", "magorium",
    "magorium editorial staff",
    "the magorium editorial",
    "the magorium editorial staff",
  ];
  if (staffPatterns.includes(lower)) {
    return "The Magorium Editorial Staff";
  }
  return raw.trim().replace(/\s+/g, " ");
}

function renderFormattedText(text?: string): React.ReactNode {
  if (!text) return text;
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    if (match[2] !== undefined) {
      nodes.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      nodes.push(<em key={key++}>{match[3]}</em>);
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

export default function AuthorPage() {
  const { slug = "" } = useParams();
  const name = normalizeAuthor(
    slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())
  );
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/content?view=seo", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const source = data.content || data;
        const all = [...(source.articles || []), ...(source.heroes || [])];
        const filtered = all.filter((a: any) => normalizeAuthor(a?.author || "") === name);

        // Sort most recent first. Falls back to 0 for missing/invalid dates
        // so a bad date can't crash the sort — it just sorts to the bottom.
        const sorted = filtered.sort((a: any, b: any) => {
          const dateA = a?.date ? new Date(a.date).getTime() : 0;
          const dateB = b?.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });

        setResults(sorted);
      })
      .catch(() => setResults([]));
  }, [slug, name]);

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-5xl font-serif mb-8">{name}</h1>
      {results.map((article: any) => {
        if (!article?.id || !article?.title) return null;
        return (
          <Link key={article.id} to={buildContentPath(article.id, article.title)}>
            <h2 className="text-2xl mb-4">{renderFormattedText(article.title)}</h2>
          </Link>
        );
      })}
    </div>
  );
}
