import { bchWalletRoute } from "@/lib/bchWalletProxy";

/** A reward (the shop's tokens) claimed to the shopper's wallet, from the order page. */
export const POST = bchWalletRoute("/api/checkout/bch/claim", ["address"], "Couldn't claim it just now. Please try again.");
