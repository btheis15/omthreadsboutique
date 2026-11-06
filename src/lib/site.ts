import type { ProductType, SiteSettings } from "./types";

export const site = {
  name: "Om Threads Boutique",
  tagline: "Heirloom shawls & stoles from North India",
  description: "Kullu shawls from Himachal Pradesh, lohis from Punjab, pashmina and more: shawls and stoles from North India.",
  etsyUrl: "https://omthreadsboutique.etsy.com",
};

/**
 * Defaults for everything editable in the admin under "Site settings".
 * These apply until the owner saves their own values.
 */
export const defaultSettings: SiteSettings = {
  announcement: "Ships from Lake Villa, IL · Also on Etsy",
  email: "",
  instagramUrl: "",
  whatsapp: "",
  freeShippingThreshold: 75,
  returnDays: 30,
  shipsWithin: "1–2 business days",
  // From the Etsy shop page. Update in the admin as reviews come in.
  etsyRating: 5,
  etsyReviewCount: 2,
};

export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** FALLBACKS for the admin's editable lists (Types, Colours, Materials): used only when the feed has no `lists`. See lib/lists.ts. */
export const categories: { slug: string; type: ProductType; title: string; singular: string; blurb: string }[] = [
  {
    slug: "shawls",
    type: "shawl",
    title: "Shawls",
    singular: "Shawl",
    blurb: "Generous, enveloping and warm, for evenings, travel and cooler days.",
  },
  {
    slug: "stoles",
    type: "stole",
    title: "Stoles",
    singular: "Stole",
    blurb: "Lighter and narrower, made to drape over the shoulders or wear as a scarf.",
  },
  {
    slug: "scarves",
    type: "scarf",
    title: "Scarves",
    singular: "Scarf",
    blurb: "Everyday softness in easy, versatile sizes.",
  },
  {
    slug: "wraps",
    type: "wrap",
    title: "Wraps",
    singular: "Wrap",
    blurb: "Oversized comfort to layer over anything.",
  },
];

export const colors: { value: string; label: string; hex: string }[] = [
  { value: "ivory", label: "Ivory", hex: "#f3ecdf" },
  { value: "beige", label: "Beige", hex: "#d8c3a5" },
  { value: "grey", label: "Grey", hex: "#9a9a98" },
  { value: "black", label: "Black", hex: "#1f1f1f" },
  { value: "navy", label: "Navy", hex: "#1f2e4d" },
  { value: "teal", label: "Teal", hex: "#1f6f6b" },
  { value: "green", label: "Green", hex: "#3f6b3a" },
  { value: "burgundy", label: "Burgundy", hex: "#6d1f2c" },
  { value: "red", label: "Red", hex: "#b3261e" },
  { value: "rust", label: "Rust", hex: "#a4502a" },
  { value: "mustard", label: "Mustard", hex: "#c99a2e" },
  { value: "pink", label: "Pink", hex: "#e3a5b0" },
  { value: "purple", label: "Purple", hex: "#6a4c83" },
  { value: "multi", label: "Multicolor", hex: "conic-gradient(#b3261e, #c99a2e, #1f6f6b, #6a4c83, #b3261e)" },
];

export const materials: { value: string; label: string }[] = [
  { value: "pashmina", label: "Pashmina" },
  { value: "cashmere", label: "Cashmere" },
  { value: "silk", label: "Silk" },
  { value: "silk-blend", label: "Silk blend" },
  { value: "wool", label: "Wool" },
  { value: "wool-blend", label: "Wool blend" },
  { value: "viscose", label: "Viscose" },
  { value: "modal", label: "Modal" },
  { value: "cotton", label: "Cotton" },
];

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
