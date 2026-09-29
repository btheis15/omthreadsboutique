"use client";

import { useState } from "react";
import type { Product, ProductVariant } from "@/lib/types";
import { SHOW_IMAGE_EVENT, defaultVariant, hasOptions, variantAvailable, variantLabel, variantPrice } from "@/lib/variants";
import { AddToCart, StickyBuyBar } from "./AddToCart";
import { Price } from "./Price";

/**
 * Price, stock and the buy buttons, with the option picker for a product
 * that comes in options (e.g. three colours). Each option has its own stock:
 * a sold-out colour says "Sold out", and the others stay available.
 */
export function ProductPurchase({ product, onSiteCheckout }: { product: Product; onSiteCheckout: boolean }) {
  const withOptions = hasOptions(product);
  const [selected, setSelected] = useState<string[]>(() => defaultVariant(product)?.values ?? []);
  const variant = withOptions ? product.variants!.find((v) => v.values.every((x, i) => x === selected[i])) : undefined;

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

  return (
    <>
      <Price price={price} compareAt={product.compareAtPrice} className="mt-3 text-xl font-medium" />
      {stock !== undefined && stock > 0 && stock <= 3 && (
        <p className="mt-2 text-sm text-accent">
          Only {stock} left{variant ? ` in ${variantLabel(variant)}` : ""}
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
        <AddToCart product={product} variant={variant} onSiteCheckout={onSiteCheckout} />
      </div>
      <StickyBuyBar product={product} variant={variant} onSiteCheckout={onSiteCheckout} watchId="buy-buttons" />
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
