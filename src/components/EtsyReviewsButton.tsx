"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import type { EtsyReview } from "@/lib/types";

// The window's code is fetched only when someone opens it.
const Dialog = dynamic(() => import("./EtsyReviewsDialog").then((m) => m.EtsyReviewsDialog), { ssr: false });

export function EtsyReviewsButton({ reviews, etsyUrl, className, children }: { reviews: EtsyReview[]; etsyUrl: string; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)} aria-haspopup="dialog">
        {children}
      </button>
      {open && <Dialog reviews={reviews} etsyUrl={etsyUrl} onClose={() => setOpen(false)} />}
    </>
  );
}
