import { partnerRoute } from "@/lib/partners";

/** Anyone signs up to sell for the shop: their link, and the key to their own page. */
export const POST = partnerRoute("/api/partners/signup", ["name", "address", "email", "country", "mailingAddress", "usPerson", "termsVersion"], "Couldn't sign you up just now. Please try again.", ["agree", "certify"]);
