import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { slugifyText } from "@/lib/content-store";
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

// Parses simple markdown-style bold/italic markers (**bold**, *italic*)
// entered in the admin Title/Subtitle fields and renders them as real
// <strong>/<em> elements instead of showing literal asterisks.
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
        setResults(
          all.filter((a: any) => normalizeAuthor(a.author || "") === name)
        );
      })
      .catch(() => setResults([]));
  }, [slug]);

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-5xl font-serif mb-8">{name}</h1>
      {results.map((article: any) => (
        <Link
          key={article.id}
          to={`/articles/${article.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}--${article.id}`}
        >
          <h2 className="text-2xl mb-4">{renderFormattedText(article.title)}</h2>
        </Link>
      ))}
    </div>
  );
}
