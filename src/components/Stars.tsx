/** Read-only star row ("4 out of 5 stars" for screen readers). */
export function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  const n = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className={`text-marigold ${className}`} role="img" aria-label={`${n} out of 5 stars`}>
      <span aria-hidden>{"★".repeat(n)}<span className="text-line">{"★".repeat(5 - n)}</span></span>
    </span>
  );
}
