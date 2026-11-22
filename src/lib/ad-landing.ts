import { american } from "./american";
import type { Product, ProductVariant } from "./types";
import { defaultVariant, variantAvailable, variantLabel } from "./variants";

/** The direct-to-checkout link for one piece (see /checkout?product=…): the shopper's bag is set aside, then restored after they pay. */
export function buyNowHref(product: Pick<Product, "slug">, variant?: ProductVariant, coupon?: string): string {
  const q = new URLSearchParams({ product: product.slug });
  if (variant) q.set("color", variantLabel(variant));
  if (coupon) q.set("coupon", coupon);
  return `/checkout?${q.toString().replace(/\+/g, "%20")}`;
}

/** An option's name the way the checkout link matches it: ignoring case, spaces, dashes and British spellings. */
const slugify = (s: string) => american(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** The option for a color name from a campaign (any one of its values, or the whole label), when it exists. */
export function variantNamed(product: Product, color?: string): ProductVariant | undefined {
  const wanted = color ? slugify(color) : "";
  if (!wanted) return undefined;
  return product.variants?.find((v) => slugify(variantLabel(v)) === wanted || v.values.some((x) => slugify(x) === wanted));
}

/** The option to show first: the campaign's color if it can be bought, else the first one in stock (as the checkout does). */
export function startingVariant(product: Product, color?: string): ProductVariant | undefined {
  const named = variantNamed(product, color);
  return named && variantAvailable(named) ? named : defaultVariant(product);
}

/** The place the shop ships from, only when the site's announcement bar says it ("Ships from Lake Villa, IL · …"). */
export function shipsFrom(announcement?: string): string | undefined {
  const m = announcement?.match(/ships from\s+([^·|•\n]+)/i);
  const place = m?.[1]?.trim();
  return place ? `Ships from ${place}` : undefined;
}
