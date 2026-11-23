"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  // The option whose photo is open full screen (index into offer.options), or null.
  const [zoom, setZoom] = useState<number | null>(null);
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
          <button
            type="button"
            onClick={() => setZoom(Math.max(0, offer.options.findIndex((o) => o.variantId === gift.variantId)))}
            tabIndex={tab}
            className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-md bg-sand"
            aria-label={`See ${gift.title}${gift.option ? `, ${gift.option}` : ""} bigger`}
          >
            <ProductImage image={chosen?.image ?? gift.image} sizes="56px" />
            <span className="absolute right-0.5 bottom-0.5 grid size-5 place-items-center rounded-full bg-ivory/90 text-ink" aria-hidden="true">
              <ExpandIcon />
            </span>
          </button>
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
              <button
                type="button"
                className="text-muted underline underline-offset-4"
                onClick={() => setZoom(Math.max(0, offer.options.findIndex((o) => o.variantId === gift.variantId)))}
                tabIndex={tab}
              >
                See bigger
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
            {offer.options.map((o, i) => {
              const on = Boolean(gift) && gift!.variantId === o.variantId;
              return (
                <div key={o.variantId ?? "gift"} className="relative">
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => pick(o)}
                  tabIndex={tab}
                  className={`group block w-full rounded-lg p-1 text-center transition ${on ? "bg-zari-light/50 ring-2 ring-zari" : "ring-1 ring-line hover:ring-zari/60"}`}
                >
                  <span className="relative block aspect-square overflow-hidden rounded-md bg-sand">
                    <ProductImage image={o.image} sizes="80px" />
                  </span>
                  <span className="mt-1 block truncate text-xs leading-tight">{o.name}</span>
                  {o.stock !== undefined && o.stock <= 1 && <span className="block text-[0.65rem] leading-tight text-accent">Last one</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(i)}
                  tabIndex={tab}
                  className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-ivory/90 text-ink shadow-sm"
                  aria-label={`See ${o.name} bigger`}
                >
                  <ExpandIcon />
                </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {zoom !== null && <GiftPhotos offer={offer} start={zoom} chosenId={gift?.variantId} onPick={(o) => { pick(o); setZoom(null); }} onClose={() => setZoom(null)} />}
    </section>
  );
}

const ExpandIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
);

/** The gift's options full screen, one photo each: swipe (or arrows) between colours, pinch to zoom, choose one. */
function GiftPhotos({
  offer,
  start,
  chosenId,
  onPick,
  onClose,
}: {
  offer: FreeGiftOffer;
  start: number;
  chosenId?: string;
  onPick: (o: FreeGiftOffer["options"][number]) => void;
  onClose: () => void;
}) {
  const [at, setAt] = useState(start);
  const track = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const go = (i: number, behavior: ScrollBehavior = "smooth") => {
    const el = track.current;
    const n = Math.max(0, Math.min(offer.options.length - 1, i));
    if (el) el.scrollTo({ left: n * el.clientWidth, behavior });
    setAt(n);
  };
  // Open on the tapped colour, keep the page still behind, and answer the keyboard.
  useEffect(() => {
    // `at` already starts here; only the strip needs scrolling to it.
    const el = track.current;
    if (el) el.scrollTo({ left: start * el.clientWidth, behavior: "instant" });
    closeBtn.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(at + 1);
      if (e.key === "ArrowLeft") go(at - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  const o = offer.options[at] ?? offer.options[0];
  const isChosen = Boolean(chosenId) && chosenId === o?.variantId;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`${offer.title}: photos`} className="fixed inset-0 z-[80] flex flex-col bg-ink text-ivory transition-opacity duration-200 starting:opacity-0">
      <div className="container-page flex items-start gap-3 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3">
        <div className="min-w-0 flex-1 pt-2" aria-live="polite">
          <p className="text-[0.7rem] font-semibold tracking-[0.14em] text-zari-light uppercase">Free gift</p>
          <p className="font-display text-xl leading-tight md:text-2xl">{offer.title}</p>
          <p className="mt-0.5 text-sm text-ivory/70">
            {[o?.variantId ? o.name : null, o?.stock !== undefined && o.stock <= 1 ? "Last one" : null, `${at + 1} of ${offer.options.length}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <button
          ref={closeBtn}
          type="button"
          onClick={onClose}
          className="grid size-12 shrink-0 place-items-center rounded-full bg-ivory/10 backdrop-blur transition hover:bg-ivory/20"
          aria-label="Close photos"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={track}
          className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-contain"
          style={{ touchAction: "pan-x pinch-zoom" }}
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== at) setAt(i);
          }}
          aria-roledescription="carousel"
        >
          {offer.options.map((x, i) => (
            <div key={x.variantId ?? i} className="relative h-full w-full shrink-0 snap-center" aria-roledescription="slide" aria-label={`${i + 1} of ${offer.options.length}`}>
              {x.image?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={x.image.url} alt={x.image.alt ?? `${offer.title}, ${x.name}`} className="absolute inset-0 h-full w-full object-contain" />
              ) : (
                <div className="absolute inset-x-6 inset-y-10 overflow-hidden rounded-lg">
                  <ProductImage image={x.image} sizes="100vw" />
                </div>
              )}
            </div>
          ))}
        </div>
        {offer.options.length > 1 && (
          <>
            <button type="button" onClick={() => go(at - 1)} disabled={at === 0} className="absolute top-1/2 left-3 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-ivory/10 backdrop-blur transition hover:bg-ivory/20 disabled:opacity-30 md:grid" aria-label="Previous colour">
              ‹
            </button>
            <button type="button" onClick={() => go(at + 1)} disabled={at === offer.options.length - 1} className="absolute top-1/2 right-3 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-ivory/10 backdrop-blur transition hover:bg-ivory/20 disabled:opacity-30 md:grid" aria-label="Next colour">
              ›
            </button>
          </>
        )}
      </div>

      <div className="container-page flex items-center gap-3 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto" role="tablist" aria-label="Colours">
          {offer.options.map((x, i) => (
            <button
              key={x.variantId ?? i}
              type="button"
              role="tab"
              aria-selected={i === at}
              onClick={() => go(i)}
              className={`relative size-11 shrink-0 overflow-hidden rounded-md bg-sand ${i === at ? "ring-2 ring-zari-light" : "opacity-60"}`}
              aria-label={x.name}
            >
              <ProductImage image={x.image} sizes="44px" />
            </button>
          ))}
        </div>
        {o && (
          <button type="button" onClick={() => (isChosen ? onClose() : onPick(o))} className="shrink-0 rounded-full bg-rani px-5 py-3 text-sm font-medium text-ivory transition hover:bg-accent-dark">
            {isChosen ? "Keep this one" : "Choose this one"}
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
