import type { PortableTextBlock } from "next-sanity";

export type ProductType = "shawl" | "stole" | "scarf" | "wrap";

export type SwatchPattern = "weave" | "stripe" | "paisley" | "plain";

export type ProductImage = {
  /** Sanity CDN URL. When absent, a generated textile swatch is shown. */
  url?: string;
  alt: string;
  /** Low-quality blurred placeholder (data URL) from Sanity. */
  lqip?: string;
  swatch?: { base: string; accent: string; pattern: SwatchPattern };
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  type: ProductType;
  price: number;
  compareAtPrice?: number;
  images: ProductImage[];
  shortDescription: string;
  description?: PortableTextBlock[] | string[];
  colors: string[];
  material?: string;
  dimensions?: string;
  care?: string;
  /** undefined = made to order / unlimited, 0 = sold out */
  stock?: number;
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

export type ContentSection = { heading?: string; paragraphs: string[] };

export type ContentPage = {
  slug: string;
  title: string;
  intro?: string;
  /** Rich text from Sanity, or plain sections from the built-in defaults. */
  body: PortableTextBlock[] | ContentSection[];
};
