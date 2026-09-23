"use client";

import { useRef, useState } from "react";
import type { ProductImage as Img } from "@/lib/types";
import { ProductImage } from "./ProductImage";

/** Swipeable on phones (native scroll-snap), thumbnails on desktop. */
export function ProductGallery({ images, title }: { images: Img[]; title: string }) {
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const slides = images.length ? images : [{ alt: title }];

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

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
          {slides.map((img, i) => (
            <div
              key={i}
              className="relative aspect-[4/5] w-full shrink-0 snap-center bg-sand"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
            >
              <ProductImage image={img} preload={i === 0} sizes="(min-width: 768px) 50vw, 100vw" />
            </div>
          ))}
        </div>
        {slides.length > 1 && (
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-ink" : "w-1.5 bg-ink/35"}`}
              />
            ))}
          </div>
        )}
      </div>
      {slides.length > 1 && (
        <div className="hidden w-20 shrink-0 flex-col gap-3 md:flex">
          {slides.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-[4/5] overflow-hidden rounded-md bg-sand ring-offset-2 ring-offset-ivory transition ${
                i === active ? "ring-1 ring-ink" : "opacity-70 hover:opacity-100"
              }`}
            >
              <ProductImage image={img} sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
