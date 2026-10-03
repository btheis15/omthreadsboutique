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
  coupon: {
    address: string;
    uri: string;
    coupons: { label: string; off: string; send: string }[];
    /** Tokens each worth some BCH: any number, sent all at once or a few at a time (otherwise one coupon per order). */
    stack?: boolean;
  } | null;
  /**
   * The order in BCH at the price being held (live orders): items, coupon or tokens, shipping, sales tax and
   * the total, which is exactly what's asked. Null for a test order (it asks for the small test amount).
   */
  breakdown?: {
    usdPerBch: number;
    sources: string[];
    /** `payment`: tokens counted as a payment (sold tokens): they come after the tax, which stays on the full price. */
    lines: { kind: "items" | "tokens" | "coupon" | "shipping" | "tax"; label: string; bch: string; cents: number; tokens?: string; each?: string; payment?: boolean }[];
    /** The order's own total, when tokens paid part of it (the total below is then what's left to pay). */
    orderTotal?: { bch: string; cents: number };
    total: { bch: string; cents: number };
  } | null;
  /** The admin can take the payment from a connected wallet ("Connect wallet": the BCH and any tokens in one transaction). */
  walletPay?: boolean;
  /** The coupon taken off this order (`bch`: what BCH-valued tokens took off, e.g. "0.03"). */
  applied: { label: string; discountCents: number; bch?: string; payment?: boolean; paidCents?: number } | null;
};

// Wallets that pay Bitcoin Cash links (and hold CashTokens).
export const BCH_WALLETS = [
  { name: "Selene", url: "https://selene.cash" },
  { name: "Paytaca", url: "https://www.paytaca.com" },
  { name: "Cashonize", url: "https://cashonize.com" },
  { name: "Electron Cash", url: "https://electroncash.org" },
] as const;

/** What a connected wallet holds that the order can use (the shop's BCH-valued tokens, with how many are useful). */
export type BchWalletInfo = {
  address: string;
  bch: string;
  tokens: { category: string; label: string; symbol: string | null; decimals: number; value: number; payment?: boolean; have: string; max: string; useful: string; haveText: string; maxText: string }[];
};

/** The amount to pay with some tokens taken off, and the order in BCH. */
export type BchQuote = { amountBch: string; tokens: { category: string; amount: string; text: string } | null; breakdown: BchPayment["breakdown"] };
