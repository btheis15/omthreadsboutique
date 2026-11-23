import type { CheckoutInfo, Product, ProductImage } from "./types";
import { hasOptions, variantAvailable, variantLabel, variantPrice } from "./variants";

/** One in-stock choice of the free gift (a colour, or the product itself when it has no options). */
export type GiftOption = { variantId?: string; name: string; image?: ProductImage; stock?: number; price: number };

/** What the cart and checkout need to offer the free gift: the feed's offer plus the gift product's in-stock options. */
export type FreeGiftOffer = {
  label: string;
  minItems: number;
  endsOn: string | null;
  productId: string;
  slug: string;
  title: string;
  options: GiftOption[];
};

const slim = (i?: ProductImage): ProductImage | undefined => (i ? { url: i.url, alt: i.alt, swatch: i.swatch } : undefined);

/** Today in the shop's time zone (YYYY-MM-DD): an offer runs through the end of its last day, Chicago time. */
const shopToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());

/** The offer, or null when it's off, over, or none of the gift's options is in stock. */
export function giftOffer(fg: CheckoutInfo["freeGift"], products: Product[]): FreeGiftOffer | null {
  if (!fg || (fg.endsOn && fg.endsOn < shopToday())) return null;
  const p = products.find((x) => x.id === fg.productId);
  if (!p) return null;
  const options: GiftOption[] = hasOptions(p)
    ? p.variants!.filter(variantAvailable).map((v) => ({ variantId: v.id, name: variantLabel(v), image: slim(v.image ?? p.images[0]), stock: v.stock, price: variantPrice(p, v) }))
    : p.stock === 0
      ? []
      : [{ name: p.title, image: slim(p.images[0]), stock: p.stock, price: p.price }];
  if (!options.length) return null;
  return { label: fg.label, minItems: fg.minItems, endsOn: fg.endsOn, productId: p.id, slug: p.slug, title: p.title, options };
}

/** "Free pouch" → "free pouch", for use inside a sentence. */
export const giftPhrase = (label: string) => label.trim().toLowerCase();
