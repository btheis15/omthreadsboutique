"use client";

import Image, { type ImageLoader } from "next/image";
import type { ProductImage as Img } from "@/lib/types";
import { Swatch } from "./Swatch";

/** Sanity's CDN resizes and converts images itself, so skip Next's optimizer. */
const sanityLoader: ImageLoader = ({ src, width, quality }) => {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  if (!url.searchParams.has("auto")) url.searchParams.set("auto", "format");
  return url.toString();
};

export function ProductImage({
  image,
  sizes,
  preload,
  className = "",
}: {
  image?: Img;
  sizes: string;
  preload?: boolean;
  className?: string;
}) {
  if (image?.url) {
    return (
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes={sizes}
        preload={preload}
        loader={image.url.includes("cdn.sanity.io") ? sanityLoader : undefined}
        placeholder={image.lqip ? "blur" : "empty"}
        blurDataURL={image.lqip}
        className={`object-cover ${className}`}
      />
    );
  }
  const s = image?.swatch ?? { base: "#e8e0d2", accent: "#b9a88c", pattern: "weave" as const };
  return (
    <div role="img" aria-label={image?.alt ?? "Product image"} className={`absolute inset-0 ${className}`}>
      <Swatch {...s} className="h-full w-full" />
    </div>
  );
}
