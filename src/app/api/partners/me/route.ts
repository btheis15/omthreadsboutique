import { partnerRoute } from "@/lib/partners";

/** The partner's own page: their link, sales and commissions (read with their page key). */
export const POST = partnerRoute("/api/partners/me", ["key"], "Couldn't load your page just now. Please try again.");
