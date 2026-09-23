import Link from "next/link";
import { Suspense } from "react";
import { filterProducts, type ProductFilters, type SortKey } from "@/lib/catalog";
import { categories } from "@/lib/site";
import type { Product } from "@/lib/types";
import { ProductGrid } from "./ProductCard";
import { ShopFilters } from "./ShopFilters";

export type SearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const many = (v: string | string[] | undefined) => one(v)?.split(",").filter(Boolean);

export function parseFilters(sp: SearchParams): ProductFilters {
  const max = Number(one(sp.max));
  return {
    q: one(sp.q),
    colors: many(sp.color),
    materials: many(sp.material),
    crafts: many(sp.craft),
    maxPrice: Number.isFinite(max) && max > 0 ? max : undefined,
    sort: (one(sp.sort) as SortKey) || undefined,
    inStockOnly: one(sp.instock) === "1",
  };
}

export function ShopView({
  title,
  description,
  products,
  searchParams,
  activeCategory,
}: {
  title: string;
  description?: string;
  products: Product[];
  searchParams: SearchParams;
  activeCategory?: string;
}) {
  const filtered = filterProducts(products, parseFilters(searchParams));
  const availableColors = [...new Set(products.flatMap((p) => p.colors))];
  const availableMaterials = [...new Set(products.map((p) => p.material).filter(Boolean) as string[])];
  const availableCrafts = [...new Set(products.map((p) => p.craft).filter(Boolean) as string[])];

  return (
    <div className="container-page pt-8 md:pt-12">
      <header className="mb-6 max-w-2xl">
        <p className="animate-rise font-deva text-lg text-accent">संग्रह</p>
        <h1 className="animate-rise text-4xl md:text-6xl" style={{ "--i": 1 } as React.CSSProperties}>
          {title}
        </h1>
        {description && (
          <p className="animate-rise mt-3 text-muted md:text-lg" style={{ "--i": 2 } as React.CSSProperties}>
            {description}
          </p>
        )}
      </header>

      <nav aria-label="Categories" className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {[{ slug: undefined, title: "All" }, ...categories].map((c) => {
          const on = activeCategory === c.slug;
          return (
            <Link
              key={c.title}
              href={c.slug ? `/shop/${c.slug}` : "/shop"}
              aria-current={on ? "page" : undefined}
              className={`inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm transition-colors ${
                on ? "border-ink bg-ink text-ivory" : "border-line bg-white hover:border-ink"
              }`}
            >
              {c.title}
            </Link>
          );
        })}
      </nav>

      <Suspense>
        <ShopFilters
          availableColors={availableColors}
          availableMaterials={availableMaterials}
          availableCrafts={availableCrafts}
          resultCount={filtered.length}
        />
      </Suspense>

      <div className="pt-6">
        {filtered.length ? (
          <ProductGrid products={filtered} preloadFirst={4} />
        ) : (
          <div className="py-20 text-center">
            <p className="font-display text-2xl">No pieces match those filters</p>
            <p className="mt-2 text-muted">Try removing a filter or two.</p>
          </div>
        )}
      </div>
    </div>
  );
}
