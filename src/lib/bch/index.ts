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
    lines: { kind: "items" | "tokens" | "coupon" | "shipping" | "tax"; label: string; bch: string; cents: number; tokens?: string; each?: string }[];
    total: { bch: string; cents: number };
  } | null;
  /** The admin can take the payment from a connected wallet ("Connect wallet": the BCH and any tokens in one transaction). */
  walletPay?: boolean;
  /** The order's reward (the shop's tokens, cash back), once it's paid and earned one. */
  reward?: BchReward | null;
  /** The rewards promotion running while it's being paid ("earn 1 OMT for every 0.1 BCH"). */
  rewardOffer?: { label: string; symbol: string | null; decimals: number; perBch: number; tokens: number; maxPerOrder: number | null; endsOn: string | null } | null;
  /** What paying this order earns under that promotion ("1 OMT"), worked out by the admin (null for nothing). */
  rewardEarns?: string | null;
  /** The receipt as an Om Receipt CashToken, once paid (if the shopper chose one), and how they chose to get it. */
  receiptToken?: BchReceiptToken | null;
  receiptPref?: "email" | "token" | "both";
  /** The coupon taken off this order (`bch`: what BCH-valued tokens took off, e.g. "0.03"). */
  applied: { label: string; discountCents: number; bch?: string } | null;
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
  tokens: { category: string; label: string; symbol: string | null; decimals: number; value: number; have: string; max: string; useful: string; haveText: string; maxText: string }[];
};

/** The amount to pay with some tokens taken off, and the order in BCH. */
export type BchQuote = { amountBch: string; tokens: { category: string; amount: string; text: string } | null; breakdown: BchPayment["breakdown"]; rewardEarns?: string | null };

/**
 * A reward: `sending` (on its way to the wallet that paid, or the one it was claimed to), `sent`, `claimable`
 * (paid from a wallet the shop can't send tokens to safely: the shopper claims it), or `expired` (not claimed in time).
 */
export type BchReward = { text: string; label: string; rule: string; state: "sending" | "sent" | "claimable" | "expired"; to: string | null; txUrl: string | null; claimUntil: string | null };

/**
 * The receipt as a CashToken: `sending` (being minted and sent to the wallet that paid, or the one it was claimed
 * to), `sent`, `claimable` (paid from a wallet that can't safely be sent tokens), or `expired` (not claimed in time).
 * `receipt` is what it shows: public on the blockchain, so nothing personal.
 */
export type BchReceiptToken = {
  name: string;
  state: "sending" | "sent" | "claimable" | "expired";
  to: string | null;
  txUrl: string | null;
  claimUntil: string | null;
  icon: string | null;
  receipt: {
    shop: string;
    order: string;
    date: string;
    items: { title: string; qty: number; cents: number }[];
    subtotalCents: number;
    discount: { label: string; cents: number; tokens?: string } | null;
    shippingCents: number;
    taxCents: number;
    totalCents: number;
    paidBch: string;
    tx: string | null;
    test?: boolean;
  };
};
