import Link from "next/link";
import { ViewTransition } from "react";
import { isSoldOut } from "@/lib/catalog";
import { craftByValue } from "@/lib/crafts";
import type { Product } from "@/lib/types";
import { Price } from "./Price";
import { ProductImage } from "./ProductImage";

export function Badge({ product }: { product: Product }) {
  const label = isSoldOut(product)
    ? "Sold out"
    : product.compareAtPrice && product.compareAtPrice > product.price
      ? "Sale"
      : product.stock !== undefined && product.stock <= 2
        ? `Only ${product.stock} left`
        : product.isNew
          ? "New"
          : null;
  if (!label) return null;
  const tone =
    label === "Sale" ? "bg-accent text-ivory" : label === "Sold out" ? "bg-ink text-ivory" : "bg-ivory/95 text-ink";
  return (
    <span className={`absolute top-2 left-2 z-10 rounded-full px-2.5 py-1 text-[0.7rem] font-medium tracking-wide ${tone}`}>
      {label}
    </span>
  );
}

/** Shared-element name so the card image morphs into the product page gallery. */
export const productVtName = (slug: string) => `product-${slug}`;

export function ProductCard({
  product,
  preload,
  morph = false,
  index = 0,
}: {
  product: Product;
  preload?: boolean;
  /** Only enable where each product appears once on the page. */
  morph?: boolean;
  index?: number;
}) {
  const [first, second] = product.images;
  const craft = craftByValue(product.craft);
  const image = (
    <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-sand shadow-[0_1px_0_rgba(43,27,18,0.04)] transition-shadow duration-500 group-hover:shadow-[0_18px_40px_-18px_rgba(43,27,18,0.45)]">
      <Badge product={product} />
      <ProductImage
        image={first}
        preload={preload}
        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
        className={`transition duration-[1200ms] ease-soft group-hover:scale-[1.06] ${isSoldOut(product) ? "opacity-70" : ""}`}
      />
      {second && (
        <ProductImage
          image={second}
          sizes="(min-width: 1024px) 25vw, 33vw"
          className="hidden opacity-0 transition-opacity duration-700 group-hover:opacity-100 md:block"
        />
      )}
    </div>
  );
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block"
      data-reveal
      style={{ "--i": index % 4 } as React.CSSProperties}
    >
      {morph ? (
        <ViewTransition name={productVtName(product.slug)} share="morph" default="none">
          {image}
        </ViewTransition>
      ) : (
        image
      )}
      <div className="mt-3 space-y-0.5 px-0.5">
        {craft && <p className="text-[0.7rem] font-semibold tracking-[0.16em] text-zari uppercase">{craft.label}</p>}
        <h3 className="font-sans text-[0.95rem] leading-snug transition-colors group-hover:text-accent">{product.title}</h3>
        <Price price={product.price} compareAt={product.compareAtPrice} className="text-[0.95rem] font-medium" />
      </div>
    </Link>
  );
}

export function ProductGrid({
  products,
  preloadFirst = 0,
  morph = true,
  columns = "full",
}: {
  products: Product[];
  preloadFirst?: number;
  morph?: boolean;
  /** "sidebar" leaves room for the desktop filter column. */
  columns?: "full" | "sidebar";
}) {
  const cols = columns === "sidebar" ? "md:grid-cols-3 xl:grid-cols-3" : "md:grid-cols-3 lg:grid-cols-4";
  return (
    <ul className={`grid grid-cols-2 gap-x-3 gap-y-9 md:gap-x-6 ${cols}`}>
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} preload={i < preloadFirst} morph={morph} index={i} />
        </li>
      ))}
    </ul>
  );
}
