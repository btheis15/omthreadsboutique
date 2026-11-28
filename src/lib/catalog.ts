/**
 * Single entry point for catalog data. Pages never talk to a data source
 * directly. In order of preference, data comes from:
 *   1. the Om Threads admin on the Mac mini (SHOP_API_URL, see ADMIN_GUIDE.md)
 *   2. Sanity (NEXT_PUBLIC_SANITY_PROJECT_ID)
 *   3. the built-in sample catalog, so the site always renders.
 */
import { createImageUrlBuilder } from "@sanity/image-url";
import type { PortableTextBlock } from "next-sanity";
import { sampleCollections, samplePages, samplePlaceholderReviews, sampleProducts } from "@/data/sample";
import { client } from "@/sanity/client";
import { carePresets } from "@/sanity/options";
import { american } from "./american";
import { craftByValue, fallbackLists, normalizeLists, typeByValue } from "./lists";
import { defaultSettings } from "./site";
import { makeT, newBadgeDays, normalizeMenus, type Menus, type T } from "./site-text";
import type {
  CheckoutInfo,
  Collection,
  ContentPage,
  Lists,
  Product,
  ProductImage,
  ProductType,
  SiteSettings,
  Testimonial,
  EtsyReview,
} from "./types";

export const CACHE_TAG = "sanity";

const isNewArrival = (publishedAt: string, t: T) => Date.now() - new Date(publishedAt).getTime() < newBadgeDays(t) * 86_400_000;

// ---------------------------------------------------------------------------
// Om Threads admin (Mac mini)
// ---------------------------------------------------------------------------

const shopApiUrl = (process.env.SHOP_API_URL ?? "").replace(/\/$/, "");

/** Where the catalog comes from; the "Preview mode" banner shows for "sample". */
export const catalogSource: "shop" | "sanity" | "sample" = shopApiUrl ? "shop" : client ? "sanity" : "sample";

type ShopProduct = Omit<Product, "isNew" | "care"> & { carePreset?: keyof typeof carePresets | "custom"; care?: string };
type ShopCatalog = {
  products: ShopProduct[];
  collections: (Collection & { showOnHome: boolean })[];
  pages: ContentPage[];
  settings: Partial<SiteSettings>;
  testimonials: Testimonial[];
  /** Newest first. Absent until the admin is updated. */
  etsyReviews?: unknown;
  /** The admin's editable lists (types, colours, materials, crafts). Absent until the admin is updated. */
  lists?: unknown;
  /** The owner's edited website wording (only the keys they changed). See lib/site-text.ts. */
  text?: unknown;
  /** The owner's header and footer menus. Absent = the built-in menus. */
  menus?: unknown;
  /** Present only while the admin has the website checkout on (test or live). */
  checkout?: CheckoutInfo;
};

/**
 * One cached request returns the whole (small) catalog. If the Mac mini is
 * unreachable this throws, so Next keeps serving the last good pages instead
 * of an empty shop.
 */
async function shopCatalog(): Promise<ShopCatalog> {
  const res = await fetch(`${shopApiUrl}/api/catalog`, {
    headers: { Authorization: `Bearer ${process.env.SHOP_API_TOKEN ?? ""}` },
    next: { revalidate: 300, tags: [CACHE_TAG] },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Shop catalog request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

/**
 * Types, colours, materials and crafts. From the admin's feed when it has `lists`; otherwise (admin not
 * updated yet, feed unreachable, Sanity/sample source) the built-in values, so nothing is ever hidden.
 */
export async function getLists(): Promise<Lists> {
  if (catalogSource !== "shop") return fallbackLists;
  try {
    return normalizeLists((await shopCatalog()).lists);
  } catch {
    return fallbackLists;
  }
}

/** The owner's text overrides from the feed (empty when absent or the feed is unreachable). */
export async function getTextOverrides(): Promise<Record<string, string>> {
  if (catalogSource !== "shop") return {};
  try {
    return (await shopCatalog()).text as Record<string, string>;
  } catch {
    return {};
  }
}

/** `t(key, vars)` for server components: the owner's wording, else the original. */
export async function getT(): Promise<T> {
  return makeT(await getTextOverrides());
}

/** Header/footer menus from the feed; each is undefined (use the built-in one) when not set. */
export async function getMenus(): Promise<Menus> {
  if (catalogSource !== "shop") return {};
  try {
    return normalizeMenus((await shopCatalog()).menus);
  } catch {
    return {};
  }
}

/** The website checkout's settings, or null when it's off (or the catalog isn't the admin's). */
export async function getCheckout(): Promise<CheckoutInfo | null> {
  if (catalogSource !== "shop") return devCheckout();
  try {
    const info = (await shopCatalog()).checkout;
    if (!info) return null;
    const { freeGift, ...rest } = info;
    return { ...rest, ...(cleanFreeGift(freeGift) && { freeGift: cleanFreeGift(freeGift) }) };
  } catch {
    return null;
  }
}

/**
 * Calls the admin's public server from this site's server (never the
 * browser), with the shared token. Used by checkout, which always asks for
 * fresh prices and stock.
 */
export async function shopApi(path: string, init: { method?: string; body?: unknown; shopperIp?: string | null } = {}) {
  if (catalogSource !== "shop") throw new Error("The shop's checkout isn't connected.");
  const res = await fetch(`${shopApiUrl}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${process.env.SHOP_API_TOKEN ?? ""}`,
      // Lets the admin limit each shopper separately (one visitor can't use up everyone's checkout).
      ...(init.shopperIp ? { "X-Shopper-IP": init.shopperIp } : {}),
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });
  return { status: res.status, data: (await res.json().catch(() => ({}))) as Record<string, unknown> };
}

/** The visitor's address as Vercel reports it (x-real-ip, or the first x-forwarded-for hop). */
export function shopperIp(h: Headers) {
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

/** True when the admin's catalog can be fetched right now (always true for other sources). */
export async function isShopCatalogReachable(): Promise<boolean> {
  if (catalogSource !== "shop") return true;
  try {
    const res = await fetch(`${shopApiUrl}/api/catalog`, {
      headers: { Authorization: `Bearer ${process.env.SHOP_API_TOKEN ?? ""}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function carePresetText(preset: keyof typeof carePresets, t: T) {
  return t(`care.${preset}`);
}

function mapShopProduct({ carePreset, care, ...p }: ShopProduct, t: T): Product {
  return {
    ...p,
    // Option names in American spelling (the admin, Etsy and Meta keep theirs; see american.ts).
    options: p.options?.map(american),
    variants: p.variants?.map((v) => ({ ...v, values: v.values.map(american) })),
    // Photo and video color tags too, so a "Heather Grey" photo still matches the "Heather Gray" option.
    images: p.images?.map((img) => (img.color ? { ...img, color: american(img.color) } : img)),
    videos: p.videos?.map((v) => (v.color ? { ...v, color: american(v.color) } : v)),
    care: carePreset === "custom" ? care : carePreset ? carePresetText(carePreset, t) : undefined,
    isNew: isNewArrival(p.publishedAt, t),
  };
}

// ---------------------------------------------------------------------------
// Sanity queries
// ---------------------------------------------------------------------------

const imageFields = `{ "url": asset->url, "lqip": asset->metadata.lqip, alt, hotspot, crop, asset }`;

const productFields = `{
  "id": _id,
  "slug": slug.current,
  title,
  "type": productType,
  price,
  compareAtPrice,
  "images": images[]${imageFields},
  shortDescription,
  description,
  colors,
  material,
  craft,
  origin,
  "videoUrl": video.asset->url,
  dimensions,
  carePreset,
  care,
  stock,
  etsyUrl,
  "collections": collections[]->slug.current,
  featured,
  "publishedAt": coalesce(publishedAt, _createdAt),
  seoTitle,
  seoDescription
}`;

type SanityImage = {
  url?: string;
  lqip?: string;
  alt?: string;
  asset?: { _ref: string };
  hotspot?: unknown;
  crop?: unknown;
};

type SanityProduct = Omit<Product, "images" | "isNew" | "care" | "collections" | "colors"> & {
  images: SanityImage[] | null;
  colors: string[] | null;
  collections: string[] | null;
  carePreset?: keyof typeof carePresets | "custom";
  care?: string;
};

async function query<T>(groq: string, params: Record<string, unknown> = {}): Promise<T> {
  if (!client) throw new Error("Sanity is not configured");
  return client.fetch<T>(groq, params, { next: { revalidate: 300, tags: [CACHE_TAG] } });
}

const builder = client ? createImageUrlBuilder(client) : null;

function mapImage(img: SanityImage, fallbackAlt: string): ProductImage {
  // Bake crop/hotspot into the base URL; the image loader appends width & quality.
  const url = builder && img.asset ? builder.image(img).fit("max").auto("format").url() : img.url;
  return { url, lqip: img.lqip, alt: img.alt || fallbackAlt };
}

function mapProduct(p: SanityProduct): Product {
  const t = makeT();
  const care = p.carePreset === "custom" ? p.care : p.carePreset ? carePresetText(p.carePreset, t) : undefined;
  return {
    ...p,
    images: (p.images ?? []).map((i) => mapImage(i, p.title)),
    colors: p.colors ?? [],
    collections: (p.collections ?? []).filter(Boolean),
    featured: Boolean(p.featured),
    care,
    isNew: isNewArrival(p.publishedAt, t),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getProducts(): Promise<Product[]> {
  if (catalogSource === "shop") {
    const cat = await shopCatalog();
    const t = makeT(cat.text);
    return cat.products.map((p) => mapShopProduct(p, t));
  }
  if (!client) return giftPreview() ? [...sampleProducts, devGiftProduct] : sampleProducts;
  const rows = await query<SanityProduct[]>(
    `*[_type == "product" && defined(slug.current)] | order(publishedAt desc) ${productFields}`,
  );
  return rows.map(mapProduct);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  if (catalogSource === "shop") {
    const cat = await shopCatalog();
    const p = cat.products.find((x) => x.slug === slug);
    return p ? mapShopProduct(p, makeT(cat.text)) : undefined;
  }
  if (!client) return (giftPreview() ? [...sampleProducts, devGiftProduct] : sampleProducts).find((p) => p.slug === slug);
  const row = await query<SanityProduct | null>(
    `*[_type == "product" && slug.current == $slug][0] ${productFields}`,
    { slug },
  );
  return row ? mapProduct(row) : undefined;
}

export async function getCollections(): Promise<Collection[]> {
  if (catalogSource === "shop")
    return (await shopCatalog()).collections
      .filter((c) => c.showOnHome)
      .map(({ slug, title, description, image }) => ({ slug, title, description, image }));
  if (!client) return sampleCollections;
  const rows = await query<(Omit<Collection, "image"> & { image?: SanityImage; fallback?: SanityImage })[]>(
    `*[_type == "collection" && showOnHome != false && defined(slug.current)] | order(title asc) {
      "slug": slug.current, title, description,
      "image": image${imageFields},
      "fallback": *[_type == "product" && references(^._id)] | order(publishedAt desc)[0].images[0]${imageFields}
    }`,
  );
  return rows.map(({ image, fallback, ...c }) => {
    const img = image?.asset ? image : fallback;
    return { ...c, image: img ? mapImage(img, c.title) : undefined };
  });
}

export async function getCollection(slug: string): Promise<Collection | undefined> {
  if (catalogSource === "shop") {
    const c = (await shopCatalog()).collections.find((x) => x.slug === slug);
    return c ? { slug: c.slug, title: c.title, description: c.description } : undefined;
  }
  if (!client) return sampleCollections.find((c) => c.slug === slug);
  return query<Collection | null>(
    `*[_type == "collection" && slug.current == $slug][0]{ "slug": slug.current, title, description }`,
    { slug },
  ).then((c) => c ?? undefined);
}

export async function getPage(slug: string): Promise<ContentPage | undefined> {
  const fallback = samplePages.find((p) => p.slug === slug);
  if (catalogSource === "shop") return (await shopCatalog()).pages.find((p) => p.slug === slug) ?? fallback;
  if (!client) return fallback;
  const row = await query<{ title: string; intro?: string; body?: PortableTextBlock[] } | null>(
    `*[_type == "page" && slug.current == $slug][0]{ title, intro, body }`,
    { slug },
  );
  if (!row) return fallback;
  return { slug, title: row.title, intro: row.intro, body: row.body ?? [] };
}

/** The hero slideshow photos from the admin (ordered), keeping only usable entries. */
function cleanHeroImages(raw: unknown): ProductImage[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r): ProductImage[] => {
    const x = r as { url?: unknown; alt?: unknown } | null;
    return x && typeof x.url === "string" && x.url ? [{ url: x.url, alt: typeof x.alt === "string" && x.alt ? x.alt : "Om Threads Boutique" }] : [];
  });
}

/** A page from the admin's feed only (no built-in fallback); undefined when absent or the feed is unreachable. */
export async function getFeedPage(slug: string): Promise<ContentPage | undefined> {
  if (catalogSource !== "shop") return undefined;
  try {
    return (await shopCatalog()).pages.find((p) => p.slug === slug);
  } catch {
    return undefined;
  }
}

/** An owner text override from the feed's `text` map, or undefined (use the built-in default). */
export async function getFeedText(key: string): Promise<string | undefined> {
  const v = (await getTextOverrides())[key];
  return typeof v === "string" && v.trim() ? v : undefined;
}

/** Defensive shape check for the feed's sale banner: a non-empty title is required, else no banner. */
function cleanSaleBanner(v: unknown): SiteSettings["saleBanner"] {
  if (!v || typeof v !== "object") return undefined;
  const b = v as Record<string, unknown>;
  if (typeof b.title !== "string" || !b.title.trim()) return undefined;
  const text = typeof b.text === "string" && b.text.trim() ? b.text.trim() : undefined;
  const endsOn = typeof b.endsOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.endsOn) ? b.endsOn : undefined;
  return { title: b.title.trim(), ...(text && { text }), ...(endsOn && { endsOn }) };
}

/** DEV-ONLY local preview: SALE_BANNER_PREVIEW=1 injects a sample banner (never set in production). */
function devSaleBanner(): SiteSettings["saleBanner"] {
  if (process.env.SALE_BANNER_PREVIEW !== "1" || process.env.NODE_ENV === "production") return undefined;
  return { title: "Black Friday", text: "20% off everything + a free pouch with 2 or more pieces", endsOn: "2026-11-30" };
}

/** Defensive shape check for the feed's free gift: a product id is required, else no offer. */
function cleanFreeGift(v: unknown): CheckoutInfo["freeGift"] {
  if (!v || typeof v !== "object") return undefined;
  const g = v as Record<string, unknown>;
  if (typeof g.productId !== "string" || !g.productId) return undefined;
  const minItems = typeof g.minItems === "number" && Number.isInteger(g.minItems) && g.minItems >= 1 ? g.minItems : 2;
  const endsOn = typeof g.endsOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(g.endsOn) ? g.endsOn : null;
  const label = typeof g.label === "string" && g.label.trim() ? g.label.trim().slice(0, 60) : "Free pouch";
  return { productId: g.productId, minItems, endsOn, label };
}

/**
 * DEV-ONLY local preview: FREE_GIFT_PREVIEW=1 (sample catalog only, never in production) adds a sample pouch with
 * colour options and a checkout setup with a free gift, so the cart drawer and checkout can be seen without the admin.
 */
const giftPreview = () => process.env.FREE_GIFT_PREVIEW === "1" && process.env.NODE_ENV !== "production" && catalogSource === "sample";
export const devGiftProduct: Product = {
  id: "dev-pouch",
  slug: "dev-embroidered-zipper-pouch",
  title: "Embroidered Zipper Pouch with Threadwork and Gold Sequins",
  type: "pouch",
  price: 14,
  images: [{ alt: "Embroidered zipper pouch", swatch: { base: "#a5282c", accent: "#e3bf80", pattern: "paisley" } }],
  shortDescription: "A zippered pouch embroidered with threadwork and gold sequins.",
  colors: [],
  stock: 9,
  options: ["Color"],
  variants: [
    { id: "pv-red", values: ["Red"], stock: 3, image: { alt: "Red pouch", swatch: { base: "#a5282c", accent: "#e3bf80", pattern: "paisley" } } },
    { id: "pv-pink", values: ["Light Pink"], stock: 2, image: { alt: "Light Pink pouch", swatch: { base: "#e9b4c4", accent: "#b8873a", pattern: "jaali" } } },
    { id: "pv-yellow", values: ["Yellow"], stock: 1, image: { alt: "Yellow pouch", swatch: { base: "#e6b93c", accent: "#8e2a18", pattern: "block" } } },
    { id: "pv-hot", values: ["Hot Pink"], stock: 1, image: { alt: "Hot Pink pouch", swatch: { base: "#c2185b", accent: "#e3bf80", pattern: "weave" } } },
    { id: "pv-peach", values: ["Peach"], stock: 0, image: { alt: "Peach pouch", swatch: { base: "#f2b48f", accent: "#7c1f42", pattern: "stripe" } } },
    { id: "pv-mint", values: ["Mint Green"], stock: 1, image: { alt: "Mint Green pouch", swatch: { base: "#a9d8c0", accent: "#23706f", pattern: "paisley" } } },
  ],
  collections: [],
  featured: false,
  isNew: false,
  publishedAt: "2026-11-01T00:00:00Z",
};
function devCheckout(): CheckoutInfo | null {
  if (!giftPreview()) return null;
  return {
    mode: "live",
    providers: ["zelle"],
    zelle: { holdHours: 24 },
    countries: [{ code: "US", name: "United States", rates: [{ id: "std", label: "Standard shipping", cents: 600, freeOverCents: 12000, minDays: 3, maxDays: 6 }] }],
    taxAdded: false,
    freeGift: { productId: devGiftProduct.id, minItems: 2, endsOn: "2026-11-30", label: "Free pouch" },
  };
}

export async function getSettings(): Promise<SiteSettings> {
  if (catalogSource === "shop") {
    const { heroImages, saleBanner, ...rest } = (await shopCatalog()).settings;
    return {
      ...defaultSettings,
      ...rest,
      heroImages: cleanHeroImages(heroImages),
      saleBanner: cleanSaleBanner(saleBanner) ?? devSaleBanner(),
    };
  }
  if (!client) return { ...defaultSettings, saleBanner: devSaleBanner() };
  const row = await query<
    (Partial<Omit<SiteSettings, "heroImage">> & { heroImage?: SanityImage }) | null
  >(
    `*[_id == "siteSettings"][0]{
      announcement, email, instagramUrl, whatsapp, etsyRating, etsyReviewCount,
      heroTitle, heroSubtitle, "heroImage": heroImage${imageFields}, "heroVideoUrl": heroVideo.asset->url,
      freeShippingThreshold, returnDays, shipsWithin
    }`,
  );
  if (!row) return defaultSettings;
  const clean = Object.fromEntries(Object.entries(row).filter(([, v]) => v !== null && v !== undefined));
  const heroImage = row.heroImage?.asset ? mapImage(row.heroImage, "Om Threads Boutique") : undefined;
  return { ...defaultSettings, ...clean, heroImage } as SiteSettings;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  // Preview mode shows labelled placeholders so the layout can be seen.
  // Once the admin is connected, only real reviews added there are shown.
  if (catalogSource === "shop") return normalizeTestimonials((await shopCatalog()).testimonials);
  if (!client) return samplePlaceholderReviews;
  return query<Testimonial[]>(
    `*[_type == "testimonial"] | order(_createdAt desc)[0...9]{ "id": _id, quote, name, location, product }`,
  );
}

const star = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5 ? v : undefined);

/** Testimonials as sent; the new rating/verified/source fields are kept only when well formed. */
function normalizeTestimonials(raw: unknown): Testimonial[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((r): Testimonial[] => {
    const x = r as (Testimonial & Record<string, unknown>) | null;
    if (!x || typeof x !== "object" || typeof x.quote !== "string") return [];
    const { rating, verified, source, ...rest } = x;
    return [{ ...rest, ...(star(rating) && { rating: star(rating) }), ...(verified === true && { verified: true }), ...((source === "site" || source === "owner") && { source }) }];
  });
}

/** Etsy reviews from the feed (newest first, every rating). Empty until the admin sends them. */
export async function getEtsyReviews(): Promise<EtsyReview[]> {
  if (catalogSource !== "shop") return [];
  try {
    const raw = (await shopCatalog()).etsyReviews;
    if (!Array.isArray(raw)) return [];
    return raw.flatMap((r): EtsyReview[] => {
      const x = r as Record<string, unknown> | null;
      const rating = star(x?.rating);
      if (!x || !rating) return [];
      const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
      return [{ id: String(x.id ?? `${x.date}-${rating}`), rating, text: typeof x.text === "string" ? x.text : "", date: str(x.date) ?? "", listingTitle: str(x.listingTitle), productSlug: str(x.productSlug) }];
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Filtering helpers (catalog is small, so filtering happens in memory)
// ---------------------------------------------------------------------------

export type SortKey = "newest" | "price-asc" | "price-desc" | "featured";

export type ProductFilters = {
  type?: ProductType;
  collection?: string;
  colors?: string[];
  materials?: string[];
  crafts?: string[];
  maxPrice?: number;
  q?: string;
  sort?: SortKey;
  inStockOnly?: boolean;
};

export function isSoldOut(p: Product) {
  return p.stock === 0;
}

export function filterProducts(products: Product[], f: ProductFilters, lists: Lists = fallbackLists): Product[] {
  const q = f.q?.trim().toLowerCase();
  const out = products.filter((p) => {
    if (f.type && p.type !== f.type) return false;
    if (f.collection && !p.collections.includes(f.collection)) return false;
    if (f.colors?.length && !p.colors.some((c) => f.colors!.includes(c))) return false;
    if (f.materials?.length && (!p.material || !f.materials.includes(p.material))) return false;
    if (f.crafts?.length && (!p.craft || !f.crafts.includes(p.craft))) return false;
    if (f.maxPrice && p.price > f.maxPrice) return false;
    if (f.inStockOnly && isSoldOut(p)) return false;
    if (q) {
      const haystack = [
        p.title,
        p.shortDescription,
        p.material,
        p.type,
        typeByValue(lists, p.type)?.label,
        p.origin,
        craftByValue(lists, p.craft)?.label,
        ...p.colors,
      ]
        .join(" ")
        .toLowerCase();
      if (!q.split(/\s+/).every((word) => haystack.includes(word))) return false;
    }
    return true;
  });

  const byDate = (a: Product, b: Product) => b.publishedAt.localeCompare(a.publishedAt);
  const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
    newest: byDate,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    featured: (a, b) => Number(b.featured) - Number(a.featured) || byDate(a, b),
  };
  // Sold-out items always sink to the end.
  return out.sort(
    (a, b) => Number(isSoldOut(a)) - Number(isSoldOut(b)) || sorters[f.sort ?? "featured"](a, b),
  );
}

export function relatedProducts(all: Product[], product: Product, limit = 4): Product[] {
  const score = (p: Product) =>
    (p.type === product.type ? 2 : 0) +
    p.collections.filter((c) => product.collections.includes(c)).length +
    p.colors.filter((c) => product.colors.includes(c)).length +
    (p.craft && p.craft === product.craft ? 2 : 0);
  return all
    .filter((p) => p.id !== product.id && !isSoldOut(p))
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
}

/**
 * Videos play straight from the Mac mini's public address, not through the /media rewrite: Vercel's CDN
 * cached the 2-byte range probe iPhone Safari sends first and then served that fragment for the whole
 * video, so it never played. Photos are fine through the rewrite.
 */
export function directVideoUrl(url: string): string;
export function directVideoUrl(url: string | undefined): string | undefined;
export function directVideoUrl(url: string | undefined) {
  return url && url.startsWith("/media/") && shopApiUrl ? `${shopApiUrl}${url}` : url;
}
