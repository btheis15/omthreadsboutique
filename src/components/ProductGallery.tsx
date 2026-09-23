"use client";

import { useEffect, useRef, useState, ViewTransition } from "react";
import type { ProductImage as Img } from "@/lib/types";
import { CloseIcon } from "./icons";
import { ProductImage } from "./ProductImage";

type Slide = { kind: "image"; image: Img } | { kind: "video"; url: string; poster?: Img };

/**
 * Swipeable on phones (native scroll-snap), thumbnails on desktop, tap to open
 * a full-screen viewer with pinch-to-zoom. The first photo morphs in from the
 * product card via a shared view transition.
 */
export function ProductGallery({
  images,
  title,
  videoUrl,
  vtName,
}: {
  images: Img[];
  title: string;
  videoUrl?: string;
  vtName: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);

  const slides: Slide[] = (images.length ? images : [{ alt: title }]).map((image) => ({ kind: "image", image }));
  if (videoUrl) slides.splice(1, 0, { kind: "video", url: videoUrl, poster: images[0] });

  const goTo = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    if (zoom === null) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(null);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [zoom]);

  const zoomImages = slides.filter((s): s is Extract<Slide, { kind: "image" }> => s.kind === "image");

  return (
    <div className="md:flex md:flex-row-reverse md:gap-4">
      <div className="relative md:flex-1">
        <div
          ref={track}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto md:rounded-lg"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== active) setActive(i);
          }}
          aria-roledescription="carousel"
          aria-label={`${title} photos`}
        >
          {slides.map((s, i) => {
            const inner =
              s.kind === "video" ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  src={s.url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={`${title} video`}
                />
              ) : (
                <button
                  type="button"
                  className="absolute inset-0 cursor-zoom-in"
                  onClick={() => setZoom(zoomImages.indexOf(s))}
                  aria-label={`Enlarge photo ${i + 1}`}
                >
                  <ProductImage image={s.image} preload={i === 0} sizes="(min-width: 768px) 50vw, 100vw" />
                </button>
              );
            const slide = (
              <div
                className="relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden bg-sand"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}`}
              >
                {inner}
              </div>
            );
            return i === 0 ? (
              <ViewTransition key={i} name={vtName} share="morph" default="none">
                {slide}
              </ViewTransition>
            ) : (
              <div key={i} className="w-full shrink-0">
                {slide}
              </div>
            );
          })}
        </div>
        {slides.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === active}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-6 bg-ivory" : "w-1.5 bg-ivory/60"} shadow`}
              />
            ))}
          </div>
        )}
      </div>

      {slides.length > 1 && (
        <div className="hidden w-20 shrink-0 flex-col gap-3 md:flex">
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-[4/5] overflow-hidden rounded-md bg-sand ring-offset-2 ring-offset-ivory transition ${
                i === active ? "ring-1 ring-ink" : "opacity-70 hover:opacity-100"
              }`}
            >
              <ProductImage image={s.kind === "image" ? s.image : s.poster} sizes="80px" />
              {s.kind === "video" && (
                <span className="absolute inset-0 grid place-items-center bg-ink/30 text-lg text-ivory" aria-hidden="true">
                  ▶
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {zoom !== null && (
        <div role="dialog" aria-modal="true" aria-label={`${title}, enlarged`} className="fixed inset-0 z-[60] bg-ink/95">
          <button
            type="button"
            onClick={() => setZoom(null)}
            className="absolute top-3 right-3 z-10 grid size-12 place-items-center rounded-full bg-ivory/10 text-ivory backdrop-blur"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
          <div className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto" style={{ touchAction: "pan-x pinch-zoom" }}>
            {zoomImages.map((s, i) => (
              <div
                key={i}
                ref={(el) => {
                  if (el && i === zoom) el.scrollIntoView({ inline: "center" });
                }}
                className="animate-rise relative h-full w-full shrink-0 snap-center"
              >
                <ProductImage image={s.image} sizes="100vw" className="!object-contain" />
              </div>
            ))}
          </div>
          <p className="pointer-events-none absolute inset-x-0 bottom-5 text-center text-sm text-ivory/70">
            Pinch to zoom · swipe for more
          </p>
        </div>
      )}
    </div>
  );
}
