import type { Metadata } from "next";
import { type SearchParams, ShopView } from "@/components/ShopView";
import { getProducts, getT } from "@/lib/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("seoShopTitle"), description: t("seoShopDescription"), alternates: { canonical: "/shop" } };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [products, sp, t] = await Promise.all([getProducts(), searchParams, getT()]);
  const q = typeof sp.q === "string" ? sp.q : undefined;
  return (
    <ShopView
      title={q ? t("shopSearchTitle", { query: q }) : t("shopTitle")}
      description={q ? undefined : t("shopIntro")}
      products={products}
      searchParams={sp}
    />
  );
}
