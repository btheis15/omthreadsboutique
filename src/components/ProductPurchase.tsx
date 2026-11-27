"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { giftPhrase, type FreeGiftOffer } from "@/lib/free-gift";
import type { Product, ProductVariant } from "@/lib/types";
import type { ProductExpress } from "@/lib/payments";
import { INDIA_PRODUCT_NOTE, SELECT_VARIANT_EVENT, SHOW_IMAGE_EVENT, defaultVariant, hasOptions, lowStockLeft, variantAvailable, variantCompareAt, shipsFromIndia, variantLabel, variantPrice } from "@/lib/variants";
import { AddToCart, StickyBuyBar } from "./AddToCart";
import { Price } from "./Price";
import { ProductExpressBuy } from "./ProductExpressBuy";

/**
 * Price, stock and the buy buttons, with the option picker for a product
 * that comes in options (e.g. three colours). Each option has its own stock:
 * a sold-out colour says "Sold out", and the others stay available.
 */
const noSubscribe = () => () => {};

export function ProductPurchase({ product, onSiteCheckout, express = null, giftOffer = null, afterPrice = null, usShipLine = null }: { afterPrice?: React.ReactNode; usShipLine?: string | null; product: Product; onSiteCheckout: boolean; express?: ProductExpress | null; giftOffer?: FreeGiftOffer | null }) {
  const withOptions = hasOptions(product);
  // Opened from a printed tag (/p/<code> → ?option=<id>): that option is chosen, e.g. the colour on the tag.
  // Read after the page loads (the page itself is the same for everyone), until the shopper picks another.
  const optionId = useSyncExternalStore(noSubscribe, () => new URLSearchParams(window.location.search).get("option"), () => null);
  const tagged = optionId ? product.variants?.find((v) => v.id === optionId) : undefined;
  const [picked, setSelected] = useState<string[] | null>(null);
  const selected = picked ?? tagged?.values ?? defaultVariant(product)?.values ?? [];
  const variant = withOptions ? product.variants!.find((v) => v.values.every((x, i) => x === selected[i])) : undefined;
  const taggedImage = tagged?.image?.url;
  useEffect(() => {
    if (taggedImage) window.dispatchEvent(new CustomEvent(SHOW_IMAGE_EVENT, { detail: { url: taggedImage } }));
  }, [taggedImage]);

  // The gallery shows the videos made for the picked color.
  const selectedKey = selected.join("\u0000");
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(SELECT_VARIANT_EVENT, { detail: { values: selectedKey ? selectedKey.split("\u0000") : [] } }));
  }, [selectedKey]);

  const choose = (kind: number, value: string) => {
    const next = [...selected];
    next[kind] = value;
    // Keep the other choices if that combination exists; otherwise pick the closest one that can be bought.
    const exact = product.variants!.find((v) => v.values.every((x, i) => x === next[i]));
    const fallback =
      product.variants!.find((v) => v.values[kind] === value && variantAvailable(v)) ??
      product.variants!.find((v) => v.values[kind] === value);
    const chosen = exact ?? fallback;
    if (!chosen) return;
    setSelected(chosen.values);
    if (chosen.image?.url) window.dispatchEvent(new CustomEvent(SHOW_IMAGE_EVENT, { detail: { url: chosen.image.url } }));
  };

  const price = variantPrice(product, variant);
  const stock = variant ? variant.stock : product.stock;
  const left = lowStockLeft(stock);

  return (
    <>
      {/* Price, its "N% off" tag and the sale's end date on one line, so the story below stays on the first screen. */}
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2 md:mt-3">
        <Price price={price} compareAt={variantCompareAt(product, variant)} className="text-xl font-medium" />
        {product.saleEndsOn && (
          <span className="text-sm text-sale">
            · ends {new Date(`${product.saleEndsOn}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </p>
      {shipsFromIndia(product, variant) ? <p className="mt-2 text-sm font-medium text-zari">{INDIA_PRODUCT_NOTE}</p> : usShipLine && <p className="mt-2 text-sm text-muted">{usShipLine}</p>}
      {afterPrice}
      {giftOffer && (
        <p className="mt-2 text-sm text-zari">
          <span aria-hidden="true">🎁 </span>Buy {giftOffer.minItems}+, get a {giftPhrase(giftOffer.label)}
          {giftOffer.endsOn && ` · through ${new Date(`${giftOffer.endsOn}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
        </p>
      )}
      {left !== null && (
        <p className="mt-2 text-sm text-accent">
          Only {left} left{variant ? ` in ${variantLabel(variant)}` : ""}
        </p>
      )}

      {withOptions &&
        product.options!.map((name, kind) => (
          <OptionPicker
            key={name}
            name={name}
            kind={kind}
            product={product}
            selected={selected}
            onChoose={(value) => choose(kind, value)}
          />
        ))}

      <p className="mt-5 leading-relaxed text-ink/85">{product.shortDescription}</p>
      <div id="buy-buttons" className="mt-6">
        {onSiteCheckout && <ProductExpressBuy product={product} variant={variant} express={express} />}
        <AddToCart product={product} variant={variant} onSiteCheckout={onSiteCheckout} />
      </div>
      <StickyBuyBar product={product} variant={variant} onSiteCheckout={onSiteCheckout} />
    </>
  );
}

function OptionPicker({
  name,
  kind,
  product,
  selected,
  onChoose,
}: {
  name: string;
  kind: number;
  product: Product;
  selected: string[];
  onChoose: (value: string) => void;
}) {
  const variants = product.variants!;
  const values = [...new Set(variants.map((v) => v.values[kind]))];
  // A value can be bought if some option with it (and the other choices made) isn't sold out.
  const matchesOthers = (v: ProductVariant) => v.values.every((x, i) => i === kind || x === selected[i]);
  const available = (value: string) =>
    variants.some((v) => v.values[kind] === value && variantAvailable(v) && (product.options!.length === 1 || matchesOthers(v)));

  return (
    <fieldset className="mt-5">
      <legend className="mb-2 text-sm">
        <span className="text-muted">{name}:</span> <span className="font-medium">{selected[kind]}</span>
      </legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={name}>
        {values.map((value) => {
          const isOn = selected[kind] === value;
          const canBuy = available(value);
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={isOn}
              aria-label={canBuy ? value : `${value}, sold out`}
              onClick={() => onChoose(value)}
              className={`min-h-11 rounded-full border px-4 text-[0.95rem] transition ${
                isOn ? "border-ink bg-ink text-ivory" : "border-line bg-ivory hover:border-ink"
              } ${canBuy ? "" : "text-muted"} ${isOn && !canBuy ? "!text-ivory/75" : ""}`}
            >
              {value}
              {/* Said in words, as on Etsy, and the other choices stay available. */}
              {!canBuy && <span className="ml-1.5 text-[0.7rem] uppercase tracking-wider">Sold out</span>}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
