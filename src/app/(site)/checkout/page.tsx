import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { CartItem } from "@/components/cart/store";
import type { ProductVariant } from "@/lib/types";
import { getProduct, getSettings, getTextOverrides } from "@/lib/catalog";
import { TESTER_COOKIE, checkoutFor } from "@/lib/payments";
import { defaultVariant, variantAvailable, variantLabel, variantPrice } from "@/lib/variants";
import { CheckoutView } from "./CheckoutView";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

type Props = { searchParams: Promise<{ cancelled?: string; tester?: string; products?: string | string[]; coupon?: string | string[] }> };

/**
 * A Meta Shops (Facebook / Instagram) checkout link:
 * /checkout?products=<slug>:<qty>,<slug>:<qty>&coupon=&cart_origin=meta_shops.
 * Meta sends no option, so each product starts with its default one (as on its page), at
 * the catalog's price; more than that option has in stock goes to the product's next
 * in-stock options in order (most pieces are one of each colour). Unknown or sold-out
 * products are left out. A `coupon` is passed on to the checkout, which tries it when the
 * shop has coupon codes.
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
      if (!product) return [];
      const line = (variant: ProductVariant | undefined, n: number) => ({
        productId: product.id,
        variantId: variant?.id,
        option: variant ? variantLabel(variant) : undefined,
        slug: product.slug,
        title: product.title,
        price: variantPrice(product, variant),
        image: variant?.image ?? product.images[0],
        etsyUrl: product.etsyUrl,
        maxQty: variant ? variant.stock : product.stock,
        qty: n,
      });
      const first = defaultVariant(product);
      if (!first) return [line(undefined, qty)];
      const options = [first, ...product.variants!.filter((v) => v !== first && variantAvailable(v))];
      let left = qty;
      const out = [];
      for (const v of options) {
        if (left <= 0) break;
        const n = v.stock === undefined ? left : Math.min(left, v.stock);
        if (n > 0) out.push(line(v, n));
        left -= n;
      }
      return out.length ? out : [line(first, qty)];
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
