"use client";

import Link from "next/link";
import { useState } from "react";
import { cart, useCart } from "@/components/cart/store";
import { ExternalIcon, ShieldIcon } from "@/components/icons";
import { ProductImage } from "@/components/ProductImage";
import { formatPrice, site } from "@/lib/site";

export function CheckoutView({ onSiteCheckout }: { onSiteCheckout: boolean }) {
  const { items, subtotal } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: items.map((i) => ({ productId: i.productId, qty: i.qty })) }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Couldn't reach checkout. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-page max-w-xl py-20 text-center">
        <h1 className="text-4xl">Your cart is empty</h1>
        <Link href="/shop" className="btn btn-primary mt-8">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl pt-10 md:pt-16">
      <h1 className="text-4xl md:text-5xl">Checkout</h1>

      {!onSiteCheckout && (
        <div className="mt-6 rounded-xl border border-line bg-sand p-5">
          <p className="font-medium">Online checkout is coming soon</p>
          <p className="mt-1 text-[0.95rem] text-ink/80">
            For now, please complete your purchase securely on Etsy. Tap <strong>Buy on Etsy</strong> next to each
            piece below.
          </p>
        </div>
      )}

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.productId} className="flex gap-4 py-5">
            <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-md bg-sand">
              <ProductImage image={item.image} sizes="80px" />
            </div>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href={`/product/${item.slug}`} className="hover:underline">
                  {item.title}
                </Link>
                <p className="text-sm text-muted">
                  Qty {item.qty} · {formatPrice(item.price * item.qty)}
                </p>
              </div>
              {!onSiteCheckout && (
                <a
                  href={item.etsyUrl || site.etsyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary h-10 min-h-0 self-start px-4 text-sm sm:self-auto"
                >
                  Buy on Etsy <ExternalIcon size={14} />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between text-lg">
        <span>Subtotal</span>
        <span className="font-medium">{formatPrice(subtotal)}</span>
      </div>

      {onSiteCheckout && (
        <>
          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-sale/10 p-3 text-sm text-sale">
              {error}
            </p>
          )}
          <button type="button" onClick={startCheckout} disabled={loading} className="btn btn-primary mt-6 w-full">
            {loading ? "Starting secure checkout…" : "Continue to secure payment"}
          </button>
          <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted">
            <ShieldIcon size={16} /> Payments are processed securely. We never see your card details.
          </p>
        </>
      )}

      <div className="mt-8 flex justify-between text-sm">
        <Link href="/shop" className="underline underline-offset-4">
          Continue shopping
        </Link>
        <button type="button" onClick={() => cart.clear()} className="text-muted underline underline-offset-4">
          Clear cart
        </button>
      </div>
    </div>
  );
}
