"use client";

import { useState } from "react";
import type { CartItem } from "@/components/cart/store";
import { Price } from "@/components/Price";
import { ProductImage } from "@/components/ProductImage";
import type { Product, ProductImage as Img, ProductVariant } from "@/lib/types";
import { variantAvailable, variantCompareAt, variantLabel } from "@/lib/variants";

const ExpandIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

/**
 * One piece bought straight from a link (a Hot Sale tile, /checkout?product=): shown large at the top of
 * checkout, since the shopper may never have opened its page. Swipeable photos (tap for full screen), the
 * price with any sale, and its colours to choose from; picking one swaps the cart line.
 */
export function PieceSpotlight({
  product,
  line,
  photos,
  onOpen,
  onPick,
}: {
  product: Product;
  line: CartItem;
  /** The line's photos, its colour first (see photosFor). */
  photos: Img[];
  onOpen: (photo: number) => void;
  onPick: (variant: ProductVariant) => void;
}) {
  const [at, setAt] = useState(0);
  const variant = product.variants?.find((v) => v.id === line.variantId);
  const compareAt = variantCompareAt(product, variant);
  const stock = variant ? variant.stock : product.stock;
  const choices = product.variants && product.variants.length > 1 ? product.variants : null;
  const optionName = product.options?.join(" / ") || "Colour";

  return (
    <section className="mt-6 grid gap-5 md:grid-cols-2 md:items-start md:gap-8" aria-label="Your piece">
      <div className="relative">
        {/* A new colour puts its photos first: start the row over. */}
        <div
          key={line.key}
          className="no-scrollbar flex aspect-[4/5] max-h-[58svh] w-full snap-x snap-mandatory overflow-x-auto rounded-xl bg-sand md:max-h-none"
          onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          aria-roledescription="carousel"
          aria-label={`${product.title} photos`}
        >
          {(photos.length ? photos : [line.image]).map((img, i) => (
            <button
              key={`${img?.url ?? "swatch"}-${i}`}
              type="button"
              onClick={() => onOpen(i)}
              className="relative h-full w-full shrink-0 cursor-zoom-in snap-center"
              aria-label={`See photo ${i + 1} full screen`}
            >
              <ProductImage image={img} sizes="(min-width: 768px) 360px, 92vw" preload={i === 0} />
            </button>
          ))}
        </div>
        <span className="pointer-events-none absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-ivory/90 text-ink shadow-sm">
          <ExpandIcon />
        </span>
        {photos.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full shadow transition-all duration-500 ${i === at ? "w-6 bg-ivory" : "w-1.5 bg-ivory/60"}`} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display text-[1.7rem] leading-tight md:text-3xl">{product.title}</h2>
        <Price price={line.price} compareAt={compareAt} className="mt-2 text-xl font-medium" />
        {product.saleEndsOn && (
          <p className="mt-1 text-sm text-sale">
            Sale ends {new Date(`${product.saleEndsOn}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </p>
        )}
        {stock !== undefined && stock > 0 && stock <= 3 && (
          <p className="mt-1 text-sm text-accent">
            Only {stock} left{line.option ? ` in ${line.option}` : ""}
          </p>
        )}

        {choices && (
          <fieldset className="mt-5">
            <legend className="mb-2 text-sm">
              <span className="text-muted">{optionName}:</span> <span className="font-medium">{line.option}</span>
            </legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={optionName}>
              {choices.map((v) => {
                const on = v.id === line.variantId;
                const canBuy = variantAvailable(v);
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    disabled={!canBuy}
                    aria-label={canBuy ? variantLabel(v) : `${variantLabel(v)}, sold out`}
                    onClick={() => !on && onPick(v)}
                    className={`min-h-11 rounded-full border px-4 text-[0.95rem] transition ${
                      on ? "border-ink bg-ink text-ivory" : "border-line bg-ivory hover:border-ink"
                    } ${canBuy ? "" : "cursor-not-allowed text-muted hover:border-line"}`}
                  >
                    {variantLabel(v)}
                    {/* Said in words, as on the product page. */}
                    {!canBuy && <span className="ml-1.5 text-[0.7rem] tracking-wider uppercase">Sold out</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {product.shortDescription && <p className="mt-5 line-clamp-4 leading-relaxed text-ink/80">{product.shortDescription}</p>}
      </div>
    </section>
  );
}
