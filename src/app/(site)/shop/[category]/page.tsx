import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type SearchParams, ShopView } from "@/components/ShopView";
import { getLists, getProducts } from "@/lib/catalog";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<SearchParams> };

// Pages for types added in the admin after the last build are rendered on first visit.
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getLists()).types.map((t) => ({ category: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = (await getLists()).types.find((t) => t.slug === category);
  if (!cat) return {};
  return { title: cat.plural, description: cat.blurb || undefined, alternates: { canonical: `/shop/${cat.slug}` } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ category }, sp, products, lists] = await Promise.all([params, searchParams, getProducts(), getLists()]);
  const cat = lists.types.find((t) => t.slug === category);
  if (!cat) notFound();
  // A type with no pieces yet still has a page (the shop view's "no pieces" message); it just isn't linked from the nav.
  return (
    <ShopView
      title={cat.plural}
      description={cat.blurb || undefined}
      products={products.filter((p) => p.type === cat.value)}
      allProducts={products}
      searchParams={sp}
      activeCategory={cat.slug}
    />
  );
}
