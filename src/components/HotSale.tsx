import Link from "next/link";
import { craftByValue } from "@/lib/lists";
import type { Lists, Product } from "@/lib/types";
import type { T } from "@/lib/site-text";
import { defaultVariant, variantLabel, variantPrice } from "@/lib/variants";
import { ArrowIcon } from "./icons";
import { Price } from "./Price";
import { ProductImage } from "./ProductImage";

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

/**
 * The owner's Hot Sale pieces (admin: Site settings → Hot Sale), right under the hero. Each tile is one tap
 * to checkout with just that piece (its first colour that's in stock), or to its page when the website
 * checkout is off. Sold-out picks are left out; with none left the row isn't shown.
 */
export function HotSale({ products, ids, lists, onSiteCheckout, t }: { products: Product[]; ids: string[]; lists: Lists; onSiteCheckout: boolean; t: T }) {
  const picks = ids
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p))
    .map((product) => ({ product, variant: defaultVariant(product) }))
    .filter(({ product, variant }) => (variant ? variant.stock !== 0 : product.stock !== 0));
  if (!picks.length) return null;

  return (
    <section className="container-page mt-10 md:mt-14" aria-labelledby="hot-sale-heading">
      <div className="mb-5 flex items-end justify-between gap-4" data-reveal>
        <div>
          <p className="font-deva text-lg text-accent">{t("homeHotEyebrow")}</p>
          <h2 id="hot-sale-heading" className="text-3xl md:text-4xl">
            {t("homeHotHeading")}
          </h2>
        </div>
        {onSiteCheckout && <p className="hidden max-w-xs text-right text-sm text-muted sm:block">{t("homeHotIntro")}</p>}
      </div>
      <ul className={`grid gap-3 md:gap-6 ${picks.length > 1 ? "sm:grid-cols-2" : "sm:max-w-xl"}`}>
        {picks.map(({ product, variant }, i) => {
          const price = variantPrice(product, variant);
          const compareAt = variant ? (variant.compareAtPrice ?? (variant.price === undefined ? product.compareAtPrice : undefined)) : product.compareAtPrice;
          const onSale = compareAt !== undefined && compareAt > price;
          const option = variant && product.variants!.length > 1 ? variantLabel(variant) : null;
          const craft = craftByValue(lists, product.craft);
          // Checkout with only this piece; the shopper's bag is set aside and comes back after (see CheckoutView).
          const href = onSiteCheckout ? `/checkout?products=${encodeURIComponent(product.slug)}:1&cart_origin=hot_sale` : `/product/${product.slug}`;
          return (
            <li key={product.id} data-reveal style={delay(i)}>
              <Link
                href={href}
                prefetch={false}
                className="group flex h-full items-stretch gap-4 overflow-hidden rounded-2xl border border-line bg-white p-2.5 pr-4 transition duration-500 hover:-translate-y-0.5 hover:border-zari/60 hover:shadow-[0_18px_40px_-22px_rgba(35,49,66,0.45)] md:gap-5 md:p-3 md:pr-5"
                aria-label={`${product.title}${option ? `, ${option}` : ""}: ${onSiteCheckout ? t("homeHotBuy") : t("homeHotView")}`}
              >
                <div className="relative aspect-[4/5] w-28 shrink-0 overflow-hidden rounded-xl bg-sand sm:w-32 md:w-36">
                  {onSale && (
                    <span className="absolute top-1.5 left-1.5 z-10 rounded-full bg-accent px-2 py-0.5 text-[0.65rem] font-medium tracking-wide text-ivory">
                      {t("homeHotSaleBadge")}
                    </span>
                  )}
                  <ProductImage
                    image={variant?.image ?? product.images[0]}
                    sizes="(min-width: 768px) 144px, 128px"
                    className="transition duration-[1200ms] ease-soft group-hover:scale-[1.06]"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col py-1">
                  {craft && <p className="text-[0.7rem] font-semibold tracking-[0.16em] text-zari uppercase">{craft.label}</p>}
                  <h3 className="mt-0.5 line-clamp-2 font-sans text-[0.95rem] leading-snug transition-colors group-hover:text-accent md:text-base">
                    {product.title}
                  </h3>
                  {option && <p className="mt-0.5 text-xs text-muted">{option}</p>}
                  <Price price={price} compareAt={compareAt} className="mt-1.5 text-lg font-medium" />
                  {product.shortDescription && <p className="mt-1.5 line-clamp-2 hidden text-sm text-muted md:block">{product.shortDescription}</p>}
                  <span className="mt-auto inline-flex items-center gap-2 pt-3 text-sm font-medium text-accent">
                    {onSiteCheckout ? t("homeHotBuy") : t("homeHotView")}
                    <ArrowIcon size={16} className="transition-transform group-hover:translate-x-1" />
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
