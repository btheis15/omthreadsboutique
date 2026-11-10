import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { CartItem } from "@/components/cart/store";
import { getProduct, getSettings, getTextOverrides } from "@/lib/catalog";
import { TESTER_COOKIE, checkoutFor } from "@/lib/payments";
import { defaultVariant, variantLabel, variantPrice } from "@/lib/variants";
import { CheckoutView } from "./CheckoutView";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

type Props = { searchParams: Promise<{ cancelled?: string; tester?: string; products?: string | string[] }> };

/**
 * A Meta Shops (Facebook / Instagram) checkout link:
 * /checkout?products=<slug>:<qty>,<slug>:<qty>&coupon=&cart_origin=meta_shops.
 * Meta sends no option, so each product gets its default one (as on its page), at the
 * catalog's price. Unknown or sold-out products are left out. The shop has no typed
 * coupon codes, so `coupon` is ignored.
 */
async function metaShopsCart(param: string | string[] | undefined): Promise<Omit<CartItem, "key">[] | null> {
  const raw = Array.isArray(param) ? param.join(",") : param;
  if (raw === undefined) return null;
  const wanted = new Map<string, number>();
  for (const pair of raw.split(",")) {
    const [slug, qtyText] = pair.trim().split(":");
    const qty = qtyText === undefined ? 1 : Number.parseInt(qtyText, 10);
    if (slug && Number.isFinite(qty) && qty > 0) wanted.set(slug, (wanted.get(slug) ?? 0) + qty);
  }
  const lines = await Promise.all(
    [...wanted].map(async ([slug, qty]) => {
      const product = await getProduct(slug);
      if (!product) return null;
      const variant = defaultVariant(product);
      return {
        productId: product.id,
        variantId: variant?.id,
        option: variant ? variantLabel(variant) : undefined,
        slug: product.slug,
        title: product.title,
        price: variantPrice(product, variant),
        image: variant?.image ?? product.images[0],
        etsyUrl: product.etsyUrl,
        maxQty: variant ? variant.stock : product.stock,
        qty,
      };
    }),
  );
  return lines.filter((l) => l !== null);
}

export default async function CheckoutPage({ searchParams }: Props) {
  const [params, jar, settings, text] = await Promise.all([searchParams, cookies(), getSettings(), getTextOverrides()]);
  const [checkout, linkCart] = await Promise.all([checkoutFor(jar.get(TESTER_COOKIE)?.value), metaShopsCart(params.products)]);
  return (
    <CheckoutView
      checkout={checkout}
      cancelled={params.cancelled === "1"}
      testerLink={params.tester === "on" ? "on" : params.tester === "invalid" ? "invalid" : null}
      returnDays={settings.returnDays}
      text={text}
      linkCart={linkCart}
    />
  );
}
