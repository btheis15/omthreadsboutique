import { partnerRoute } from "@/lib/partners";

/** "Email me my page": a sign-in link, to an email the partner has confirmed. */
export const POST = partnerRoute("/api/partners/signin", ["email"], "Couldn't send it just now. Please try again.");
