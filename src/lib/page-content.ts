import type { ContentPage, ContentSection } from "./types";

/**
 * Wording of the Contact, "Sell for Om Threads" and Seller terms pages. The admin's feed pages (slugs `contact`,
 * `partners`, `seller-terms`) override these field by field; anything missing or blank falls back to the current
 * wording below, so the pages look the same until the owner edits something. `{name}` placeholders are filled in
 * when the page renders.
 */

const sections = (page?: ContentPage): ContentSection[] => {
  const b = page?.body;
  return Array.isArray(b) && b.length > 0 && typeof b[0] === "object" && "paragraphs" in b[0] ? (b as ContentSection[]) : [];
};
const clean = (s?: string) => (s && s.trim() ? s : undefined);
const para = (s?: ContentSection) => clean(s?.paragraphs?.find((p) => p.trim()));

export function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
}

// --- Contact -----------------------------------------------------------------------------------------------------

export type ContactContent = {
  title: string;
  intro: string;
  channels: { email: string; whatsapp: [string, string]; etsy: [string, string]; instagram: [string, string] };
};

/** Section order is fixed: Email (heading = label), WhatsApp, Etsy, Instagram (heading = label, first paragraph = caption). */
export function contactContent(page?: ContentPage): ContactContent {
  const s = sections(page);
  const pair = (i: number, label: string, caption: string): [string, string] => [clean(s[i]?.heading) ?? label, para(s[i]) ?? caption];
  return {
    title: clean(page?.title) ?? "We'd love to hear from you",
    intro:
      clean(page?.intro) ??
      "Questions about a piece, a custom order, gifting or styling? Write to us and we'll reply within one business day.",
    channels: {
      email: clean(s[0]?.heading) ?? "Email",
      whatsapp: pair(1, "WhatsApp", "Chat with us"),
      etsy: pair(2, "Message us on Etsy", "omthreadsboutique.etsy.com"),
      instagram: pair(3, "Instagram", "Follow along"),
    },
  };
}

// --- Sell for Om Threads -----------------------------------------------------------------------------------------

export type PartnersContent = {
  title: string;
  /** Placeholder: {rate} */
  intro: string;
  /** Placeholder in the text: {rate} */
  steps: [string, string][];
  closedTitle: string;
  closedText: string;
  signedUpTitle: string;
  signedUpText: string;
};

const PARTNER_STEPS: [string, string][] = [
  ["Sign up", "Your name and a Bitcoin Cash address. Your link is ready at once."],
  ["Share it", "The whole shop, or any piece: every page has your link. Anyone who shops through it within 30 days counts."],
  ["Get paid", "{rate} of what the items sell for (sale prices and coupons included; not tax or shipping), in BCH, the moment the shopper pays."],
];

/** Sections: 1-3 the steps (heading + text), 4 "Not open right now" message, 5 "Already selling with us?" line. */
export function partnersContent(page?: ContentPage): PartnersContent {
  const s = sections(page);
  return {
    title: clean(page?.title) ?? "Sell for Om Threads",
    intro:
      clean(page?.intro) ??
      "Love these pieces? Share them. Sign up for your own link, and when someone pays with Bitcoin Cash through it, {rate} of what they bought goes straight to your Bitcoin Cash wallet, the moment they pay.",
    steps: PARTNER_STEPS.map(([h, t], i) => [clean(s[i]?.heading) ?? h, para(s[i]) ?? t] as [string, string]),
    closedTitle: clean(s[3]?.heading) ?? "Not open right now",
    closedText:
      para(s[3]) ?? "Sign-ups for selling with us are closed at the moment. Please check back soon, or get in touch.",
    signedUpTitle: clean(s[4]?.heading) ?? "Already selling with us?",
    signedUpText: para(s[4]) ?? "We'll email a link to your seller page (to the email you confirmed).",
  };
}

// --- Seller terms ------------------------------------------------------------------------------------------------

export type TermsContent = {
  version: string;
  /** Digits as typed, e.g. "1999". */
  taxLimit: string;
  /** Placeholders: {shop} (shown bold), {details}, {version} */
  intro: string;
  /** Placeholders in text: {rate}, {taxLimit} (with $ and thousands separator) */
  clauses: { heading: string; text: string }[];
  closing: string;
};

export const DEFAULT_TERMS_VERSION = "2026-10e";
export const DEFAULT_TAX_LIMIT = "1999";

const TERMS_INTRO =
  "This is the agreement between {shop}{details} (“we”), and you, the sales partner named at sign-up, at the mailing address you give (“you”). Version {version}.";
const TERMS_CLAUSES: { heading: string; text: string }[] = [
  { heading: "The work.", text: "You share links to our shop and our pieces (your partner link) so people can buy from us. You choose when, where and how you share them." },
  { heading: "Your pay.", text: "For each order paid with Bitcoin Cash through your link within 30 days of the visit, you earn {rate} of the price the items sold for: the product subtotal at any sale price we're running, after any coupon, never including tax or shipping. We may give you a different rate; your seller page always shows yours." },
  { heading: "How and when you're paid.", text: "In Bitcoin Cash, to the address you give us, at the moment the shopper pays: as part of their payment, or sent by us right away, at the BCH rate they paid at. If the payment needs a block to be safe (for example a double-spend warning), we send it after one block. If an order is refunded after your commission was paid, that commission (or the refunded share of it) comes off your next commissions. Test orders earn nothing." },
  { heading: "Prices are ours.", text: "We set prices, discounts and your rate. You can't offer your own discounts, take orders or payments yourself, or make promises for us." },
  { heading: "Be honest.", text: "Say clearly that you earn a commission whenever you share your link (for example “I earn a commission from Om Threads”). No spam, and nothing untrue about us or our pieces." },
  { heading: "Taxes and the yearly limit.", text: "You're responsible for reporting and paying your own taxes on what you earn, wherever you live. If you're a US person, your commissions from us are limited to $1 less than the amount the IRS asks businesses to report (a 1099-NEC; {taxLimit} for 2026) in each calendar year. Once you reach it, sales through your link earn nothing more until January 1. One account per person: accounts that share an email, payout address or mailing address count together." },
  { heading: "Sanctions.", text: "You confirm you don't live in a country or region under US embargo and aren't on a US sanctions list. We check payout addresses against the US sanctions list and can't pay one that's on it. If that changes, stop sharing and tell us." },
  { heading: "The information you give.", text: "You confirm that what you tell us at sign-up and later (your name, country, mailing address, whether you're a US person, and that you have only one account) is true, and you'll keep it up to date. We rely on it to pay you and to meet our legal duties, and we have no way to check it. If any of it is false, or you open more than one account, you're breaking these terms: we may end your account and cancel commissions not yet paid, and you're responsible for any taxes, penalties or costs that result." },
  { heading: "Independent.", text: "You're an independent seller, not our employee or agent. Either of us can end this at any time; we can pause or remove your link. We may change these terms; the new version applies to sales after we post it." },
  { heading: "Your details.", text: "We keep your name, email, mailing address, country and payout address to run the program, pay you and meet our tax duties." },
];
const TERMS_CLOSING = "This agreement is governed by the laws of Illinois. Your seller page keeps a link to these terms and the date you agreed.";

/**
 * Sections WITH a heading are the numbered clauses (heading in bold, then text); a section WITHOUT a heading is
 * the closing line. `version` and `taxLimit` come from the feed's text keys `sellerTermsVersion` / `partnersTaxLimit`.
 */
export function termsContent(page: ContentPage | undefined, text: { version?: string; taxLimit?: string }): TermsContent {
  const s = sections(page);
  const clauses = s.filter((x) => clean(x.heading) && para(x)).map((x) => ({ heading: x.heading!, text: para(x)! }));
  const closing = para(s.find((x) => !clean(x.heading)));
  const limit = clean(text.taxLimit)?.trim().replace(/[$,\s]/g, "");
  return {
    version: clean(text.version)?.trim() ?? DEFAULT_TERMS_VERSION,
    taxLimit: limit && /^\d+$/.test(limit) ? limit : DEFAULT_TAX_LIMIT,
    intro: clean(page?.intro) ?? TERMS_INTRO,
    clauses: clauses.length ? clauses : TERMS_CLAUSES,
    closing: closing ?? TERMS_CLOSING,
  };
}

export const money = (digits: string) => `$${Number(digits).toLocaleString("en-US")}`;
