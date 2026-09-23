"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { crafts as allCrafts } from "@/lib/crafts";
import { colors as allColors, materials as allMaterials } from "@/lib/site";
import { CloseIcon, FilterIcon } from "./icons";

const sorts = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

const priceSteps = [40, 60, 80, 100];

type Props = {
  /** Only offer filter values that exist in the current product set. */
  availableColors: string[];
  availableMaterials: string[];
  availableCrafts: string[];
  resultCount: number;
  /** "bar": top bar + drawer (phones, tablets). "sidebar": always-open panel on laptops. */
  mode?: "bar" | "sidebar";
};

export function ShopFilters({
  availableColors,
  availableMaterials,
  availableCrafts,
  resultCount,
  mode = "bar",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const list = (key: string) => params.get(key)?.split(",").filter(Boolean) ?? [];
  const selectedColors = list("color");
  const selectedMaterials = list("material");
  const selectedCrafts = list("craft");
  const maxPrice = params.get("max");
  const sort = params.get("sort") ?? "featured";
  const inStock = params.get("instock") === "1";
  const q = params.get("q");

  const update = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mutate(next);
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const toggle = (key: string, value: string) =>
    update((p) => {
      const cur = new Set(p.get(key)?.split(",").filter(Boolean));
      if (cur.has(value)) cur.delete(value);
      else cur.add(value);
      if (cur.size) p.set(key, [...cur].join(","));
      else p.delete(key);
    });

  const setParam = (key: string, value: string | null) =>
    update((p) => (value === null ? p.delete(key) : p.set(key, value)));

  const activeCount = selectedColors.length + selectedMaterials.length + selectedCrafts.length + (maxPrice ? 1 : 0) + (inStock ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const fields = (focusable: boolean, className = "") => (
    <div className={`space-y-8 ${className}`}>
      {availableColors.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-3">Color</legend>
          <div className="grid grid-cols-4 gap-3">
            {allColors
              .filter((c) => availableColors.includes(c.value))
              .map((c) => {
                const on = selectedColors.includes(c.value);
                return (
                  <button
                    key={c.value}
                    type="button"
                    aria-pressed={on}
                    tabIndex={focusable ? 0 : -1}
                    onClick={() => toggle("color", c.value)}
                    className="flex flex-col items-center gap-1.5 text-xs"
                  >
                    <span
                      className={`size-10 rounded-full border border-ink/15 ring-offset-2 ring-offset-ivory ${on ? "ring-2 ring-ink" : ""}`}
                      style={{ background: c.hex }}
                    />
                    {c.label}
                  </button>
                );
              })}
          </div>
        </fieldset>
      )}

      {availableMaterials.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-3">Material</legend>
          <div className="flex flex-wrap gap-2">
            {allMaterials
              .filter((m) => availableMaterials.includes(m.value))
              .map((m) => {
                const on = selectedMaterials.includes(m.value);
                return (
                  <button
                    key={m.value}
                    type="button"
                    aria-pressed={on}
                    tabIndex={focusable ? 0 : -1}
                    onClick={() => toggle("material", m.value)}
                    className={`h-10 rounded-full border px-4 text-sm ${on ? "border-ink bg-ink text-ivory" : "border-line bg-white"}`}
                  >
                    {m.label}
                  </button>
                );
              })}
          </div>
        </fieldset>
      )}

      {availableCrafts.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-3">Craft</legend>
          <div className="flex flex-wrap gap-2">
            {allCrafts
              .filter((c) => availableCrafts.includes(c.value))
              .map((c) => {
                const on = selectedCrafts.includes(c.value);
                return (
                  <button
                    key={c.value}
                    type="button"
                    aria-pressed={on}
                    tabIndex={focusable ? 0 : -1}
                    onClick={() => toggle("craft", c.value)}
                    className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm transition-colors ${on ? "border-ink bg-ink text-ivory" : "border-line bg-white"}`}
                  >
                    {c.label}
                    <span className={`font-deva text-xs ${on ? "text-zari-light" : "text-zari"}`}>{c.hindi}</span>
                  </button>
                );
              })}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="eyebrow mb-3">Price</legend>
        <div className="flex flex-wrap gap-2">
          {priceSteps.map((p) => {
            const on = maxPrice === String(p);
            return (
              <button
                key={p}
                type="button"
                aria-pressed={on}
                tabIndex={focusable ? 0 : -1}
                onClick={() => setParam("max", on ? null : String(p))}
                className={`h-10 rounded-full border px-4 text-sm ${on ? "border-ink bg-ink text-ivory" : "border-line bg-white"}`}
              >
                Under ${p}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="flex items-center justify-between gap-4">
        <span className="text-[0.95rem]">Hide sold-out pieces</span>
        <input
          type="checkbox"
          checked={inStock}
          tabIndex={focusable ? 0 : -1}
          onChange={(e) => setParam("instock", e.target.checked ? "1" : null)}
          className="size-5 accent-ink"
        />
      </label>
    </div>
  );

  const chips = [
    ...(q ? [{ label: `“${q}”`, clear: () => setParam("q", null) }] : []),
    ...selectedColors.map((c) => ({
      label: allColors.find((x) => x.value === c)?.label ?? c,
      clear: () => toggle("color", c),
    })),
    ...selectedMaterials.map((m) => ({
      label: allMaterials.find((x) => x.value === m)?.label ?? m,
      clear: () => toggle("material", m),
    })),
    ...selectedCrafts.map((c) => ({
      label: allCrafts.find((x) => x.value === c)?.label ?? c,
      clear: () => toggle("craft", c),
    })),
    ...(maxPrice ? [{ label: `Under $${maxPrice}`, clear: () => setParam("max", null) }] : []),
    ...(inStock ? [{ label: "In stock", clear: () => setParam("instock", null) }] : []),
  ];

  const clearFilters = () =>
    update((p) => ["color", "material", "craft", "max", "instock"].forEach((k) => p.delete(k)));

  if (mode === "sidebar") {
    return (
      <aside aria-label="Filters" className="sticky top-28 hidden max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2 lg:block">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-2xl">Filter</h2>
          {activeCount > 0 && (
            <button type="button" onClick={clearFilters} className="text-sm text-muted underline underline-offset-4">
              Clear ({activeCount})
            </button>
          )}
        </div>
        {fields(true)}
      </aside>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-y border-line py-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm lg:hidden"
        >
          <FilterIcon size={18} />
          Filter{activeCount > 0 && ` (${activeCount})`}
        </button>
        <p className={`hidden text-sm text-muted sm:block lg:mr-auto ${pending ? "opacity-50" : ""}`} aria-live="polite">
          {resultCount} {resultCount === 1 ? "piece" : "pieces"}
        </p>
        <label className="inline-flex items-center gap-2 text-sm">
          <span className="sr-only sm:not-sr-only">Sort by</span>
          <select
            value={sort}
            onChange={(e) => setParam("sort", e.target.value === "featured" ? null : e.target.value)}
            className="h-11 rounded-full border border-line bg-white px-4 text-sm"
          >
            {sorts.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {chips.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pt-3">
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={c.clear}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-sand px-3 text-sm"
              aria-label={`Remove filter ${c.label}`}
            >
              {c.label} <CloseIcon size={14} />
            </button>
          ))}
          <button
            type="button"
            onClick={() => update((p) => ["q", "color", "material", "craft", "max", "instock"].forEach((k) => p.delete(k)))}
            className="h-9 shrink-0 px-2 text-sm underline underline-offset-4"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Bottom sheet on phones, side panel on desktop */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          className={`absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl bg-ivory shadow-2xl transition-transform duration-300 ease-soft md:inset-y-0 md:right-auto md:left-0 md:max-h-none md:w-96 md:rounded-none ${
            open ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <h2 className="text-2xl">Filter</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="-mr-2 grid size-11 place-items-center"
              aria-label="Close filters"
              tabIndex={open ? 0 : -1}
            >
              <CloseIcon />
            </button>
          </div>

          {fields(open, "flex-1 overflow-y-auto px-5 py-6")}

          <div className="flex gap-3 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={clearFilters}
              className="btn btn-outline flex-1"
            >
              Clear
            </button>
            <button
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              className="btn btn-primary flex-[2]"
            >
              Show {resultCount} {resultCount === 1 ? "piece" : "pieces"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
