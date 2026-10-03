import type { PortableTextBlock } from "next-sanity";

export type ProductType = "shawl" | "stole" | "scarf" | "wrap";

export type SwatchPattern = "weave" | "stripe" | "paisley" | "plain" | "jaali" | "bandhani" | "block";

export type ProductImage = {
  /** Sanity CDN URL. When absent, a generated textile swatch is shown. */
  url?: string;
  alt: string;
  /** Low-quality blurred placeholder (data URL) from Sanity. */
  lqip?: string;
  swatch?: { base: string; accent: string; pattern: SwatchPattern };
};

/**
 * One combination of options (e.g. Color: Teal), with its own stock and,
 * when it differs, its own price and photo. Same as a variation on Etsy.
 */
export type ProductVariant = {
  id: string;
  /** One value per option name, in order, e.g. ["Teal"] or ["Teal", "Large"] */
  values: string[];
  /** undefined = made to order, 0 = sold out */
  stock?: number;
  /** When absent, the product's price */
  price?: number;
  /** On a website sale: the regular price, shown struck through */
  compareAtPrice?: number;
  image?: ProductImage;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  type: ProductType;
  price: number;
  compareAtPrice?: number;
  /** A website sale's last day (YYYY-MM-DD), when it has one */
  saleEndsOn?: string;
  images: ProductImage[];
  shortDescription: string;
  description?: PortableTextBlock[] | string[];
  colors: string[];
  material?: string;
  /** Craft technique, see src/lib/crafts.ts */
  craft?: string;
  /** Where it was made, e.g. "Srinagar, Kashmir" */
  origin?: string;
  /** Optional short video (Sanity file URL) shown in the gallery */
  videoUrl?: string;
  dimensions?: string;
  care?: string;
  /** undefined = made to order / unlimited, 0 = sold out. With options, the total of theirs. */
  stock?: number;
  /** Option names, e.g. ["Color"] (up to three), when the piece comes in options */
  options?: string[];
  variants?: ProductVariant[];
  etsyUrl?: string;
  collections: string[];
  featured: boolean;
  isNew: boolean;
  publishedAt: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type Collection = {
  slug: string;
  title: string;
  description?: string;
  image?: ProductImage;
};

/** A photo on a page, with its size so it can be shown whole (never cropped). */
export type PagePhoto = ProductImage & { url: string; width: number; height: number; caption?: string };

export type ContentSection = { heading?: string; paragraphs: string[]; photos?: PagePhoto[] };

export type ContentPage = {
  slug: string;
  title: string;
  intro?: string;
  /** Rich text from Sanity, or plain sections from the built-in defaults. */
  body: PortableTextBlock[] | ContentSection[];
  /** Photos under the intro (photos that go with a section are in that section). */
  photos?: PagePhoto[];
};

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  location?: string;
  product?: string;
};

export type SiteSettings = {
  announcement?: string;
  email?: string;
  instagramUrl?: string;
  whatsapp?: string;
  freeShippingThreshold: number;
  returnDays: number;
  shipsWithin: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: ProductImage;
  heroVideoUrl?: string;
  etsyRating?: number;
  etsyReviewCount?: number;
};

/** A shipping option at checkout (from the Om Threads admin's Checkout setup). */
export type ShippingRate = {
  id: string;
  label: string;
  cents: number;
  /** The price for an order of two or more items, when it differs. */
  multiCents?: number | null;
  /** Free when the items come to at least this much. */
  freeOverCents: number | null;
  minDays: number;
  maxDays: number;
};

/**
 * The website's own checkout, when the admin has it on. "test" is only open
 * to people with the tester link (a cookie whose hash matches testerHash).
 */
export type CheckoutInfo = {
  mode: "test" | "live";
  /** stripe: cards, Apple Pay, Google Pay, UPI · paypal: PayPal and Venmo · bch: Bitcoin Cash (Prompt.cash) · exodus: stablecoins · zelle: confirmed by hand */
  providers: ("stripe" | "paypal" | "bch" | "exodus" | "zelle")[];
  /** How long a Bitcoin Cash price is held, and what a test order pays (BCH has no test network). */
  /** receipts: shoppers can get their receipt as an Om Receipt CashToken. */
  bch?: { minutes: number; testCents: number; receipts?: boolean };

  /** PayPal's public client id and its JavaScript SDK (v6) address. */
  paypal?: { clientId: string; sdkUrl: string };
  /** How long a Zelle order holds the pieces. */
  zelle?: { holdHours: number };
  countries: { code: string; name: string; rates: ShippingRate[] }[];
  /** Sales tax is added on the payment page (Stripe Tax). */
  taxAdded: boolean;
  /** What shoppers can pay with through Exodus Pay, e.g. "USDC or USDT" (set in the admin). */
  exodusCoins?: string;
  testerHash?: string;
  /** Sales partners: open for sign-ups (their sales are paid with Bitcoin Cash), at this commission. */
  partners?: { ratePercent: number };
};
