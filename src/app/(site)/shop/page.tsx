import type { Metadata } from "next";
import { type SearchParams, ShopView } from "@/components/ShopView";
import { getProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop all shawls & stoles",
  description: "Browse every shawl, stole, scarf and wrap in pashmina, cashmere, silk, wool and more.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [products, sp] = await Promise.all([getProducts(), searchParams]);
  const q = typeof sp.q === "string" ? sp.q : undefined;
  return (
    <ShopView
      title={q ? `Results for “${q}”` : "Shop all"}
      description={q ? undefined : "Every piece is handpicked for softness, drape and lasting quality."}
      products={products}
      searchParams={sp}
    />
  );
}
