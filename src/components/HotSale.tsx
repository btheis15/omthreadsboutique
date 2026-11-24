import Link from "next/link";
import type { Product } from "@/lib/types";
import type { T } from "@/lib/site-text";
import { defaultVariant, variantCompareAt, variantLabel, variantPrice } from "@/lib/variants";
import { ArrowIcon } from "./icons";
import { formatPrice } from "@/lib/site";
import { ProductImage } from "./ProductImage";

/** The owner's Hot Sale pieces that can still be bought (each with its first in-stock option), in the owner's order. */
export function hotSalePicks(products: Product[], ids: string[]) {
  return ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))
    .map((product) => ({ product, variant: defaultVariant(product) }))
    .filter(({ product, variant }) => (variant ? variant.stock !== 0 : product.stock !== 0));
}

/**
 * The owner's Hot Sale pieces (admin: Site settings → Hot Sale), on the hero photo so a phone sees them
 * without scrolling. Each tile is one tap to checkout with just that piece, or to its page when the
 * website checkout is off.
 */
export function HotSale({
  picks,
  heading,
  onSiteCheckout,
  t,
}: {
  picks: ReturnType<typeof hotSalePicks>;
  heading: string;
  onSiteCheckout: boolean;
  t: T;
}) {
  if (!picks.length) return null;
  return (
    <section aria-labelledby="hot-sale-heading" className="w-full md:w-[25rem] md:shrink-0">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="hot-sale-heading" className="flex items-center gap-2 font-sans text-[0.7rem] font-semibold tracking-[0.2em] text-zari-light uppercase">
          <span aria-hidden="true">✦</span> {heading}
        </h2>
        {onSiteCheckout && <p className="text-[0.7rem] text-ivory/70">{t("homeHotIntro")}</p>}
      </div>
      <ul className={`mt-2.5 grid gap-2.5 md:grid-cols-1 md:gap-3 ${picks.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {picks.map(({ product, variant }) => {
          const price = variantPrice(product, variant);
          const compareAt = variantCompareAt(product, variant);
          const onSale = compareAt !== undefined && compareAt > price;
          const option = variant && product.variants!.length > 1 ? variantLabel(variant) : null;
          // Checkout with only this piece, shown large with its colours (the shopper's bag is set aside and comes back after).
          const href = onSiteCheckout ? `/checkout?product=${encodeURIComponent(product.slug)}` : `/product/${product.slug}`;
          return (
            <li key={product.id}>
              <Link
                href={href}
                prefetch={false}
                className="group flex h-full items-center gap-2.5 rounded-xl border border-ivory/20 bg-indigo-deep/55 p-1.5 pr-2.5 text-ivory backdrop-blur-md transition duration-500 hover:border-zari-light/70 hover:bg-indigo-deep/75 md:gap-4 md:p-2 md:pr-4"
                aria-label={`${product.title}${option ? `, ${option}` : ""}, ${formatPrice(price)}${onSale ? `, ${Math.round((1 - price / compareAt!) * 100)}% off` : ""}: ${onSiteCheckout ? t("homeHotBuy") : t("homeHotView")}`}
              >
                <div className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded-lg bg-sand md:w-20">
                  <ProductImage image={variant?.image ?? product.images[0]} sizes="80px" className="transition duration-[1200ms] ease-soft group-hover:scale-[1.08]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[0.8rem] leading-snug md:text-[0.95rem]">{product.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 text-[0.85rem] font-medium md:text-base">
                    <span className={onSale ? "text-zari-light" : undefined}>{formatPrice(price)}</span>
                    {onSale && <span className="text-[0.7rem] font-normal text-zari-light/90">{Math.round((1 - price / compareAt!) * 100)}% off</span>}
                  </p>
                  <span className="mt-1 hidden items-center gap-1.5 text-xs font-medium text-zari-light md:inline-flex">
                    {onSiteCheckout ? t("homeHotBuy") : t("homeHotView")}
                    <ArrowIcon size={14} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
