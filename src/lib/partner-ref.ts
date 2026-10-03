/**
 * Sales partners' links (?s=<code>): the code is kept in a cookie for 30 days, and passed on with a
 * Bitcoin Cash checkout so the partner earns their commission. It only says who sent the shopper:
 * prices are the shop's, always.
 */
export const PARTNER_COOKIE = "omthreads-partner";
export const PARTNER_DAYS = 30;
export const partnerCodeOk = (code: unknown): code is string => typeof code === "string" && /^[a-z0-9-]{3,40}$/i.test(code);
