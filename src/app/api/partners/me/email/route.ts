import { partnerRoute } from "@/lib/partners";

/** Adds the partner's email (we send a link to confirm it). */
export const POST = partnerRoute("/api/partners/me/email", ["key", "email"], "Couldn't save your email just now. Please try again.");
