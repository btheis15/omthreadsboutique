"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buyNowHref } from "@/lib/ad-landing";
import type { Product, ProductVariant } from "@/lib/types";
import { variantCompareAt, variantPrice } from "@/lib/variants";
import { Price } from "../Price";

/**
 * The phone bottom bar for a shopper who arrived from an ad: the price and one "Buy now" that goes straight to
 * the checkout for this piece in the chosen color. It's there from the first screen (not only after scrolling).
 */
export function AdBuyBar({ product, variant, coupon }: { product: Product; variant?: ProductVariant; coupon?: string }) {
  // Room under the page for the bar, so it never covers the footer's last line.
  useEffect(() => {
    document.documentElement.classList.add("ad-bar");
    return () => document.documentElement.classList.remove("ad-bar");
  }, []);
  if ((variant ? variant.stock : product.stock) === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-line bg-ivory/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <Price price={variantPrice(product, variant)} compareAt={variantCompareAt(product, variant)} className="shrink-0 text-lg font-medium" />
      <Link href={buyNowHref(product, variant, coupon)} prefetch={false} className="btn btn-primary min-w-0 flex-1">
        Buy now
      </Link>
    </div>
  );
}
