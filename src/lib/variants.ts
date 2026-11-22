import type { Product, ProductVariant } from "./types";

/** "Teal" or "Teal / Large". */
export const variantLabel = (v: Pick<ProductVariant, "values">) => v.values.join(" / ");

export const hasOptions = (p: Product) => Boolean(p.options?.length && p.variants?.length);

export const variantPrice = (p: Product, v?: ProductVariant) => v?.price ?? p.price;

/**
 * The regular price to strike through on a sale, or undefined. One rule for every page: an option with its own price
 * has its own compare-at price; an option without one is priced by the product, so it uses the product's compare-at
 * (never a stale per-option value, which is how the shop listing and product page used to disagree).
 */
export const variantCompareAt = (p: Product, v?: ProductVariant) => (v && v.price !== undefined ? v.compareAtPrice : p.compareAtPrice);

/** The variant that sets a product's "from" price on listings: the cheapest (the first one on a tie). */
export const cheapestVariant = (p: Product): ProductVariant | undefined =>
  hasOptions(p) ? p.variants!.reduce((a, b) => (variantPrice(p, b) < variantPrice(p, a) ? b : a)) : undefined;

/** The strikethrough price to show next to a product's "from" price on listings (same rule as the product page). */
export const listingCompareAt = (p: Product) => variantCompareAt(p, cheapestVariant(p));

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

/** Tells the gallery which option values (e.g. ["Sage"]) are picked, so it shows that color's videos. */
export const SELECT_VARIANT_EVENT = "omthreads:select-variant";

/** Asks the gallery (ProductGallery) to show a photo, e.g. the one of the colour just picked. */
export const SHOW_IMAGE_EVENT = "omthreads:show-image";

/** "Only N left" is said at this many or fewer, and only for a real stock count (made-to-order has none). */
export const LOW_STOCK_MAX = 3;
export const lowStockLeft = (stock?: number): number | null => (stock !== undefined && stock > 0 && stock <= LOW_STOCK_MAX ? stock : null);
