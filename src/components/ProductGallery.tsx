"use client";

import { useEffect, useRef, useState, ViewTransition } from "react";
import type { ProductImage as Img } from "@/lib/types";
import { SELECT_VARIANT_EVENT, SHOW_IMAGE_EVENT } from "@/lib/variants";
import { CloseIcon } from "./icons";
import { LiveMotion } from "./LiveMotion";
import { ProductImage } from "./ProductImage";

type Clip = { url: string; poster?: string; color?: string };
type Slide = { kind: "image"; image: Img } | { kind: "video"; url: string; poster?: string };

/**
 * Swipeable on phones (native scroll-snap), thumbnails on desktop, tap to open
 * a full-screen viewer with pinch-to-zoom. The first photo morphs in from the
 * product card via a shared view transition.
 */
export function ProductGallery({
  images,
  title,
  videos: allVideos = [],
  initialValues = [],
  vtName,
}: {
  images: Img[];
  title: string;
  videos?: Clip[];
  /** The option values picked when the page opens (the default color) */
  initialValues?: string[];
  vtName: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const track = useRef<HTMLDivElement>(null);

  // Photos and videos are shown separately: a Photos / Videos switch appears when a piece has both.
  const [view, setView] = useState<"photos" | "videos">("photos");
  // A video made for one color shows only while that color is picked; the others show for every color.
  const [picked, setPicked] = useState<string[]>(initialValues);
  useEffect(() => {
    const onPick = (e: Event) => {
      setPicked((e as CustomEvent<{ values: string[] }>).detail?.values ?? []);
      // Another color's videos start from the first one.
      if (view === "videos") requestAnimationFrame(() => track.current?.scrollTo({ left: 0 }));
    };
    window.addEventListener(SELECT_VARIANT_EVENT, onPick);
    return () => window.removeEventListener(SELECT_VARIANT_EVENT, onPick);
  }, [view]);
  const videos = allVideos.filter((v) => !v.color || picked.includes(v.color));
  const pendingSlide = useRef(0);
  const showVideos = view === "videos" && videos.length > 0;
  const slides: Slide[] = showVideos
    ? videos.map((v): Slide => ({ kind: "video", url: v.url, poster: v.poster }))
    : (images.length ? images : [{ alt: title }]).map((image) => ({ kind: "image", image }));

  // Switching sets the gallery back to its first slide (or the photo an option asked for).
  useEffect(() => {
    const to = pendingSlide.current;
    pendingSlide.current = 0;
    track.current?.scrollTo({ left: to * (track.current?.clientWidth ?? 0) });
    setActive(to);
  }, [view]);
  const switchTo = (v: "photos" | "videos") => {
    track.current?.querySelectorAll("video").forEach((el) => el.pause());
    setView(v);
  };

  const goTo = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // Picking an option (e.g. a colour) with its own photo shows that photo.
  useEffect(() => {
    const onShow = (e: Event) => {
      const url = (e as CustomEvent<{ url: string }>).detail?.url;
      const i = images.findIndex((img) => img.url === url);
      const el = track.current;
      if (i < 0 || !el) return;
      // Looking at the videos: go back to the photos, then to that photo.
      if (view === "videos") {
        pendingSlide.current = i;
        switchTo("photos");
      } else el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    };
    window.addEventListener(SHOW_IMAGE_EVENT, onShow);
    return () => window.removeEventListener(SHOW_IMAGE_EVENT, onShow);
  }, [images, view]);

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
        {videos.length > 0 && (
          <div className="mb-3 flex gap-2 px-4 md:px-0" role="tablist" aria-label="Photos and videos">
            {(["photos", "videos"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => switchTo(v)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  view === v ? "border-ink bg-ink text-ivory" : "border-ink/25 text-ink/70 hover:border-ink"
                }`}
              >
                {v === "photos" ? `Photos (${images.length})` : `Videos (${videos.length})`}
              </button>
            ))}
          </div>
        )}
        <div
          ref={track}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto md:rounded-lg"
          onScroll={(e) => {
            const el = e.currentTarget;
            const i = Math.round(el.scrollLeft / el.clientWidth);
            if (i !== active) {
              // A video that is swiped away stops playing.
              el.querySelectorAll("video").forEach((v) => v.pause());
              setActive(i);
            }
          }}
          aria-roledescription="carousel"
          aria-label={showVideos ? `${title} videos` : `${title} photos`}
        >
          {slides.map((s, i) => {
            const inner =
              s.kind === "video" ? (
                <video
                  className="absolute inset-0 h-full w-full bg-ink object-contain"
                  src={s.url}
                  poster={s.poster ?? images[0]?.url}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={`${title} video`}
                />
              ) : (
                <>
                  <button
                    type="button"
                    className="absolute inset-0 cursor-zoom-in"
                    onClick={() => setZoom(zoomImages.indexOf(s))}
                    aria-label={`Enlarge photo ${i + 1}`}
                  >
                    <ProductImage image={s.image} preload={i === 0} sizes="(min-width: 768px) 50vw, 100vw" className="max-md:!object-contain" />
                  </button>
                  {s.image.live && <LiveMotion src={s.image.live} className="pointer-events-none [&_button]:pointer-events-auto" />}
                </>
              );
            const slide = (
              <div
                className="relative aspect-[4/5] max-h-[32svh] w-full shrink-0 snap-center overflow-hidden bg-sand md:max-h-none"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${slides.length}`}
              >
                {inner}
              </div>
            );
            return i === 0 && !showVideos ? (
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
              {s.kind === "image" || !s.poster ? (
                <ProductImage image={s.kind === "image" ? s.image : images[0]} sizes="80px" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.poster} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />
              )}
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
