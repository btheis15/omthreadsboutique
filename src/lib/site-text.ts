import registry from "./site-text-registry.json";

/** One editable piece of website wording. The admin keeps a copy of site-text-registry.json. */
export type TextEntry = { key: string; group: string; label: string; hint?: string; default: string; multiline?: boolean };
export type TextVars = Record<string, string | number>;
export type T = (key: string, vars?: TextVars) => string;

export const textRegistry = registry as TextEntry[];
const defaults: Record<string, string> = Object.fromEntries(textRegistry.map((e) => [e.key, e.default]));

/** Only non-empty string overrides count; anything else (or an unreachable feed) means "use the original wording". */
export function cleanOverrides(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    for (const [k, v] of Object.entries(raw)) if (typeof v === "string" && v.trim() && k in defaults) out[k] = v;
  }
  return out;
}

/** `t(key, vars)`: the owner's wording if set, else the original. `{name}` placeholders are filled from `vars`. */
export function makeT(overrides?: unknown): T {
  const o = cleanOverrides(overrides);
  return (key, vars) => {
    const s = o[key] ?? defaults[key] ?? "";
    return vars ? s.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m)) : s;
  };
}

/** The "new" badge window, validated (whole number 1-365), default 21. */
export function newBadgeDays(t: T): number {
  const n = Number(t("newBadgeDays"));
  return Number.isInteger(n) && n >= 1 && n <= 365 ? n : 21;
}

export type MenuLink = { label: string; href: string };
export type Menus = { header?: MenuLink[]; footer?: MenuLink[] };

const goodHref = (h: string) => h.startsWith("/") || /^https:\/\//.test(h);
function links(raw: unknown): MenuLink[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out = raw.flatMap((r): MenuLink[] => {
    const x = r as { label?: unknown; href?: unknown } | null;
    return x && typeof x.label === "string" && typeof x.href === "string" && x.label.trim() && goodHref(x.href)
      ? [{ label: x.label, href: x.href }]
      : [];
  });
  return out.length ? out : undefined;
}

/** Menus from the feed; a missing or empty menu means "use the built-in one". */
export function normalizeMenus(raw: unknown): Menus {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return { header: links(r.header), footer: links(r.footer) };
}
