"use client";

import { useEffect, useRef } from "react";
import type { EtsyReview } from "@/lib/types";
import { Stars } from "./Stars";

const fmt = (d: string) => {
  const t = Date.parse(`${d}T12:00:00Z`);
  return Number.isNaN(t) ? "" : new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
};

/** Etsy reviews window: a centered dialog on larger screens, a bottom sheet on phones. */
export function EtsyReviewsDialog({ reviews, etsyUrl, onClose }: { reviews: EtsyReview[]; etsyUrl: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="etsy-reviews-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-0 mt-auto max-h-[85dvh] w-full max-w-none overflow-hidden rounded-t-2xl bg-ivory p-0 text-ink backdrop:bg-black/50 md:m-auto md:max-w-xl md:rounded-2xl"
    >
      <div className="flex max-h-[85dvh] flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id="etsy-reviews-title" className="text-xl">Reviews from Etsy</h2>
          <button type="button" autoFocus onClick={onClose} className="-m-2 p-2 text-2xl leading-none" aria-label="Close">
            ×
          </button>
        </div>
        <ul className="divide-y divide-line overflow-y-auto px-5">
          {reviews.map((r) => (
            <li key={r.id} className="py-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <Stars rating={r.rating} />
                {r.date && <time dateTime={r.date} className="text-muted">{fmt(r.date)}</time>}
              </div>
              {r.text && <p className="mt-2 leading-relaxed">{r.text}</p>}
              <p className="mt-2 text-xs text-muted">
                Etsy buyer{r.listingTitle ? ` · ${r.listingTitle}` : ""}
              </p>
            </li>
          ))}
        </ul>
        <div className="border-t border-line px-5 py-4 text-center">
          <a href={etsyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            See all on Etsy
          </a>
        </div>
      </div>
    </dialog>
  );
}
