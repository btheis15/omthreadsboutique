/**
 * Single entry point for catalog data. Pages never talk to Sanity directly:
 * when Sanity is configured, data comes from the admin; otherwise the
 * built-in sample catalog is used so the site always renders.
 */
import { createImageUrlBuilder } from "@sanity/image-url";
import type { PortableTextBlock } from "next-sanity";
import { sampleCollections, samplePages, sampleProducts } from "@/data/sample";
import { client } from "@/sanity/client";
import { carePresets } from "@/sanity/options";
import type { Collection, ContentPage, Product, ProductImage, ProductType } from "./types";

export const CACHE_TAG = "sanity";
const NEW_ARRIVAL_DAYS = 21;

// ---------------------------------------------------------------------------
// Sanity queries
// ---------------------------------------------------------------------------

const imageFields = `{ "url": asset->url, "lqip": asset->metadata.lqip, alt, hotspot, crop, asset }`;

const productFields = `{
  "id": _id,
  "slug": slug.current,
  title,
  "type": productType,
  price,
  compareAtPrice,
  "images": images[]${imageFields},
  shortDescription,
  description,
  colors,
  material,
  dimensions,
  carePreset,
  care,
  stock,
  etsyUrl,
  "collections": collections[]->slug.current,
  featured,
  "publishedAt": coalesce(publishedAt, _createdAt),
  seoTitle,
  seoDescription
}`;

type SanityImage = {
  url?: string;
  lqip?: string;
  alt?: string;
  asset?: { _ref: string };
  hotspot?: unknown;
  crop?: unknown;
};

type SanityProduct = Omit<Product, "images" | "isNew" | "care" | "collections" | "colors"> & {
  images: SanityImage[] | null;
  colors: string[] | null;
  collections: string[] | null;
  carePreset?: keyof typeof carePresets | "custom";
  care?: string;
};

async function query<T>(groq: string, params: Record<string, unknown> = {}): Promise<T> {
  if (!client) throw new Error("Sanity is not configured");
  return client.fetch<T>(groq, params, { next: { revalidate: 300, tags: [CACHE_TAG] } });
}

const builder = client ? createImageUrlBuilder(client) : null;

function mapImage(img: SanityImage, fallbackAlt: string): ProductImage {
  // Bake crop/hotspot into the base URL; the image loader appends width & quality.
  const url = builder && img.asset ? builder.image(img).fit("max").auto("format").url() : img.url;
  return { url, lqip: img.lqip, alt: img.alt || fallbackAlt };
}

function mapProduct(p: SanityProduct): Product {
  const care =
    p.carePreset === "custom" ? p.care : p.carePreset ? carePresets[p.carePreset] : undefined;
  return {
    ...p,
    images: (p.images ?? []).map((i) => mapImage(i, p.title)),
    colors: p.colors ?? [],
    collections: (p.collections ?? []).filter(Boolean),
    featured: Boolean(p.featured),
    care,
    isNew: Date.now() - new Date(p.publishedAt).getTime() < NEW_ARRIVAL_DAYS * 86_400_000,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getProducts(): Promise<Product[]> {
  if (!client) return sampleProducts;
  const rows = await query<SanityProduct[]>(
    `*[_type == "product" && defined(slug.current)] | order(publishedAt desc) ${productFields}`,
  );
  return rows.map(mapProduct);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  if (!client) return sampleProducts.find((p) => p.slug === slug);
  const row = await query<SanityProduct | null>(
    `*[_type == "product" && slug.current == $slug][0] ${productFields}`,
    { slug },
  );
  return row ? mapProduct(row) : undefined;
}

export async function getCollections(): Promise<Collection[]> {
  if (!client) return sampleCollections;
  const rows = await query<(Omit<Collection, "image"> & { image?: SanityImage; fallback?: SanityImage })[]>(
    `*[_type == "collection" && showOnHome != false && defined(slug.current)] | order(title asc) {
      "slug": slug.current, title, description,
      "image": image${imageFields},
      "fallback": *[_type == "product" && references(^._id)] | order(publishedAt desc)[0].images[0]${imageFields}
    }`,
  );
  return rows.map(({ image, fallback, ...c }) => {
    const img = image?.asset ? image : fallback;
    return { ...c, image: img ? mapImage(img, c.title) : undefined };
  });
}

export async function getCollection(slug: string): Promise<Collection | undefined> {
  if (!client) return sampleCollections.find((c) => c.slug === slug);
  return query<Collection | null>(
    `*[_type == "collection" && slug.current == $slug][0]{ "slug": slug.current, title, description }`,
    { slug },
  ).then((c) => c ?? undefined);
}

export async function getPage(slug: string): Promise<ContentPage | undefined> {
  const fallback = samplePages.find((p) => p.slug === slug);
  if (!client) return fallback;
  const row = await query<{ title: string; intro?: string; body?: PortableTextBlock[] } | null>(
    `*[_type == "page" && slug.current == $slug][0]{ title, intro, body }`,
    { slug },
  );
  if (!row) return fallback;
  return { slug, title: row.title, intro: row.intro, body: row.body ?? [] };
}

// ---------------------------------------------------------------------------
// Filtering helpers (catalog is small, so filtering happens in memory)
// ---------------------------------------------------------------------------

export type SortKey = "newest" | "price-asc" | "price-desc" | "featured";

export type ProductFilters = {
  type?: ProductType;
  collection?: string;
  colors?: string[];
  materials?: string[];
  maxPrice?: number;
  q?: string;
  sort?: SortKey;
  inStockOnly?: boolean;
};

export function isSoldOut(p: Product) {
  return p.stock === 0;
}

export function filterProducts(products: Product[], f: ProductFilters): Product[] {
  const q = f.q?.trim().toLowerCase();
  const out = products.filter((p) => {
    if (f.type && p.type !== f.type) return false;
    if (f.collection && !p.collections.includes(f.collection)) return false;
    if (f.colors?.length && !p.colors.some((c) => f.colors!.includes(c))) return false;
    if (f.materials?.length && (!p.material || !f.materials.includes(p.material))) return false;
    if (f.maxPrice && p.price > f.maxPrice) return false;
    if (f.inStockOnly && isSoldOut(p)) return false;
    if (q) {
      const haystack = [p.title, p.shortDescription, p.material, p.type, ...p.colors]
        .join(" ")
        .toLowerCase();
      if (!q.split(/\s+/).every((word) => haystack.includes(word))) return false;
    }
    return true;
  });

  const byDate = (a: Product, b: Product) => b.publishedAt.localeCompare(a.publishedAt);
  const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
    newest: byDate,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    featured: (a, b) => Number(b.featured) - Number(a.featured) || byDate(a, b),
  };
  // Sold-out items always sink to the end.
  return out.sort(
    (a, b) => Number(isSoldOut(a)) - Number(isSoldOut(b)) || sorters[f.sort ?? "featured"](a, b),
  );
}

export function relatedProducts(all: Product[], product: Product, limit = 4): Product[] {
  const score = (p: Product) =>
    (p.type === product.type ? 2 : 0) +
    p.collections.filter((c) => product.collections.includes(c)).length +
    p.colors.filter((c) => product.colors.includes(c)).length;
  return all
    .filter((p) => p.id !== product.id && !isSoldOut(p))
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
}
