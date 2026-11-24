"use client";

import { useEffect, useState } from "react";
import type { Product, ProductVariant } from "@/lib/types";
import { variantCompareAt, variantLabel, variantPrice } from "@/lib/variants";
import { american } from "@/lib/american";
import { cart } from "./cart/store";
import { ExternalIcon } from "./icons";
import { Price } from "./Price";

/** variant: the option chosen, for a product with options. */
type Props = { product: Product; variant?: ProductVariant; onSiteCheckout: boolean };

const addToCart = (product: Product, variant?: ProductVariant) =>
  cart.add({
    productId: product.id,
    variantId: variant?.id,
    option: variant ? variantLabel(variant) : undefined,
    slug: product.slug,
    title: product.title,
    price: variantPrice(product, variant),
    image: variant?.image ?? product.images[0],
    etsyUrl: product.etsyUrl,
    maxQty: variant ? variant.stock : product.stock,
  });

/**
 * Primary purchase buttons. While on-site payments are off, "Buy on Etsy"
 * is the main action and "Add to cart" lets shoppers build a wishlist-style
 * cart that hands off to Etsy at checkout.
 */
export function AddToCart({ product, variant, onSiteCheckout }: Props) {
  const soldOut = (variant ? variant.stock : product.stock) === 0;
  const add = () => addToCart(product, variant);

  const etsy = product.etsyUrl && (
    <a
      href={product.etsyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn w-full ${onSiteCheckout ? "btn-outline" : "btn-primary"}`}
    >
      Buy on Etsy <ExternalIcon size={16} />
    </a>
  );

  if (soldOut) {
    return (
      <div className="space-y-3">
        <button type="button" className="btn btn-primary w-full" disabled>
          {variant ? `${variantLabel(variant)} is sold out` : "Sold out"}
        </button>
        {product.etsyUrl && (
          <a href={product.etsyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline w-full">
            Check availability on Etsy <ExternalIcon size={16} />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {onSiteCheckout ? (
        <>
          <button type="button" className="btn btn-primary w-full" onClick={add}>
            Add to cart
          </button>
          {etsy}
        </>
      ) : (
        <>
          {etsy}
          <button type="button" className={`btn w-full ${etsy ? "btn-outline" : "btn-primary"}`} onClick={add}>
            Add to cart
          </button>
        </>
      )}
      {variant && etsy && (
        <p className="text-center text-sm text-muted">On Etsy, choose {variantLabel(variant)} before adding it to your basket.</p>
      )}
    </div>
  );
}

/**
 * Slim sticky bar on phones, from the first screen for every visitor: the price and one Add to cart (the same
 * add as the main button, so AddToCart fires). An Etsy-only piece keeps its Etsy link; a sold-out one shows nothing.
 */
export function StickyBuyBar({ product, variant, onSiteCheckout }: Props) {
  const soldOut = (variant ? variant.stock : product.stock) === 0;
  // Room under the page for the bar, so it never covers the footer's last line.
  useEffect(() => {
    if (soldOut) return;
    document.documentElement.classList.add("ad-bar");
    return () => document.documentElement.classList.remove("ad-bar");
  }, [soldOut]);
  // Slides in once the shopper starts scrolling, so the first screen keeps the photo, price and story in view.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (soldOut || shown) return;
    const onScroll = () => {
      if (window.scrollY > 24) setShown(true);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [soldOut, shown]);
  if (soldOut) return null;
  const primaryIsEtsy = !onSiteCheckout && product.etsyUrl;
  return (
    <div
      inert={!shown}
      className={`fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t border-line bg-ivory/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 ease-out md:hidden ${shown ? "translate-y-0" : "translate-y-full"}`}
    >
      <Price price={variantPrice(product, variant)} compareAt={variantCompareAt(product, variant)} className="shrink-0 text-lg font-medium" />
      {primaryIsEtsy ? (
        <a href={product.etsyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary min-w-0 flex-1">
          Buy on Etsy <ExternalIcon size={16} />
        </a>
      ) : (
        <button type="button" className="btn btn-primary min-w-0 flex-1" onClick={() => addToCart(product, variant)}>
          <span className="min-w-0 truncate">Add to cart{variant ? ` · ${american(variantLabel(variant))}` : ""}</span>
        </button>
      )}
    </div>
  );
}
