import { partnerRoute } from "@/lib/partners";

/** A new payout address (confirmed by email when they have one). */
export const POST = partnerRoute("/api/partners/me/address", ["key", "address"], "Couldn't save the address just now. Please try again.");
