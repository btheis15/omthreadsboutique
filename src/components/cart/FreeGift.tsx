"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/site";
import { giftPhrase, type FreeGiftOffer } from "@/lib/free-gift";
import { ProductImage } from "../ProductImage";
import { cart, useCart, type GiftChoice } from "./store";

/** The gift as the one extra `gift: true` line every checkout endpoint takes. */
export const giftLine = (g: GiftChoice) => ({ productId: g.productId, variantId: g.variantId, qty: 1, gift: true as const });

/** Drops the chosen gift when the offer is gone, the bag has fewer than the minimum, or that option is out of stock. Render once, site-wide. */
export function GiftGuard({ offer }: { offer: FreeGiftOffer | null }) {
  const { gift, count } = useCart();
  const bad = Boolean(gift) && (!offer || offer.productId !== gift!.productId || !offer.options.some((o) => o.variantId === gift!.variantId) || count < offer.minItems);
  useEffect(() => {
    if (bad) cart.setGift(null);
  }, [bad]);
  return null;
}

/**
 * The free gift in the bag: a nudge until the bag has enough pieces, then a picker of the in-stock options (nothing is
 * chosen for the shopper), then the chosen gift as a line they can change or remove.
 */
export function FreeGift({ offer, paid, focusable = true, className = "" }: { offer: FreeGiftOffer; paid: number; focusable?: boolean; className?: string }) {
  const { gift } = useCart();
  const [changing, setChanging] = useState(false);
  const tab = focusable ? 0 : -1;
  const phrase = giftPhrase(offer.label);
  const need = offer.minItems - paid;

  if (need > 0) {
    return (
      <div className={`flex items-center gap-3 rounded-xl border border-zari/40 bg-zari-light/20 px-4 py-3 text-sm ${className}`}>
        <span className="h-8 w-1 shrink-0 rounded-full bg-zari" aria-hidden="true" />
        <p>
          Add <strong className="font-semibold">{need} more {need === 1 ? "piece" : "pieces"}</strong> for a {phrase} <span aria-hidden="true">🎁</span>
        </p>
      </div>
    );
  }

  const pick = (o: FreeGiftOffer["options"][number]) => {
    cart.setGift({ productId: offer.productId, variantId: o.variantId, option: o.variantId ? o.name : undefined, slug: offer.slug, title: offer.title, price: o.price, image: o.image });
    setChanging(false);
  };
  const showPicker = !gift || changing;
  const chosen = gift && offer.options.find((o) => o.variantId === gift.variantId);

  return (
    <section className={`rounded-xl border border-zari/50 bg-gradient-to-b from-zari-light/25 to-sand/60 p-4 ${className}`} aria-label={offer.label}>
      {gift && (
        <div className="flex items-center gap-3">
          <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-md bg-sand">
            <ProductImage image={chosen?.image ?? gift.image} sizes="56px" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-zari uppercase">Free gift</p>
            <p className="line-clamp-2 text-[0.95rem] leading-snug">{gift.title}</p>
            {gift.option && <p className="text-sm text-muted">{gift.option}</p>}
            <p className="mt-0.5 flex gap-3 text-sm">
              <button type="button" className="font-medium text-accent underline underline-offset-4" onClick={() => setChanging((c) => !c)} tabIndex={tab}>
                {changing ? "Keep this one" : "Change"}
              </button>
              <button type="button" className="text-muted underline underline-offset-4" onClick={() => cart.setGift(null)} tabIndex={tab}>
                Remove
              </button>
            </p>
          </div>
          <p className="shrink-0 text-right">
            <span className="block font-medium text-accent">Free</span>
            <span className="block text-sm text-muted line-through">{formatPrice(gift.price)}</span>
          </p>
        </div>
      )}

      {showPicker && (
        <div className={gift ? "mt-4 border-t border-zari/30 pt-4" : ""}>
          {!gift && (
            <>
              <p className="font-display text-xl leading-tight">
                Choose your {phrase} <span aria-hidden="true">🎁</span>
              </p>
              <p className="mt-0.5 text-sm text-muted">Yours with {offer.minItems}+ pieces, while they last. Tap one.</p>
            </>
          )}
          <div className={`${gift ? "" : "mt-3"} grid grid-cols-4 gap-2`} role="radiogroup" aria-label={`Choose your ${phrase}`}>
            {offer.options.map((o) => {
              const on = Boolean(gift) && gift!.variantId === o.variantId;
              return (
                <button
                  key={o.variantId ?? "gift"}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => pick(o)}
                  tabIndex={tab}
                  className={`group rounded-lg p-1 text-center transition ${on ? "bg-zari-light/50 ring-2 ring-zari" : "ring-1 ring-line hover:ring-zari/60"}`}
                >
                  <span className="relative block aspect-square overflow-hidden rounded-md bg-sand">
                    <ProductImage image={o.image} sizes="80px" />
                  </span>
                  <span className="mt-1 block truncate text-xs leading-tight">{o.name}</span>
                  {o.stock !== undefined && o.stock <= 1 && <span className="block text-[0.65rem] leading-tight text-accent">Last one</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
