import type { EtsyReview } from "@/lib/types";
import { EtsyReviewsButton } from "./EtsyReviewsButton";

/**
 * The shop's Etsy rating, said as it is (admin: Site settings). Hidden unless there is a rating and at least one review.
 * It is the shop's rating, not this piece's, and the words say so. Opens the Etsy reviews window when there are reviews to show.
 */
export function EtsyRatingLine({ rating, count, reviews = [], etsyUrl }: { rating?: number; count?: number; reviews?: EtsyReview[]; etsyUrl?: string }) {
  if (!rating || !count || count < 1) return null;
  const text = (
    <>
      <span className="text-marigold" aria-hidden>
        ★
      </span>{" "}
      {rating.toFixed(1)} shop rating on Etsy · {count} {count === 1 ? "review" : "reviews"}
    </>
  );
  return (
    <p className="mt-2 text-sm text-muted">
      {reviews.length > 0 && etsyUrl ? (
        <EtsyReviewsButton reviews={reviews} etsyUrl={etsyUrl} className="text-left underline decoration-line underline-offset-4 hover:text-ink">
          {text}
        </EtsyReviewsButton>
      ) : (
        text
      )}
    </p>
  );
}
