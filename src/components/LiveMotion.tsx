"use client";

import { useEffect, useRef, useState } from "react";

/**
 * An iPhone-style Live Photo: when the photo comes into view its short silent clip plays once over the
 * still, then fades back to it. Hover (desktop) or the LIVE button plays it again. Under "reduce motion"
 * it only plays on the button. Sits on top of the photo and never blocks taps on it.
 */
export function LiveMotion({ src, className = "" }: { src: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const played = useRef(false);
  const [playing, setPlaying] = useState(false);

  const play = () => {
    const v = video.current;
    if (!v) return;
    v.currentTime = 0;
    setPlaying(true);
    v.play().catch(() => setPlaying(false));
  };

  // Once, the first time at least 60% of the photo is on screen.
  useEffect(() => {
    const el = box.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !played.current) {
          played.current = true;
          play();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    // Hover on the photo (a mouse; touch uses the LIVE button) plays it again.
    const photo = el.parentElement;
    const onEnter = (e: PointerEvent) => e.pointerType === "mouse" && video.current?.paused && play();
    photo?.addEventListener("pointerenter", onEnter);
    return () => {
      io.disconnect();
      photo?.removeEventListener("pointerenter", onEnter);
    };
  }, []);

  return (
    <div ref={box} className={`absolute inset-0 ${className}`}>
      <video
        ref={video}
        src={src}
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        onEnded={() => setPlaying(false)}
        className={`pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-500 ${playing ? "opacity-100" : "opacity-0"}`}
      />
      <button
        type="button"
        onClick={play}
        aria-label="Play this photo's motion"
        className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-ink/45 px-2.5 py-1 text-[11px] font-medium tracking-wider text-ivory backdrop-blur"
      >
        <span aria-hidden="true" className={`inline-block size-2.5 rounded-full border border-ivory ${playing ? "bg-ivory" : ""}`} />
        LIVE
      </button>
    </div>
  );
}
