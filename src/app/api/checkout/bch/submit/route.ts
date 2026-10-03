import { bchWalletRoute } from "@/lib/bch/proxy";

/** The signed payment from the wallet: the shop checks it and sends it to the network. */
export const POST = bchWalletRoute("/api/checkout/bch/submit", ["hex"], "Couldn't send the payment. Please try again.");
