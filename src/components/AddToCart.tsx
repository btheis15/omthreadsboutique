"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/types";
import { cart } from "./cart/store";
import { ExternalIcon } from "./icons";

type Props = { product: Product; onSiteCheckout: boolean };

/**
 * Primary purchase buttons. While on-site payments are off, "Buy on Etsy"
 * is the main action and "Add to cart" lets shoppers build a wishlist-style
 * cart that hands off to Etsy at checkout.
 */
export function AddToCart({ product, onSiteCheckout }: Props) {
  const soldOut = product.stock === 0;

  const add = () =>
    cart.add({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      image: product.images[0],
      etsyUrl: product.etsyUrl,
      maxQty: product.stock,
    });

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
          Sold out
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
    </div>
  );
}

/** Slim sticky bar on phones so the main action is always within thumb reach. */
export function StickyBuyBar({ product, onSiteCheckout, watchId }: Props & { watchId: string }) {
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

  if (product.stock === 0) return null;
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
          onClick={() =>
            cart.add({
              productId: product.id,
              slug: product.slug,
              title: product.title,
              price: product.price,
              image: product.images[0],
              etsyUrl: product.etsyUrl,
              maxQty: product.stock,
            })
          }
        >
          Add to cart
        </button>
      )}
    </div>
  );
}
