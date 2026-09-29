"use client";

import { useEffect, useState } from "react";
import type { Product, ProductVariant } from "@/lib/types";
import { variantLabel, variantPrice } from "@/lib/variants";
import { cart } from "./cart/store";
import { ExternalIcon } from "./icons";

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

/** Slim sticky bar on phones so the main action is always within thumb reach. */
export function StickyBuyBar({ product, variant, onSiteCheckout, watchId }: Props & { watchId: string }) {
  // Only show once the main buttons have scrolled out of view.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = document.getElementById(watchId);
    if (!el) return;
    const io = new IntersectionObserver(([entry]) =>
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
    );
    io.observe(el);
    return () => io.disconnect();
  }, [watchId]);

  if ((variant ? variant.stock : product.stock) === 0) return null;
  const primaryIsEtsy = !onSiteCheckout && product.etsyUrl;
  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {primaryIsEtsy ? (
        <a href={product.etsyUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full">
          Buy on Etsy <ExternalIcon size={16} />
        </a>
      ) : (
        <button
          type="button"
          className="btn btn-primary w-full"
          onClick={() => addToCart(product, variant)}
        >
          Add to cart
        </button>
      )}
    </div>
  );
}
