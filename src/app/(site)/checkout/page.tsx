import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { CartItem } from "@/components/cart/store";
import { getProduct, getSettings, getTextOverrides } from "@/lib/catalog";
import { TESTER_COOKIE, checkoutFor } from "@/lib/payments";
import type { Product } from "@/lib/types";
import { defaultVariant, variantAvailable, variantLabel, variantPrice } from "@/lib/variants";
import { CheckoutView } from "./CheckoutView";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

type Props = { searchParams: Promise<{ cancelled?: string; tester?: string; products?: string | string[]; product?: string | string[]; coupon?: string | string[]; cart_origin?: string | string[] }> };

/**
 * A Meta Shops (Facebook / Instagram) checkout link:
 * /checkout?products=<slug>:<qty>,<slug>:<qty>&coupon=&cart_origin=meta_shops.
 * A content ID is a product's slug (its default option, as on its page) or the slug and an
 * option joined by "--" (e.g. `…-wrap--heather-grey`: that exact colour). Each line gets
 * exactly the quantity Meta sent, at the catalog's price, even past the stock count (the
 * payment step still checks stock). Unknown products or options are left out. A `coupon`
 * is passed on to the checkout, which tries it when the shop has coupon codes.
 * The home page's Hot Sale tiles use the same link with cart_origin=hot_sale: the shopper's bag is set
 * aside instead of emptied, and comes back once they've paid (or when they ask).
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

/**
 * A direct-to-checkout link for one piece: /checkout?product=<slug> (the home page's Hot Sale tiles use it).
 * The piece goes in the cart on its own (the shopper's bag is set aside and comes back after they pay), at its
 * first in-stock colour, and checkout shows it large with its colours to choose from. An unknown slug is
 * ignored (the normal checkout); a sold-out piece is named, so the shopper knows why it isn't there.
 */
async function directProduct(param: string | string[] | undefined): Promise<{ product: Product; line: Omit<CartItem, "key"> } | { soldOut: string } | null> {
  const slug = (Array.isArray(param) ? param[0] : param)?.trim();
  if (!slug) return null;
  const product = await getProduct(slug);
  if (!product) return null;
  const variant = product.variants?.length ? product.variants.find(variantAvailable) : undefined;
  if (product.variants?.length ? !variant : product.stock === 0) return { soldOut: product.title };
  const stock = variant ? variant.stock : product.stock;
  return {
    product,
    line: {
      productId: product.id,
      variantId: variant?.id,
      option: variant ? variantLabel(variant) : undefined,
      slug: product.slug,
      title: product.title,
      price: variantPrice(product, variant),
      image: variant?.image ?? product.images[0],
      etsyUrl: product.etsyUrl,
      maxQty: stock,
      qty: 1,
    },
  };
}

export default async function CheckoutPage({ searchParams }: Props) {
  const [params, jar, settings, text] = await Promise.all([searchParams, cookies(), getSettings(), getTextOverrides()]);
  // A Meta Shops link (`products`) wins over a one-piece link (`product`).
  const [checkout, metaCart, direct] = await Promise.all([
    checkoutFor(jar.get(TESTER_COOKIE)?.value),
    metaShopsCart(params.products),
    params.products === undefined ? directProduct(params.product) : null,
  ]);
  const piece = direct && "product" in direct ? direct : null;
  const linkCart = metaCart ?? (piece ? [piece.line] : null);
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
      buyAlone={Boolean(piece) || params.cart_origin === "hot_sale"}
      spotlight={piece?.product ?? null}
      soldOutLink={direct && "soldOut" in direct ? direct.soldOut : null}
    />
  );
}
