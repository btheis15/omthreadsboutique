import { formatPrice } from "@/lib/site";

/** A price. On sale: the sale price in the sale color plus a small "N% off" tag (never the old price). */
export function Price({ price, compareAt, className = "" }: { price: number; compareAt?: number; className?: string }) {
  const onSale = compareAt !== undefined && compareAt > price;
  const pct = onSale ? Math.round((1 - price / compareAt) * 100) : 0;
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className={onSale ? "text-sale" : undefined}>
        {onSale && <span className="sr-only">Sale price </span>}
        {formatPrice(price)}
      </span>
      {onSale && pct > 0 && (
        <span className="rounded-full bg-sale/10 px-1.5 py-px text-[0.7em] font-medium whitespace-nowrap text-sale">
          <span className="sr-only">, </span>
          {pct}% off
        </span>
      )}
    </span>
  );
}
