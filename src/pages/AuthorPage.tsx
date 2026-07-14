import { useParams } from "react-router-dom";
import { getArticles, getHeroes } from "@/lib/content-store";
import { slugifyText } from "@/lib/content-store";
import { Link } from "react-router-dom";

export default function AuthorPage(){

const {author=""}=useParams();

const name =
author
.replace(/-/g," ")
.replace(/\b\w/g,c=>c.toUpperCase());


const articles=[
...getArticles(),
...getHeroes()
];

const results =
articles.filter(
(article:any)=>
slugifyText(article.author||"")
===
slugifyText(author)
);


return (

<div className="container mx-auto px-4 py-16">

<h1 className="text-5xl font-serif mb-8">
{name}
</h1>


{results.map((article:any)=>(

<Link
key={article.id}
to={`/articles/${article.title.toLowerCase().replace(/[^a-z0-9]+/g,"-")}--${article.id}`}
>

<h2 className="text-2xl mb-4">
{article.title}
</h2>

</Link>

))}

</div>

);

}
