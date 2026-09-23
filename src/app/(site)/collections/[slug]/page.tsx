import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { type SearchParams, ShopView } from "@/components/ShopView";
import { getCollection, getProducts } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCollection((await params).slug);
  if (!c) return {};
  return { title: c.title, description: c.description, alternates: { canonical: `/collections/${c.slug}` } };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const [collection, products, sp] = await Promise.all([getCollection(slug), getProducts(), searchParams]);
  if (!collection) notFound();
  return (
    <ShopView
      title={collection.title}
      description={collection.description}
      products={products.filter((p) => p.collections.includes(slug))}
      searchParams={sp}
    />
  );
}
