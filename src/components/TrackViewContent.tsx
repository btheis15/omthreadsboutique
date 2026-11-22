"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/track";

/** Meta Pixel ViewContent for a product page (renders nothing). The slug is the product's Meta catalog content id. */
export function TrackViewContent({ slug, title, price }: { slug: string; title: string; price: number }) {
  const sent = useRef<string | null>(null);
  useEffect(() => {
    if (sent.current === slug) return;
    sent.current = slug;
    track("ViewContent", { content_ids: [slug], content_type: "product", content_name: title, value: price, currency: "USD" });
  }, [slug, title, price]);
  return null;
}
