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
          <h2 className="text-2xl mb-4">{article.title}</h2>
        </Link>
      ))}
    </div>
  );
}
