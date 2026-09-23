import { formatPrice } from "@/lib/site";

export function Price({ price, compareAt, className = "" }: { price: number; compareAt?: number; className?: string }) {
  const onSale = compareAt !== undefined && compareAt > price;
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className={onSale ? "text-sale" : undefined}>
        {onSale && <span className="sr-only">Sale price </span>}
        {formatPrice(price)}
      </span>
      {onSale && (
        <s className="text-[0.9em] text-muted">
          <span className="sr-only">Original price </span>
          {formatPrice(compareAt)}
        </s>
      )}
    </span>
  );
}
