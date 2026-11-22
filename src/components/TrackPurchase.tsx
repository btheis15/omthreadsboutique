"use client";

import { useEffect } from "react";
import { lastCheckoutEventId, markPurchaseSent } from "@/lib/attribution";
import { track } from "@/lib/track";

/**
 * Meta Pixel Purchase on the thank-you page of a PAID live order (renders nothing). It uses the same event id the
 * shop stored for the order, so Meta counts the sale once even though the shop reports it too (Conversions API).
 * Without a known id nothing is sent from the browser (the shop's own report still counts it).
 */
export function TrackPurchase({ orderKey, eventId, value, contentIds, numItems }: { orderKey: string; eventId?: string; value: number; contentIds?: string[]; numItems: number }) {
  useEffect(() => {
    const id = eventId ?? lastCheckoutEventId();
    if (!id || !markPurchaseSent(orderKey)) return;
    track(
      "Purchase",
      { value, currency: "USD", num_items: numItems, content_type: "product", ...(contentIds?.length ? { content_ids: contentIds } : {}) },
      id,
    );
  }, [orderKey, eventId, value, contentIds, numItems]);
  return null;
}
