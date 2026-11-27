import type { Product, ProductVariant } from "./types";

/** "Teal" or "Teal / Large". */
export const variantLabel = (v: Pick<ProductVariant, "values">) => v.values.join(" / ");

/** Where a line ships from: the option's own setting, else the product's, else the US shop. */
export const shipsFromIndia = (p: Pick<Product, "shipsFrom">, v?: Pick<ProductVariant, "shipsFrom">) => (v?.shipsFrom ?? p.shipsFrom ?? "US") === "IN";

/** Where a line's stock is: `stock` is the total (undefined = made to order), `stockIn` the part in India, `mto` where a made-to-order piece ships from. */
export type StockSplit = { stock?: number; stockIn: number; mto: "US" | "IN" };
export type Place = "US" | "IN";

/**
 * Every catalog line (keyed by `regularKey`: product id + option id): its stock in the US and in India. A line missing here is not in the catalog.
 * An older feed with no `stockIn` falls back to the "ships from" flag (all of a counted option's stock is in India, or none).
 */
export function stockSplit(products: Product[]): Record<string, StockSplit> {
  const one = (stock: number | undefined, stockIn: number | undefined, india: boolean): StockSplit => ({
    stock,
    stockIn: stock === undefined ? 0 : Math.min(stock, stockIn ?? (india ? stock : 0)),
    mto: india ? "IN" : "US",
  });
  const out: Record<string, StockSplit> = {};
  for (const p of products) {
    if (hasOptions(p)) for (const v of p.variants!) out[regularKey(p.id, v.id)] = one(v.stock, v.stockIn, shipsFromIndia(p, v));
    else out[regularKey(p.id)] = one(p.stock, p.stockIn, shipsFromIndia(p));
  }
  return out;
}

/** Which places to take a line from, first choice first. Website: an Indian address takes India stock first; pickup and delivery are US only. Mirrors the shop's allocation. */
export const preferFor = ({ pickupOrDelivery = false, dest = "US" }: { pickupOrDelivery?: boolean; dest?: string }): Place[] => (pickupOrDelivery ? ["US"] : dest === "IN" ? ["IN", "US"] : ["US", "IN"]);

/**
 * How many of `qty` ship from the US and from India. Made to order: all from where it is made. Counted stock: take from the
 * first place in `prefer` up to its count, then the next listed; anything beyond the total goes to the first place.
 */
export function allocateLine(line: StockSplit, qty: number, prefer: Place[]): { us: number; in: number } {
  if (line.stock === undefined) return line.mto === "IN" ? { us: 0, in: qty } : { us: qty, in: 0 };
  const left = { US: Math.max(0, line.stock - line.stockIn), IN: Math.max(0, line.stockIn) };
  const got = { US: 0, IN: 0 };
  let rest = qty;
  for (const place of prefer) {
    const n = Math.min(rest, left[place]);
    got[place] += n;
    rest -= n;
  }
  if (rest > 0) got[prefer[0]] += rest;
  return { us: got.US, in: got.IN };
}

/** True when the US alone can't cover `qty` of the line (made-to-order in India, or more than the US count). Pickup and delivery refuse such a bag. */
export const usShort = (line: StockSplit, qty: number) => (line.stock === undefined ? line.mto === "IN" : qty > line.stock - line.stockIn);

export const INDIA_NOTE = "Ships from India";
export const INDIA_PRODUCT_NOTE = "Ships from India \u00b7 $15 flat shipping \u00b7 delivers within 2 weeks";

export const hasOptions = (p: Product) => Boolean(p.options?.length && p.variants?.length);

export const variantPrice = (p: Product, v?: ProductVariant) => v?.price ?? p.price;

/**
 * The regular price to strike through on a sale, or undefined. One rule for every page: an option with its own price
 * has its own compare-at price; an option without one is priced by the product, so it uses the product's compare-at
 * (never a stale per-option value, which is how the shop listing and product page used to disagree).
 */
export const variantCompareAt = (p: Product, v?: ProductVariant) => (v && v.price !== undefined ? v.compareAtPrice : p.compareAtPrice);

/** Regular prices of every sellable line, keyed by `regularKey` (product id + option id), for cart lines that only store the sale price. */
export const regularKey = (productId: string, variantId?: string) => `${productId}|${variantId ?? ""}`;
export function regularPrices(products: Product[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of products) {
    if (hasOptions(p)) {
      for (const v of p.variants!) {
        const c = variantCompareAt(p, v);
        if (c !== undefined && c > variantPrice(p, v)) out[regularKey(p.id, v.id)] = c;
      }
    } else if (p.compareAtPrice !== undefined && p.compareAtPrice > p.price) out[regularKey(p.id)] = p.compareAtPrice;
  }
  return out;
}

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
