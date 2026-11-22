/**
 * "Find your shawl" quiz: the questions are derived from the live catalog (collections, colors that are actually in
 * stock, price bands from the real prices) and the answers are scored with fixed rules, so the same answers always
 * give the same three pieces. Nothing here is invented copy: each "why" line only states facts about the piece
 * that matched the shopper's answers.
 *
 * `buildQuiz` runs on the server (it needs the whole catalog) and returns plain JSON; `rankQuiz` runs in the browser.
 */
import { formatPrice } from "./site";
import type { Lists, Product, ProductImage } from "./types";
import { variantAvailable, variantCompareAt, variantPrice } from "./variants";

/** An option that can be bought right now. `color` is the quiz's color key (see `colorKey`). */
export type QuizVariant = { id: string; color?: string; price: number; compareAt?: number; image?: ProductImage };

export type QuizProduct = {
  slug: string;
  title: string;
  featured: boolean;
  publishedAt: string;
  image?: ProductImage;
  price: number;
  compareAt?: number;
  /** Buyable options only (empty for a piece with no options). */
  variants: QuizVariant[];
  /** Color keys the piece can be bought in right now. */
  colors: string[];
  /** Occasion ids: collection slugs, or the piece's type when the shop has no usable collections. */
  occasions: string[];
};

export type QuizOccasion = { id: string; label: string; href: string; /** a type's singular name, e.g. "Stole" */ singular?: string };
export type QuizColor = { key: string; label: string; hex?: string; /** the shop's own color value, for the "see all" link */ filter?: string };
export type QuizBand = { id: string; label: string; phrase: string; /** inclusive upper bound; absent on the top band */ max?: number; min?: number };

export type QuizModel = {
  products: QuizProduct[];
  occasion?: { kind: "collection" | "type"; question: string; options: QuizOccasion[] };
  colors?: QuizColor[];
  bands?: QuizBand[];
};

export type QuizAnswers = { occasion?: string; color?: string; budget?: string };

export type QuizResult = {
  slug: string;
  title: string;
  image?: ProductImage;
  price: number;
  compareAt?: number;
  /** The option to open the product page on (set only when the shopper picked a color the piece has as an option). */
  optionId?: string;
  why: string;
};

const isSoldOut = (p: Product) => p.stock === 0;
const norm = (s: string) => s.trim().toLowerCase();

/** One key per color, whether the piece spells it "grey" (list value), "Gray" (label) or "Teal". */
export function colorKey(lists: Pick<Lists, "colors">, raw: string): string {
  const n = norm(raw);
  const hit = lists.colors.find((c) => norm(c.value) === n || norm(c.label) === n);
  return hit ? norm(hit.value) : n;
}

const isColorOption = (name: string) => /^colou?r$/i.test(name.trim());

/** Rounds up to a tidy number ($5 steps under $50, $10 under $200, else $25) so a band reads like a real price. */
const niceCeil = (x: number) => {
  const step = x < 50 ? 5 : x < 200 ? 10 : 25;
  return Math.ceil(x / step) * step;
};

function toQuizProduct(p: Product, lists: Lists, occasionsOf: (p: Product) => string[]): QuizProduct | null {
  if (isSoldOut(p)) return null;
  const colorAt = p.options?.findIndex(isColorOption) ?? -1;
  const variants: QuizVariant[] = [];
  for (const v of p.variants ?? []) {
    if (!variantAvailable(v)) continue;
    variants.push({
      id: v.id,
      color: colorAt >= 0 && v.values[colorAt] ? colorKey(lists, v.values[colorAt]) : undefined,
      price: variantPrice(p, v),
      compareAt: variantCompareAt(p, v),
      image: v.image,
    });
  }
  // Has options but none can be bought: sold out in practice.
  if (p.variants?.length && !variants.length) return null;
  const colors = colorAt >= 0 && variants.length ? [...new Set(variants.map((v) => v.color).filter(Boolean) as string[])] : [...new Set(p.colors.map((c) => colorKey(lists, c)))];
  return {
    slug: p.slug,
    title: p.title,
    featured: p.featured,
    publishedAt: p.publishedAt,
    image: p.images[0],
    price: variants.length ? Math.min(...variants.map((v) => v.price)) : p.price,
    compareAt: variants.length ? undefined : p.compareAtPrice,
    variants,
    colors,
    occasions: occasionsOf(p),
  };
}

/** Price bands from the real prices: up to three, each with at least one piece. Null when there's nothing to choose between. */
export function priceBands(prices: number[]): QuizBand[] | null {
  const sorted = [...prices].sort((a, b) => a - b);
  const n = sorted.length;
  if (n < 2) return null;
  const top = sorted[n - 1];
  let bounds = [sorted[Math.ceil(n / 3) - 1], sorted[Math.ceil((2 * n) / 3) - 1]].map(niceCeil);
  // Strictly increasing, and below the dearest piece (otherwise the top band would be empty).
  bounds = bounds.filter((b, i) => b < top && (i === 0 || b > bounds[i - 1]));
  const count = (lo: number, hi: number) => sorted.filter((x) => x > lo && x <= hi).length;
  // Drop any bound that leaves a band empty.
  for (let again = true; again; ) {
    again = false;
    const edges = [-Infinity, ...bounds, Infinity];
    for (let i = 0; i < edges.length - 1; i++) {
      if (count(edges[i], edges[i + 1]) === 0) {
        bounds.splice(Math.min(i, bounds.length - 1), 1);
        again = true;
        break;
      }
    }
  }
  if (!bounds.length) return null;
  const p = (x: number) => formatPrice(x);
  return [-Infinity, ...bounds, Infinity].slice(0, -1).map((lo, i) => {
    const hi = i < bounds.length ? bounds[i] : undefined;
    if (hi === undefined) return { id: `b${i}`, label: `Over ${p(lo)}`, phrase: `over ${p(lo)}`, min: lo };
    if (i === 0) return { id: `b${i}`, label: `Up to ${p(hi)}`, phrase: `up to ${p(hi)}`, max: hi };
    return { id: `b${i}`, label: `${p(lo)} to ${p(hi)}`, phrase: `between ${p(lo)} and ${p(hi)}`, min: lo, max: hi };
  });
}

export function buildQuiz(
  products: Product[],
  lists: Lists,
  /** Titles of the collections the shop has (slug to title). */
  collectionTitles: Map<string, string>,
): QuizModel {
  // Occasion question: collections that have an in-stock piece; else product types; else no question.
  const live = products.filter((p) => !isSoldOut(p));
  const bySlug = new Map<string, number>();
  for (const p of live) for (const c of new Set(p.collections)) if (collectionTitles.has(c)) bySlug.set(c, (bySlug.get(c) ?? 0) + 1);
  const byType = new Map<string, number>();
  for (const p of live) byType.set(p.type, (byType.get(p.type) ?? 0) + 1);

  let occasion: QuizModel["occasion"];
  let occasionsOf: (p: Product) => string[];
  if (bySlug.size >= 2) {
    const ranked = [...bySlug].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
    occasion = {
      kind: "collection",
      question: "What's the occasion?",
      options: ranked.map(([slug]) => ({ id: slug, label: collectionTitles.get(slug)!, href: `/collections/${slug}` })),
    };
    const shown = new Set(ranked.map(([slug]) => slug));
    occasionsOf = (p) => p.collections.filter((c) => shown.has(c));
  } else if (byType.size >= 2) {
    const types = lists.types.filter((t) => byType.has(t.value));
    occasion = {
      kind: "type",
      question: "What are you looking for?",
      options: types.map((t) => ({ id: t.value, label: t.plural, singular: t.label, href: `/shop/${t.slug}` })),
    };
    occasionsOf = (p) => [p.type];
  } else {
    occasionsOf = () => [];
  }

  const quizProducts = products.map((p) => toQuizProduct(p, lists, occasionsOf)).filter(Boolean) as QuizProduct[];

  // Color question: only colors a piece can be bought in right now, most common first.
  const tally = new Map<string, number>();
  for (const p of quizProducts) for (const c of p.colors) tally.set(c, (tally.get(c) ?? 0) + 1);
  const colors: QuizColor[] = [...tally]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([key]) => {
      const item = lists.colors.find((c) => norm(c.value) === key);
      return { key, label: item?.label ?? key.replace(/\b\w/g, (m) => m.toUpperCase()), hex: item?.hex, filter: item?.value };
    });

  const bands = priceBands(quizProducts.map((p) => p.price));

  return {
    products: quizProducts,
    occasion: occasion && occasion.options.length >= 2 ? occasion : undefined,
    colors: colors.length >= 2 ? colors : undefined,
    bands: bands ?? undefined,
  };
}

/** Which questions the shopper sees, in order. */
export const quizSteps = (m: QuizModel): ("occasion" | "color" | "budget")[] =>
  [m.occasion && "occasion", m.colors && "color", m.bands && "budget"].filter(Boolean) as ("occasion" | "color" | "budget")[];

const WEIGHT = { occasion: 4, color: 3 } as const;

/**
 * Three pieces for the answers. Budget is a hard limit (never show a piece over what they said). Occasion (4 points)
 * and color (3) are preferences: a piece matching both ranks above one matching either, and pieces that match
 * neither are left out. With no preference at all it's the shop's featured, then newest pieces. Ties break by
 * featured, newest, then name, so the order never changes between runs.
 */
export function rankQuiz(m: QuizModel, a: QuizAnswers): { results: QuizResult[]; seeAllHref: string } {
  const band = a.budget ? m.bands?.find((b) => b.id === a.budget) : undefined;
  const color = a.color ? m.colors?.find((c) => c.key === a.color) : undefined;
  const occ = a.occasion ? m.occasion?.options.find((o) => o.id === a.occasion) : undefined;
  const inBand = (x: number) => !band || ((band.min === undefined || x > band.min) && (band.max === undefined || x <= band.max));
  const wantsPreference = Boolean(color || occ);

  const scored: (QuizResult & { score: number; featured: boolean; publishedAt: string })[] = [];
  for (const p of m.products) {
    const hasColor = Boolean(color && p.colors.includes(color.key));
    const hasOcc = Boolean(occ && p.occasions.includes(occ.id));
    // The options this piece could be bought in for these answers.
    const colored = hasColor ? p.variants.filter((v) => v.color === color!.key) : [];
    const pool = colored.length ? colored : p.variants;
    const fits = pool.filter((v) => inBand(v.price));
    let pick: QuizVariant | undefined;
    let price = p.price;
    let compareAt = p.compareAt;
    if (pool.length) {
      if (!fits.length) continue;
      pick = fits[0];
      price = pick.price;
      compareAt = pick.compareAt;
    } else if (!inBand(p.price)) continue;
    const score = (hasOcc ? WEIGHT.occasion : 0) + (hasColor ? WEIGHT.color : 0);
    if (wantsPreference && score === 0) continue;

    const why: string[] = [];
    if (hasOcc && occ) why.push(m.occasion!.kind === "collection" ? `In our ${occ.label} collection` : `A ${(occ.singular ?? occ.label).toLowerCase()}`);
    if (hasColor && color) why.push(`Comes in ${color.label}`);
    if (band) why.push(`Priced ${band.phrase}`);
    if (!why.length) why.push(p.featured ? "One of our featured pieces" : "In stock now");
    scored.push({
      slug: p.slug,
      title: p.title,
      image: (hasColor && pick?.image) || p.image,
      price,
      compareAt,
      optionId: hasColor && pick?.color ? pick.id : undefined,
      why: why.join(" · "),
      score,
      featured: p.featured,
      publishedAt: p.publishedAt,
    });
  }
  scored.sort(
    (x, y) =>
      y.score - x.score ||
      Number(y.featured) - Number(x.featured) ||
      y.publishedAt.localeCompare(x.publishedAt) ||
      x.slug.localeCompare(y.slug),
  );
  const results: QuizResult[] = scored
    .slice(0, 3)
    .map((r) => ({ slug: r.slug, title: r.title, image: r.image, price: r.price, compareAt: r.compareAt, optionId: r.optionId, why: r.why }));

  // "See all": the closest real shop page for the answers (the shop's own filters, nothing new).
  const base = occ?.href ?? "/shop";
  const qs = new URLSearchParams();
  if (color?.filter) qs.set("color", color.filter);
  if (band?.max !== undefined) qs.set("max", String(band.max));
  const q = qs.toString();
  return { results, seeAllHref: q ? `${base}?${q}` : base };
}
