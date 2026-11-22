"use client";

import { useEffect, useState } from "react";
import type { ProductImage as Img } from "@/lib/types";
import { ProductImage } from "./ProductImage";

const SECONDS = 6;

/** Cross-fades the hero photos (about 6 seconds each). Visitors who prefer reduced motion see the first photo only. */
export function HeroSlides({ images }: { images: Img[] }) {
  const [active, setActive] = useState(0);
  // Speed: only the first photo is in the page until it has finished loading. The others sat invisible (opacity 0) but
  // still downloaded at the same time, competing with the first photo on a slow phone connection.
  const [rest, setRest] = useState(false);
  useEffect(() => {
    if (images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let id: number | undefined;
    const start = () => {
      setRest(true);
      id = window.setInterval(() => setActive((i) => (i + 1) % images.length), SECONDS * 1000);
    };
    // After the page (including the first photo) has loaded, then the slideshow starts as before.
    let wait: number | undefined;
    const onLoad = () => (wait = window.setTimeout(start, 500));
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => {
      window.removeEventListener("load", onLoad);
      window.clearTimeout(wait);
      window.clearInterval(id);
    };
  }, [images.length]);
  return (
    <>
      {images.map((img, i) => (i > 0 && !rest ? null : (
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
      )))}
    </>
  );
}
