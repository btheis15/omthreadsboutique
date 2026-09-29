/**
 * Whether shoppers can pay on this site, and how.
 *
 * Payments run on the Om Threads admin (Mac mini): it re-checks prices and
 * stock, and hands the shopper to Stripe's page (cards, Apple Pay, Google
 * Pay, UPI) or Exodus's (USDC/USDT). No payment keys live on this site.
 *
 *  - checkout off (default): "Buy on Etsy", as before.
 *  - test: only for people who opened the tester link (a cookie); everyone
 *    else still sees "Buy on Etsy".
 *  - live: everyone can pay here; "Add to cart" becomes the main button.
 */
import "server-only";
import { createHash } from "node:crypto";
import { getCheckout } from "./catalog";
import type { CheckoutInfo } from "./types";

export type CheckoutLine = { productId: string; variantId?: string; qty: number };

/** The tester link's cookie (set by /api/tester). */
export const TESTER_COOKIE = "omthreads-tester";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** True for a tester cookie that matches the admin's current tester link. */
export function isTester(info: CheckoutInfo | null, testerKey: string | undefined) {
  return Boolean(info?.mode === "test" && info.testerHash && testerKey && sha256(testerKey) === info.testerHash);
}

/** What the checkout page offers this visitor: the checkout, or null for "buy on Etsy". */
export async function checkoutFor(testerKey: string | undefined): Promise<CheckoutInfo | null> {
  const info = await getCheckout();
  if (!info) return null;
  if (info.mode === "live") return info;
  return isTester(info, testerKey) ? info : null;
}

/** Product pages (cached for everyone): on-site checkout is the main action only once it's live. */
export async function liveCheckout(): Promise<boolean> {
  return (await getCheckout())?.mode === "live";
}
