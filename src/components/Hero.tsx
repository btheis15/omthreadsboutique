import Link from "next/link";
import type { ProductImage as Img } from "@/lib/types";
import { ArrowIcon } from "./icons";
import { Mandala } from "./ornaments";
import { ProductImage } from "./ProductImage";

type Props = { title: string; subtitle: string; image?: Img; videoUrl?: string; poster?: string };

/** Full-bleed hero: slow Ken Burns photo (or looping video), rising headline, turning mandala. */
export function Hero({ title, subtitle, image, videoUrl, poster }: Props) {
  const words = title.split(" ");
  return (
    <section className="relative isolate h-[82svh] min-h-[520px] overflow-hidden bg-indigo-deep text-ivory md:h-[88vh]">
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
        ) : (
          <div className="animate-kenburns absolute inset-0">
            <ProductImage image={image} sizes="100vw" preload />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-deep via-indigo-deep/45 to-indigo-deep/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-deep/60 to-transparent" />
      </div>

      <Mandala className="animate-spin-slow pointer-events-none absolute -top-24 -right-32 -z-10 size-[26rem] text-zari-light/25 md:-top-32 md:right-[-8rem] md:size-[44rem]" />

      <div className="container-page flex h-full flex-col justify-end pb-14 md:pb-24">
        <p className="animate-rise font-deva text-xl text-zari-light md:text-2xl" style={{ "--i": 0 } as React.CSSProperties}>
          स्वागत है
        </p>
        <h1 className="mt-3 max-w-3xl text-[2.9rem] leading-[1] md:text-7xl lg:text-[5.5rem]">
          {words.map((w, i) => (
            <span key={i} className="animate-rise inline-block" style={{ "--i": i + 1 } as React.CSSProperties}>
              {w}
              {i < words.length - 1 && " "}
            </span>
          ))}
        </h1>
        <p
          className="animate-rise mt-5 max-w-lg text-[1.05rem] text-ivory/85 md:text-lg"
          style={{ "--i": words.length + 1 } as React.CSSProperties}
        >
          {subtitle}
        </p>
        <div
          className="animate-rise mt-8 flex flex-wrap gap-3"
          style={{ "--i": words.length + 2 } as React.CSSProperties}
        >
          <Link href="/shop" className="btn bg-ivory text-ink hover:bg-zari-light">
            Shop the collection <ArrowIcon size={18} />
          </Link>
          <Link href="/crafts" className="btn border border-ivory/60 text-ivory hover:bg-ivory/10">
            Discover the crafts
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 md:block" aria-hidden="true">
        <span className="block h-12 w-px animate-pulse bg-gradient-to-b from-transparent to-zari-light" />
      </div>
    </section>
  );
}
