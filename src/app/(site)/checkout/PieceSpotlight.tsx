"use client";

import Link from "next/link";
import { useState } from "react";
import type { CartItem } from "@/components/cart/store";
import { Price } from "@/components/Price";
import { ChevronIcon } from "@/components/icons";
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
  t,
  returnDays,
}: {
  product: Product;
  line: CartItem;
  /** The line's photos, its colour first (see photosFor). */
  photos: Img[];
  onOpen: (photo: number) => void;
  onPick: (variant: ProductVariant) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  returnDays: number;
}) {
  const [at, setAt] = useState(0);
  const variant = product.variants?.find((v) => v.id === line.variantId);
  const compareAt = variantCompareAt(product, variant);
  const stock = variant ? variant.stock : product.stock;
  const choices = product.variants && product.variants.length > 1 ? product.variants : null;
  const woven = ["pashmina", "kani", "jamawar", "kullu", "lohi", "banarasi"].includes(product.craft ?? "");
  const originLine = product.origin ? t(woven ? "checkoutWovenIn" : "checkoutMadeIn", { origin: product.origin }) : "Handmade in India";
  const optionName = product.options?.join(" / ") || "Color";

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
          // One quiet line, not every colour: tapping it opens the device's own list (the wheel on an iPhone).
          <label className="group relative mt-4 flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-ivory px-4 transition focus-within:border-ink hover:border-ink">
            <span className="min-w-0 truncate text-[0.95rem]">
              <span className="text-muted">{optionName}:</span> <span className="font-medium">{line.option}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-accent">
              Change <ChevronIcon size={16} className="rotate-90" />
            </span>
            <select
              value={line.variantId}
              onChange={(e) => {
                const v = choices.find((x) => x.id === e.target.value);
                if (v && v.id !== line.variantId && variantAvailable(v)) onPick(v);
              }}
              className="absolute inset-0 cursor-pointer appearance-none opacity-0"
              aria-label={`${optionName}, now ${line.option}`}
            >
              {choices.map((v) => (
                <option key={v.id} value={v.id} disabled={!variantAvailable(v)}>
                  {variantLabel(v)}
                  {variantAvailable(v) ? "" : " (sold out)"}
                </option>
              ))}
            </select>
          </label>
        )}

        <ul className="mt-4 space-y-1 rounded-lg bg-sand p-3 text-sm" aria-label="Good to know">
          <li>{originLine}</li>
          <li>{t("checkoutReturnsUS", { days: returnDays })} on US orders</li>
          <li>{t("checkoutShipTime")}</li>
        </ul>
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium">
          <Link href="/shop" className="underline underline-offset-4">
            {t("checkoutKeepBrowsing")}
          </Link>
          <Link href={`/product/${product.slug}`} className="underline underline-offset-4">
            {t("checkoutSeeDetails")}
          </Link>
        </p>

        {product.shortDescription && <p className="mt-5 line-clamp-4 leading-relaxed text-ink/80">{product.shortDescription}</p>}
      </div>
    </section>
  );
}
