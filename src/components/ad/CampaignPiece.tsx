"use client";

import Link from "next/link";
import { useState } from "react";
import { buyNowHref } from "@/lib/ad-landing";
import type { Product, ProductVariant } from "@/lib/types";
import { variantAvailable, variantCompareAt, variantLabel, variantPrice } from "@/lib/variants";
import { Price } from "../Price";
import { AdBuyBar } from "./AdBuyBar";
import { ProductImage } from "../ProductImage";

/**
 * One piece on a campaign page: its photo (the chosen color's), the colors to choose from, the price and a
 * "Buy now" that goes straight to the checkout for exactly that piece and color. Colors are the piece's options.
 */
export function CampaignPiece({
  product,
  startId,
  coupon,
  first,
  heading,
  bar,
}: {
  product: Product;
  /** The option chosen first (id), for a piece with options. */
  startId?: string;
  coupon?: string;
  /** The first photo on the page: loaded at once, not lazily. */
  first: boolean;
  /** Show the piece's name as a heading (when the page has several pieces). */
  heading: boolean;
  /** A single-piece page: on phones "Buy now" and the price stay in a bottom bar, so it's in reach without scrolling. */
  bar: boolean;
}) {
  const variants = product.variants ?? [];
  const [pickedId, setPickedId] = useState(startId);
  const variant = variants.find((v) => v.id === pickedId);
  const soldOut = (variant ? variant.stock : product.stock) === 0;
  const image = variant?.image ?? product.images[0];

  return (
    <section className="md:grid md:grid-cols-2 md:items-center md:gap-10">
      <div className="relative aspect-[4/5] max-h-[50svh] w-full overflow-hidden bg-sand md:max-h-none md:rounded-lg">
        <ProductImage image={image} preload={first} sizes="(min-width: 768px) 40vw, 100vw" />
      </div>
      <div className="container-page pt-5 md:px-0">
        {heading && <h2 className="text-2xl">{product.title}</h2>}
        {!heading && <p className="eyebrow">{product.title}</p>}
        <Price price={variantPrice(product, variant)} compareAt={variantCompareAt(product, variant)} className="mt-2 text-xl font-medium" />

        {variants.length > 1 && (
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm">
              <span className="text-muted">{product.options?.join(" / ") ?? "Color"}:</span> <span className="font-medium">{variant ? variantLabel(variant) : ""}</span>
            </legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={product.options?.join(" / ") ?? "Color"}>
              {variants.map((v) => (
                <Chip key={v.id} v={v} on={v.id === variant?.id} onPick={() => setPickedId(v.id)} />
              ))}
            </div>
          </fieldset>
        )}

        <div className="mt-5">
          {soldOut ? (
            <Link href={`/product/${product.slug}`} className="btn btn-outline w-full">
              {variant ? `${variantLabel(variant)} is sold out` : "Sold out"}: see other pieces
            </Link>
          ) : (
            <Link href={buyNowHref(product, variant, coupon)} prefetch={false} className={`btn btn-primary w-full ${bar ? "max-md:hidden" : ""}`}>
              Buy now
            </Link>
          )}
          <Link href={`/product/${product.slug}`} className="mt-3 block text-center text-sm text-muted underline underline-offset-4">
            See photos and details
          </Link>
        </div>
      </div>
      {bar && <AdBuyBar product={product} variant={variant} coupon={coupon} />}
    </section>
  );
}

function Chip({ v, on, onPick }: { v: ProductVariant; on: boolean; onPick: () => void }) {
  const canBuy = variantAvailable(v);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={canBuy ? variantLabel(v) : `${variantLabel(v)}, sold out`}
      onClick={onPick}
      className={`min-h-11 rounded-full border px-4 text-[0.95rem] transition ${on ? "border-ink bg-ink text-ivory" : "border-line bg-ivory hover:border-ink"} ${canBuy ? "" : "text-muted"} ${on && !canBuy ? "!text-ivory/75" : ""}`}
    >
      {variantLabel(v)}
      {!canBuy && <span className="ml-1.5 text-[0.7rem] uppercase tracking-wider">Sold out</span>}
    </button>
  );
}
