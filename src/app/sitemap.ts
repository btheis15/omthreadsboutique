import type { MetadataRoute } from "next";
import { getCollections, getLists, getProducts } from "@/lib/catalog";
import { typesWithProducts } from "@/lib/lists";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [products, collections, lists] = await Promise.all([getProducts(), getCollections(), getLists()]);
  const categories = typesWithProducts(lists, products);
  const staticPaths = ["", "/shop", "/about", "/faq", "/care-guide", "/contact", "/policies/shipping", "/policies/returns"];
  return [
    ...staticPaths.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p ? 0.6 : 1 })),
    ...categories.map((c) => ({ url: `${base}/shop/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...collections.map((c) => ({ url: `${base}/collections/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: new Date(p.publishedAt),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
