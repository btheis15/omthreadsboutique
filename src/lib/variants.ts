import type { Product, ProductVariant } from "./types";

/** "Teal" or "Teal / Large". */
export const variantLabel = (v: Pick<ProductVariant, "values">) => v.values.join(" / ");

export const hasOptions = (p: Product) => Boolean(p.options?.length && p.variants?.length);

export const variantPrice = (p: Product, v?: ProductVariant) => v?.price ?? p.price;

/** Lowest and highest price across the options (both the product's price when it has none). */
export function priceRange(p: Product): { min: number; max: number } {
  if (!hasOptions(p)) return { min: p.price, max: p.price };
  const prices = p.variants!.map((v) => variantPrice(p, v));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** An option can be bought unless it's sold out (made-to-order options always can). */
export const variantAvailable = (v: ProductVariant) => v.stock === undefined || v.stock > 0;

/** The option to show first: the first one that can be bought. */
export const defaultVariant = (p: Product) => p.variants?.find(variantAvailable) ?? p.variants?.[0];

/** Asks the gallery (ProductGallery) to show a photo, e.g. the one of the colour just picked. */
export const SHOW_IMAGE_EVENT = "omthreads:show-image";
