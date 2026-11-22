"use client";

import { useEffect, useRef, useState } from "react";
import { ExpressPay } from "@/app/(site)/checkout/ExpressPay";
import type { ProductExpress } from "@/lib/payments";
import type { Product, ProductVariant } from "@/lib/types";
import { variantLabel, variantPrice } from "@/lib/variants";
import { cart, cartKey, useCart } from "./cart/store";

/**
 * Apple Pay / Google Pay "Buy now" for the piece (and color) on the page, quantity 1: the same wallet button and
 * `/api/express/*` routes as the checkout page. Shows nothing unless this device has a wallet. Stripe.js is only
 * fetched after the page has settled, so it never slows the first view.
 *
 * Paying this way leaves the shopper's bag alone: it is set aside for the payment (as a Hot Sale piece does) and
 * comes back on the receipt page, or right away if the payment doesn't go through.
 */
export function ProductExpressBuy({ product, variant, express }: { product: Product; variant?: ProductVariant; express: ProductExpress | null }) {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!express) return;
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const t = ric ? ric(() => setSettled(true), { timeout: 3000 }) : window.setTimeout(() => setSettled(true), 1500);
    return () => {
      if (ric) (window as unknown as { cancelIdleCallback?: (n: number) => void }).cancelIdleCallback?.(t);
      else clearTimeout(t);
    };
  }, [express]);

  const { items } = useCart();
  const bag = useRef(items);
  useEffect(() => {
    bag.current = items;
  }, [items]);
  const before = useRef<{ key: string; qty: number } | null>(null);

  const stock = variant ? variant.stock : product.stock;
  if (!express || !settled || stock === 0) return null;

  const price = variantPrice(product, variant);
  const line = { productId: product.id, variantId: variant?.id, qty: 1 };
  const key = cartKey(product.id, variant?.id);
  return (
    <div className="mb-3" data-express-buy>
      <ExpressPay
        bare
        publishableKey={express.publishableKey}
        lines={[line]}
        openingCents={Math.round(price * 100)}
        countries={express.countries}
        onBeforePay={() => {
          const had = bag.current.find((i) => i.key === key);
          before.current = had ? { key, qty: had.qty } : { key, qty: 0 };
          cart.buyAlone([
            {
              productId: product.id,
              variantId: variant?.id,
              option: variant ? variantLabel(variant) : undefined,
              slug: product.slug,
              title: product.title,
              price,
              image: variant?.image ?? product.images[0],
              etsyUrl: product.etsyUrl,
              maxQty: stock,
              qty: 1,
            },
          ]);
        }}
        onPayFailed={() => {
          // Put the bag back as it was.
          cart.bringBack();
          const b = before.current;
          if (!b) return;
          if (b.qty > 0) cart.setQty(b.key, b.qty);
          else cart.remove(b.key);
          before.current = null;
        }}
      />
    </div>
  );
}
