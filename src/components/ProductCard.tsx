import Link from "next/link";
import { isSoldOut } from "@/lib/catalog";
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
  const tone = label === "Sale" ? "bg-sale text-white" : label === "Sold out" ? "bg-ink text-ivory" : "bg-ivory text-ink";
  return (
    <span className={`absolute top-2 left-2 z-10 rounded-full px-2.5 py-1 text-[0.7rem] font-medium tracking-wide ${tone}`}>
      {label}
    </span>
  );
}

export function ProductCard({ product, preload }: { product: Product; preload?: boolean }) {
  const [first, second] = product.images;
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-sand">
        <Badge product={product} />
        <ProductImage
          image={first}
          preload={preload}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className={`transition duration-700 ease-soft group-hover:scale-[1.03] ${isSoldOut(product) ? "opacity-70" : ""}`}
        />
        {second && (
          <ProductImage
            image={second}
            sizes="(min-width: 1024px) 25vw, 33vw"
            className="hidden opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:block"
          />
        )}
      </div>
      <div className="mt-3 space-y-1 px-0.5">
        <h3 className="font-sans text-[0.9rem] leading-snug md:text-[0.95rem]">{product.title}</h3>
        <Price price={product.price} compareAt={product.compareAtPrice} className="text-[0.9rem] font-medium" />
      </div>
    </Link>
  );
}

export function ProductGrid({ products, preloadFirst = 0 }: { products: Product[]; preloadFirst?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} preload={i < preloadFirst} />
        </li>
      ))}
    </ul>
  );
}
