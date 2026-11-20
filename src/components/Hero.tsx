import Link from "next/link";
import { Fragment } from "react";
import type { ProductImage as Img } from "@/lib/types";
import { ArrowIcon } from "./icons";
import { Mandala } from "./ornaments";
import { HeroSlides } from "./HeroSlides";
import { ProductImage } from "./ProductImage";

type Props = {
  title: string;
  subtitle: string;
  image?: Img;
  /** The slideshow (2 or more photos cross-fade; one photo is shown as is). Video still wins when set. */
  images?: Img[];
  videoUrl?: string;
  poster?: string;
  greeting: string;
  shopLabel: string;
  craftsLabel: string;
  /** Shown on the photo under the buttons (beside the text on wide screens): the Hot Sale pieces. */
  aside?: React.ReactNode;
};

/** Phones with the Hot Sale pieces: both buttons on one row. */
const btnTight = "max-sm:min-h-10 max-sm:px-4 max-sm:text-[0.85rem] max-sm:tracking-normal";

/** Full-bleed hero: slow Ken Burns photo (or looping video), rising headline, turning mandala. */
export function Hero({ title, subtitle, image, images, videoUrl, poster, greeting, shopLabel, craftsLabel, aside }: Props) {
  const words = title.split(" ");
  // Phones: tighter spacing with the Hot Sale pieces, so they fit on the first screen.
  const tight = Boolean(aside);
  return (
    <section
      className={`relative isolate flex flex-col overflow-hidden bg-indigo-deep text-ivory md:h-[88vh] md:min-h-[520px] ${
        // With the Hot Sale pieces it may grow on a small phone rather than cut anything off.
        aside ? "min-h-[82svh]" : "h-[82svh] min-h-[520px]"
      }`}
    >
      <div className="absolute inset-0 -z-10">
        {videoUrl ? (
          <video
            className="h-full w-full object-cover"
            src={videoUrl}
            poster={poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        ) : images && images.length > 1 ? (
          <HeroSlides images={images} />
        ) : (
          <div className="animate-kenburns absolute inset-0">
            <ProductImage image={images?.[0] ?? image} sizes="100vw" preload />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-deep via-indigo-deep/45 to-indigo-deep/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-deep/60 to-transparent" />
      </div>

      <Mandala className="animate-spin-slow pointer-events-none absolute -top-24 -right-32 -z-10 size-[26rem] text-zari-light/25 md:-top-32 md:right-[-8rem] md:size-[44rem]" />

      <div
        className={`container-page flex flex-1 flex-col justify-end md:flex-row md:items-end md:justify-between md:gap-12 md:pt-0 md:pb-24 ${tight ? "pt-20 pb-5" : "pb-14"}`}
      >
        <div>
          <p className="animate-rise font-deva text-xl text-zari-light md:text-2xl" style={{ "--i": 0 } as React.CSSProperties}>
            {greeting}
          </p>
          <h1 className={`max-w-3xl leading-[1] md:mt-3 md:text-7xl lg:text-[5.5rem] ${tight ? "mt-2 text-[2.5rem]" : "mt-3 text-[2.9rem]"}`}>
            {words.map((w, i) => (
              <Fragment key={i}>
                <span className="animate-rise inline-block" style={{ "--i": i + 1 } as React.CSSProperties}>
                  {w}
                </span>
                {i < words.length - 1 && " "}
              </Fragment>
            ))}
          </h1>
          <p
            className={`animate-rise max-w-lg text-ivory/85 md:mt-5 md:text-lg ${tight ? "mt-3 text-[0.95rem] leading-snug max-sm:[@media(max-height:620px)]:hidden" : "mt-5 text-[1.05rem]"}`}
            style={{ "--i": words.length + 1 } as React.CSSProperties}
          >
            {subtitle}
          </p>
          <div
            className={`animate-rise flex gap-3 md:mt-8 ${tight ? "mt-5 flex-nowrap gap-2 md:gap-3" : "mt-8 flex-wrap"}`}
            style={{ "--i": words.length + 2 } as React.CSSProperties}
          >
            <Link href="/shop" className={`btn bg-ivory text-ink hover:bg-zari-light ${tight ? btnTight : ""}`}>
              {shopLabel} <ArrowIcon size={18} className={tight ? "hidden sm:block" : undefined} />
            </Link>
            <Link href="/crafts" className={`btn border border-ivory/60 text-ivory hover:bg-ivory/10 ${tight ? btnTight : ""}`}>
              {craftsLabel}
            </Link>
          </div>
        </div>
        {aside && (
          <div className="animate-rise mt-6 md:mt-0" style={{ "--i": words.length + 3 } as React.CSSProperties}>
            {aside}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 md:block" aria-hidden="true">
        <span className="block h-12 w-px animate-pulse bg-gradient-to-b from-transparent to-zari-light" />
      </div>
    </section>
  );
}
