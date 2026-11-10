import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { CartItem } from "@/components/cart/store";
import { getProduct, getSettings, getTextOverrides } from "@/lib/catalog";
import { TESTER_COOKIE, checkoutFor } from "@/lib/payments";
import { defaultVariant, variantLabel, variantPrice } from "@/lib/variants";
import { CheckoutView } from "./CheckoutView";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

type Props = { searchParams: Promise<{ cancelled?: string; tester?: string; products?: string | string[]; coupon?: string | string[] }> };

/**
 * A Meta Shops (Facebook / Instagram) checkout link:
 * /checkout?products=<slug>:<qty>,<slug>:<qty>&coupon=&cart_origin=meta_shops.
 * A content ID is a product's slug (its default option, as on its page) or the slug and an
 * option joined by "--" (e.g. `…-wrap--heather-grey`: that exact colour). Each line gets
 * exactly the quantity Meta sent, at the catalog's price, even past the stock count (the
 * payment step still checks stock). Unknown products or options are left out. A `coupon`
 * is passed on to the checkout, which tries it when the shop has coupon codes.
 */
/** "Heather Grey" → "heather-grey", "Ash & Ember" → "ash-ember" (an option as Meta's content IDs name it). */
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function metaShopsCart(param: string | string[] | undefined): Promise<Omit<CartItem, "key">[] | null> {
  const raw = Array.isArray(param) ? param.join(",") : param;
  if (raw === undefined) return null;
  const wanted = new Map<string, number>();
  for (const pair of raw.split(",")) {
    const [id, qtyText] = pair.trim().split(":");
    const qty = qtyText === undefined ? 1 : Number.parseInt(qtyText, 10);
    if (id && Number.isFinite(qty) && qty > 0) wanted.set(id, (wanted.get(id) ?? 0) + qty);
  }
  const lines = await Promise.all(
    [...wanted].map(async ([id, qty]) => {
      const split = id.indexOf("--");
      const slug = split === -1 ? id : id.slice(0, split);
      const optionSlug = split === -1 ? null : id.slice(split + 2).toLowerCase();
      const product = await getProduct(slug);
      if (!product) return [];
      const variant = optionSlug === null ? defaultVariant(product) : product.variants?.find((v) => slugify(variantLabel(v)) === optionSlug);
      if (optionSlug !== null && !variant) return [];
      const stock = variant ? variant.stock : product.stock;
      return [
        {
          productId: product.id,
          variantId: variant?.id,
          option: variant ? variantLabel(variant) : undefined,
          slug: product.slug,
          title: product.title,
          price: variantPrice(product, variant),
          image: variant?.image ?? product.images[0],
          etsyUrl: product.etsyUrl,
          // Room for Meta's quantity, so the cart doesn't cut it down to the stock count.
          maxQty: stock === undefined ? undefined : Math.max(stock, qty),
          qty,
        },
      ];
    }),
  );
  return lines.flat();
}

export default async function CheckoutPage({ searchParams }: Props) {
  const [params, jar, settings, text] = await Promise.all([searchParams, cookies(), getSettings(), getTextOverrides()]);
  const [checkout, linkCart] = await Promise.all([checkoutFor(jar.get(TESTER_COOKIE)?.value), metaShopsCart(params.products)]);
  const couponParam = Array.isArray(params.coupon) ? params.coupon[0] : params.coupon;
  const linkCoupon = couponParam?.trim().slice(0, 30) || null;
  return (
    <CheckoutView
      checkout={checkout}
      cancelled={params.cancelled === "1"}
      testerLink={params.tester === "on" ? "on" : params.tester === "invalid" ? "invalid" : null}
      returnDays={settings.returnDays}
      text={text}
      linkCart={linkCart}
      linkCoupon={linkCoupon}
    />
  );
}
