/** Checkout helpers safe for the browser (payments.ts is server-only). */

/**
 * Shipping for a rate: its price for two or more items when it has one, and
 * free over its amount. Matches the admin's own calculation.
 */
export function shippingCents(rate: { cents: number; multiCents?: number | null; freeOverCents: number | null }, subtotalCents: number, itemCount = 1) {
  if (rate.freeOverCents !== null && subtotalCents >= rate.freeOverCents) return 0;
  return itemCount >= 2 && rate.multiCents !== null && rate.multiCents !== undefined ? rate.multiCents : rate.cents;
}
