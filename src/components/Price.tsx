import { formatPrice } from "@/lib/site";

/** A price. On sale: the sale price in the sale color, the regular price struck through beside it, and a small "N% off" tag. */
export function Price({ price, compareAt, className = "" }: { price: number; compareAt?: number; className?: string }) {
  const onSale = compareAt !== undefined && compareAt > price;
  const pct = onSale ? Math.round((1 - price / compareAt) * 100) : 0;
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className={onSale ? "text-sale" : undefined}>
        {onSale && <span className="sr-only">Sale price </span>}
        {formatPrice(price)}
      </span>
      {onSale && (
        <s className="text-[0.85em] text-muted">
          <span className="sr-only">Regular price </span>
          {formatPrice(compareAt)}
        </s>
      )}
      {onSale && pct > 0 && (
        <span className="rounded-full bg-sale/10 px-1.5 py-px text-[0.7em] font-medium whitespace-nowrap text-sale">
          <span className="sr-only">, </span>
          {pct}% off
        </span>
      )}
    </span>
  );
}
