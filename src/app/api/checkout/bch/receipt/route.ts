import { bchWalletRoute } from "@/lib/bch/proxy";

/** An Om Receipt (the receipt as a CashToken) claimed to the shopper's wallet, from the order page. */
export const POST = bchWalletRoute("/api/checkout/bch/receipt", ["address"], "Couldn't send your receipt just now. Please try again.");
