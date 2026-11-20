"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { PiecePhotos } from "@/app/api/piece-photos/route";
import type { CartItem } from "@/components/cart/store";
import { ChevronIcon, CloseIcon } from "@/components/icons";
import { ProductImage } from "@/components/ProductImage";
import { formatPrice } from "@/lib/site";
import type { ProductImage as Img } from "@/lib/types";

type Slide = { item: number; image: Img };

/**
 * A line's photos, starting with the one the cart has (the colour being bought). Photos that belong to
 * the piece's other colours are left out, so the shopper only sees what's coming.
 */
export function photosFor(item: CartItem, info?: PiecePhotos): Img[] {
  const first = item.image;
  if (!info) return first ? [first] : [];
  const others = new Set(Object.entries(info.optionImages).filter(([id]) => id !== item.variantId).map(([, url]) => url));
  const rest = info.images.filter((img) => img.url !== first?.url && !(img.url && others.has(img.url)));
  return first ? [first, ...rest] : rest;
}

/**
 * Full-screen look at the order before paying: every piece's photos in one swipeable row (a piece's photos
 * together, in cart order), with its name, colour, price and a few facts. With more than one piece, small
 * photos at the bottom jump between them. Double-tap (or click) a photo to zoom in; Esc, ✕ or the
 * arrows/keys work on a computer.
 */
export function PiecePhotosViewer({
  items,
  photos,
  start,
  startPhoto = 0,
  onClose,
}: {
  items: CartItem[];
  photos: Record<string, PiecePhotos>;
  /** Which line was tapped. */
  start: number;
  /** Which of that line's photos to open on. */
  startPhoto?: number;
  onClose: () => void;
}) {
  const slides: Slide[] = items.flatMap((item, i) => photosFor(item, photos[item.slug]).map((image) => ({ item: i, image })));
  const firstOf = (item: number) => Math.max(0, slides.findIndex((s) => s.item === item));
  const [at, setAt] = useState(() => firstOf(start) + startPhoto);
  const [zoomed, setZoomed] = useState<{ slide: number; x: number; y: number } | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const go = (i: number, behavior: ScrollBehavior = "smooth") => {
    const el = track.current;
    if (!el) return;
    setZoomed(null);
    el.scrollTo({ left: Math.max(0, Math.min(i, slides.length - 1)) * el.clientWidth, behavior });
  };

  // Open on the tapped piece, keep the page still behind, and answer the keyboard.
  useEffect(() => {
    go(firstOf(start) + startPhoto, "instant");
    closeBtn.current?.focus();
    const scrollY = window.scrollY;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      window.scrollTo({ top: scrollY });
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

  const current = slides[at] ?? slides[0];
  const item = current ? items[current.item] : items[start];
  const info = item ? photos[item.slug] : undefined;
  const ofPiece = slides.filter((s) => s.item === current?.item);
  const inPiece = ofPiece.indexOf(current);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Photos of your order`} className="fixed inset-0 transition-opacity duration-200 starting:opacity-0 z-[60] flex flex-col bg-ink text-ivory">
      {/* The piece on screen */}
      <div className="container-page flex items-start gap-3 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3">
        <div className="min-w-0 flex-1 pt-2" aria-live="polite">
          <p className="truncate font-display text-xl md:text-2xl">{item?.title}</p>
          <p className="mt-0.5 text-sm text-ivory/70">
            {[item?.option, item && `Qty ${item.qty} · ${formatPrice(item.price * item.qty)}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <button
          ref={closeBtn}
          type="button"
          onClick={onClose}
          className="grid size-12 shrink-0 place-items-center rounded-full bg-ivory/10 backdrop-blur transition hover:bg-ivory/20"
          aria-label="Close photos"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Every photo of every piece, one row */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={track}
          className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto overscroll-contain"
          style={{ touchAction: zoomed ? "none" : "pan-x pinch-zoom" }}
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== at) {
              setAt(i);
              setZoomed(null);
            }
          }}
          aria-roledescription="carousel"
        >
          {slides.map((s, i) => {
            const z = zoomed?.slide === i ? zoomed : null;
            return (
              <div key={`${s.item}-${s.image.url ?? i}`} className="relative h-full w-full shrink-0 snap-center overflow-hidden" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`}>
                <button
                  type="button"
                  className={`absolute inset-0 ${z ? "cursor-zoom-out" : "cursor-zoom-in"}`}
                  aria-label={z ? "Zoom out" : "Zoom in"}
                  onClick={(e) => {
                    // A tap on a phone zooms with the double-tap below; a click on a computer zooms right away.
                    if (e.detail === 0 || window.matchMedia("(hover: hover)").matches) toggle(e, i);
                  }}
                  onDoubleClick={(e) => {
                    if (!window.matchMedia("(hover: hover)").matches) toggle(e, i);
                  }}
                  onPointerMove={(e) => {
                    if (!z) return;
                    const r = e.currentTarget.getBoundingClientRect();
                    setZoomed({ slide: i, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
                  }}
                >
                  <div
                    className="absolute inset-0 transition-transform duration-300 ease-out"
                    style={z ? { transform: "scale(2.2)", transformOrigin: `${z.x}% ${z.y}%` } : undefined}
                  >
                    <ProductImage image={s.image} sizes="100vw" preload={Math.abs(i - at) <= 1} className="!object-contain" />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(at - 1)}
              disabled={at === 0}
              className="absolute top-1/2 left-4 hidden size-12 -translate-y-1/2 rotate-180 place-items-center rounded-full bg-ivory/10 backdrop-blur transition hover:bg-ivory/20 disabled:opacity-0 md:grid"
              aria-label="Previous photo"
            >
              <ChevronIcon />
            </button>
            <button
              type="button"
              onClick={() => go(at + 1)}
              disabled={at === slides.length - 1}
              className="absolute top-1/2 right-4 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-ivory/10 backdrop-blur transition hover:bg-ivory/20 disabled:opacity-0 md:grid"
              aria-label="Next photo"
            >
              <ChevronIcon />
            </button>
          </>
        )}
      </div>

      {/* Facts, where this photo is, and the other pieces */}
      <div className="container-page pt-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="min-w-0 truncate text-ivory/75">{info?.details.join(" · ")}</p>
          {ofPiece.length > 1 && (
            <p className="shrink-0 text-ivory/60 tabular-nums">
              {inPiece + 1} / {ofPiece.length}
            </p>
          )}
        </div>
        {items.length > 1 ? (
          <div className="mt-3">
            <p className="text-[0.7rem] font-semibold tracking-[0.16em] text-zari-light uppercase">In your order</p>
            <ul className="no-scrollbar mt-2 flex gap-2.5 overflow-x-auto">
              {items.map((it, i) => (
                <li key={it.key} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => go(firstOf(i))}
                    aria-label={`${it.title}${it.option ? `, ${it.option}` : ""}`}
                    aria-current={current?.item === i}
                    className={`relative block aspect-[4/5] w-14 overflow-hidden rounded-md bg-sand transition ${
                      current?.item === i ? "ring-2 ring-zari-light ring-offset-2 ring-offset-ink" : "opacity-55 hover:opacity-90"
                    }`}
                  >
                    <ProductImage image={it.image} sizes="56px" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          ofPiece.length > 1 && (
            <div className="mt-3 flex justify-center gap-1.5">
              {ofPiece.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(firstOf(current.item) + i)}
                  aria-label={`Photo ${i + 1}`}
                  aria-current={i === inPiece}
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === inPiece ? "w-6 bg-ivory" : "w-1.5 bg-ivory/45"}`}
                />
              ))}
            </div>
          )
        )}
        <p className="mt-3 text-center text-xs text-ivory/50">
          {slides.length > 1 ? "Swipe for more · " : ""}<span className="md:hidden">Double-tap</span><span className="hidden md:inline">Click</span> to zoom ·{" "}
          {item && (
            <Link href={`/product/${item.slug}`} className="underline underline-offset-2 hover:text-ivory">
              Full details
            </Link>
          )}
        </p>
      </div>
    </div>
  );

  function toggle(e: React.MouseEvent<HTMLButtonElement>, i: number) {
    if (zoomed?.slide === i) return setZoomed(null);
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.detail === 0 ? 50 : ((e.clientX - r.left) / r.width) * 100;
    const y = e.detail === 0 ? 50 : ((e.clientY - r.top) / r.height) * 100;
    setZoomed({ slide: i, x, y });
  }
}
