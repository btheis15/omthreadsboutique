import { partnerRoute } from "@/lib/partners";

/** A link from one of our emails: confirms the email or a new payout address, or signs the partner in. */
export const POST = partnerRoute("/api/partners/confirm", ["token"], "This link didn't work. Ask for a new one.");
