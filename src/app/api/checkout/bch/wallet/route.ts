import { bchWalletRoute } from "@/lib/bch/proxy";

/** What the shopper's connected wallet holds that this order can use. */
export const POST = bchWalletRoute("/api/checkout/bch/wallet", ["address"], "Couldn't read your wallet. Please try again.");
