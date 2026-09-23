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

/**
 * Photos from the Om Threads admin (served at /media/<id>/<max>.webp) come in
 * fixed widths; pick the smallest one at least as wide as requested.
 */
const ADMIN_WIDTHS = [320, 480, 640, 828, 1080, 1280, 1600, 2048];
const ADMIN_IMAGE = /^\/media\/([0-9a-f-]{36})\/(\d+)\.webp$/;
const adminLoader: ImageLoader = ({ src, width }) => {
  const [, id, max] = src.match(ADMIN_IMAGE)!;
  const largest = Number(max);
  const w = ADMIN_WIDTHS.find((x) => x >= width && x < largest) ?? largest;
  return `/media/${id}/${w}.webp`;
};

function loaderFor(url: string): ImageLoader | undefined {
  if (url.includes("cdn.sanity.io")) return sanityLoader;
  if (ADMIN_IMAGE.test(url)) return adminLoader;
  return undefined;
}

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
        loader={loaderFor(image.url)}
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
