/** Checkout helpers safe for the browser (payments.ts is server-only). */

/** Shipping for a rate, with its free-over amount applied. Matches the admin's own calculation. */
export function shippingCents(rate: { cents: number; freeOverCents: number | null }, subtotalCents: number) {
  return rate.freeOverCents !== null && subtotalCents >= rate.freeOverCents ? 0 : rate.cents;
}
