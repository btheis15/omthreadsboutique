import { bchWalletRoute } from "@/lib/bchWalletProxy";

/** The amount to pay with some of the shop's tokens taken off (as the slider moves). */
export const POST = bchWalletRoute("/api/checkout/bch/quote", ["category", "amount"], "Couldn't work out the price. Please try again.");
