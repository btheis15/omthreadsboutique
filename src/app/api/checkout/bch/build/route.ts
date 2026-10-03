import { bchWalletRoute } from "@/lib/bchWalletProxy";

/** The payment as one transaction (the BCH and any tokens) for the wallet to sign. */
export const POST = bchWalletRoute("/api/checkout/bch/build", ["address", "category", "amount"], "Couldn't prepare the payment. Please try again.");
