/**
 * The shop's Etsy rating, said as it is (admin: Site settings). Hidden unless there is a rating and at least one review.
 * It is the shop's rating, not this piece's, and the words say so.
 */
export function EtsyRatingLine({ rating, count }: { rating?: number; count?: number }) {
  if (!rating || !count || count < 1) return null;
  return (
    <p className="mt-2 text-sm text-muted">
      <span className="text-marigold" aria-hidden>
        ★
      </span>{" "}
      {rating.toFixed(1)} shop rating on Etsy · {count} {count === 1 ? "review" : "reviews"}
    </p>
  );
}
