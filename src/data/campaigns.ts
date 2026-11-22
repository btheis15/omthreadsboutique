/**
 * Ad campaign landing pages: /go/<slug>. One entry per Meta / Instagram ad (or ad set).
 * Everything shown on the page comes from the live catalog and Site settings; only the headline and sub-line
 * are written here, by the owner. To add a campaign, add an entry below and deploy.
 *
 *   slug          the address: /go/<slug> (lowercase letters, digits and dashes)
 *   headline      the big line over the photo
 *   sub           one short line under it (optional)
 *   productSlugs  the pieces to show, in order (their slugs from the shop; unknown ones are skipped)
 *   color         the color chosen first, e.g. "Teal" (optional; otherwise the first one in stock)
 *   coupon        a coupon code the checkout link carries along (optional)
 */
export type Campaign = {
  slug: string;
  headline: string;
  sub?: string;
  productSlugs: string[];
  color?: string;
  coupon?: string;
};

/** Shown only while developing (`next dev`), never in a production build, and labelled on the page. */
export const SAMPLE_CAMPAIGN: Campaign = {
  slug: "sample",
  headline: "A shawl for the cold months",
  sub: "Soft, warm and made by hand.",
  productSlugs: ["reversible-kani-jaal-shawl"],
  color: "Plum",
};

const live: Campaign[] = [];

export const campaigns: Campaign[] = process.env.NODE_ENV === "production" ? live : [...live, SAMPLE_CAMPAIGN];

export const campaignBySlug = (slug: string) => campaigns.find((c) => c.slug === slug);
