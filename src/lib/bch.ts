/** A Bitcoin Cash payment as the admin describes it (the thank-you page's order summary). */
export type BchPayment = {
  /**
   * waiting: nothing sent yet · partial: less than asked arrived (amountBch is what's left) ·
   * arrived: paid, accepted in a few seconds (once no double-spend proof turns up) · paid ·
   * checking: the network saw a double-spend attempt, so it waits for a block ·
   * expired: the price ran out with nothing sent · expired_partial: it ran out after part was sent
   */
  state: "waiting" | "partial" | "arrived" | "paid" | "checking" | "expired" | "expired_partial";
  address: string | null;
  /** What to send now, in BCH (e.g. "0.165"). */
  amountBch: string | null;
  totalBch: string | null;
  paidBch: string | null;
  /** bitcoincash:… link with the amount, for "open in wallet" and the QR code. */
  uri: string | null;
  /** What the BCH amount is worth (the order's total, or the small test amount). */
  usdCents: number;
  expiresAt: string | null;
  minutes: number;
  canRenew: boolean;
  txUrl: string | null;
  /** CashTokens coupons the shopper can send (to the order's token address) before paying. */
  coupon: { address: string; uri: string; coupons: { label: string; off: string; send: string }[] } | null;
  /** The coupon taken off this order. */
  applied: { label: string; discountCents: number } | null;
};

// Wallets that pay Bitcoin Cash links (and hold CashTokens).
export const BCH_WALLETS = [
  { name: "Selene", url: "https://selene.cash" },
  { name: "Paytaca", url: "https://www.paytaca.com" },
  { name: "Cashonize", url: "https://cashonize.com" },
  { name: "Electron Cash", url: "https://electroncash.org" },
] as const;
