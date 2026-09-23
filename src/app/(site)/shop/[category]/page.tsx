import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type SearchParams, ShopView } from "@/components/ShopView";
import { getProducts } from "@/lib/catalog";
import { categories } from "@/lib/site";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<SearchParams> };

export function generateStaticParams() {
  return categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = categories.find((c) => c.slug === category);
  if (!cat) return {};
  return { title: cat.title, description: cat.blurb, alternates: { canonical: `/shop/${cat.slug}` } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ category }, sp, products] = await Promise.all([params, searchParams, getProducts()]);
  const cat = categories.find((c) => c.slug === category);
  if (!cat) notFound();
  return (
    <ShopView
      title={cat.title}
      description={cat.blurb}
      products={products.filter((p) => p.type === cat.type)}
      searchParams={sp}
      activeCategory={cat.slug}
    />
  );
}
