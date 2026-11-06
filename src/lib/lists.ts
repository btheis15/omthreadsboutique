import { crafts as defaultCrafts } from "./crafts";
import { categories as defaultCategories, colors as defaultColors, materials as defaultMaterials } from "./site";
import type { Craft } from "./crafts";
import type { CraftItem, Lists, Product, TypeItem } from "./types";

/**
 * The admin's editable lists (feed `lists`) come in as JSON; this makes each one safe to use. A list that is
 * missing (admin not updated yet) or malformed falls back to the built-in values, so the site never breaks.
 */
function list<T extends { value: string }>(raw: unknown, fallback: T[], fill: (r: Record<string, unknown>, value: string) => T): T[] {
  if (!Array.isArray(raw)) return fallback;
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const value = typeof (r as { value?: unknown }).value === "string" ? (r as { value: string }).value : "";
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(fill(r as Record<string, unknown>, value));
  }
  return out;
}

const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);

export const fallbackLists: Lists = {
  types: defaultCategories.map((c) => ({ value: c.type, label: c.singular, plural: c.title, slug: c.slug, blurb: c.blurb })),
  colors: defaultColors,
  materials: defaultMaterials,
  crafts: defaultCrafts,
};

export function normalizeLists(raw: unknown): Lists {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    types: list<TypeItem>(r.types, fallbackLists.types, (x, value) => {
      const label = str(x.label, value);
      return { value, label, plural: str(x.plural, `${label}s`), slug: str(x.slug, `${value}s`), blurb: str(x.blurb) };
    }),
    colors: list(r.colors, fallbackLists.colors, (x, value) => ({ value, label: str(x.label, value), hex: str(x.hex, "#d8c3a5") })),
    materials: list(r.materials, fallbackLists.materials, (x, value) => ({ value, label: str(x.label, value) })),
    crafts: list<CraftItem>(r.crafts, fallbackLists.crafts, (x, value) => ({
      value,
      label: str(x.label, value),
      hindi: str(x.hindi),
      region: str(x.region),
      summary: str(x.summary),
      story: str(x.story),
    })),
  };
}

export const colorLabel = (lists: Pick<Lists, "colors">, value: string) =>
  lists.colors.find((c) => c.value === value)?.label ?? value;

export const materialLabel = (lists: Pick<Lists, "materials">, value?: string) =>
  value ? (lists.materials.find((m) => m.value === value)?.label ?? value) : undefined;

export const craftByValue = (lists: Pick<Lists, "crafts">, value?: string): Craft | undefined =>
  value ? lists.crafts.find((c) => c.value === value) : undefined;

/** The type's entry for a product (matched by stable value). */
export const typeByValue = (lists: Pick<Lists, "types">, value?: string) =>
  value ? lists.types.find((t) => t.value === value) : undefined;

/** Types that have at least one piece, for nav, footer, chips and the sitemap. Pages for empty ones still work. */
export function typesWithProducts(lists: Pick<Lists, "types">, products: Pick<Product, "type">[]): TypeItem[] {
  const used = new Set(products.map((p) => p.type));
  return lists.types.filter((t) => used.has(t.value));
}

/**
 * The crafts of the pieces on the site, in list order. Until any piece
 * has a craft set, all of them, so the guide is never empty.
 */
export function carriedCrafts(lists: Pick<Lists, "crafts">, products: { craft?: string }[]): Craft[] {
  const carried = new Set(products.map((p) => p.craft).filter(Boolean));
  const out = lists.crafts.filter((c) => carried.has(c.value));
  return out.length ? out : lists.crafts;
}
