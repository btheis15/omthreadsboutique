"use client";

import { useEffect, useState } from "react";
import type { ProductImage as Img } from "@/lib/types";
import { ProductImage } from "./ProductImage";

const SECONDS = 6;

/** Cross-fades the hero photos (about 6 seconds each). Visitors who prefer reduced motion see the first photo only. */
export function HeroSlides({ images }: { images: Img[] }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % images.length), SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [images.length]);
  return (
    <>
      {images.map((img, i) => (
        <div
          key={img.url ?? i}
          className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out motion-reduce:transition-none"
          style={{ opacity: i === active ? 1 : 0 }}
          aria-hidden={i !== active}
        >
          <div className="animate-kenburns absolute inset-0">
            <ProductImage image={img} sizes="100vw" preload={i === 0} />
          </div>
        </div>
      ))}
    </>
  );
}
