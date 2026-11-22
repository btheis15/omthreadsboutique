"use client";

import { useEffect } from "react";
import { lastCheckoutEventId, markPurchaseSent } from "@/lib/attribution";
import { track } from "@/lib/track";

/**
 * Meta Pixel Purchase on the thank-you page of a PAID live order (renders nothing). It uses the same event id the
 * shop stored for the order, so Meta counts the sale once even though the shop reports it too (Conversions API).
 * Without a known id nothing is sent from the browser (the shop's own report still counts it).
 */
const FRESH_MS = 24 * 3600 * 1000;

export function TrackPurchase({ orderKey, eventId, paidAt, value, contentIds, numItems }: { orderKey: string; eventId?: string; paidAt?: string; value: number; contentIds?: string[]; numItems: number }) {
  useEffect(() => {
    const id = eventId ?? lastCheckoutEventId();
    if (!id) return;
    // Only the visit that follows the payment reports it: a link opened days later must not send a second Purchase.
    const paidMs = paidAt ? Date.parse(paidAt) : NaN;
    if (Number.isFinite(paidMs)) {
      if (Date.now() - paidMs >= FRESH_MS) return;
    } else if (!eventId || lastCheckoutEventId() !== eventId) {
      // No payment time from the shop: only the browser that started this checkout may report it.
      return;
    }
    if (!markPurchaseSent(orderKey)) return;
    track(
      "Purchase",
      { value, currency: "USD", num_items: numItems, content_type: "product", ...(contentIds?.length ? { content_ids: contentIds } : {}) },
      id,
    );
  }, [orderKey, eventId, paidAt, value, contentIds, numItems]);
  return null;
}
