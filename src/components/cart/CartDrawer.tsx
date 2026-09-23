"use client";

import Link from "next/link";
import { useEffect } from "react";
import { formatPrice, site } from "@/lib/site";
import { CloseIcon, MinusIcon, PlusIcon } from "../icons";
import { ProductImage } from "../ProductImage";
import { cart, useCart } from "./store";

export function CartDrawer() {
  const { items, open, subtotal, count } = useCart();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cart.close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const remaining = site.freeShippingThreshold - subtotal;

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        onClick={() => cart.close()}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-ivory shadow-2xl transition-transform duration-300 ease-soft ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-line px-4 md:px-6">
          <h2 className="text-2xl">Your cart {count > 0 && <span className="text-muted">({count})</span>}</h2>
          <button
            type="button"
            className="-mr-2 grid size-11 place-items-center"
            aria-label="Close cart"
            onClick={() => cart.close()}
            tabIndex={open ? 0 : -1}
          >
            <CloseIcon />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="font-display text-2xl">Your cart is empty</p>
            <p className="text-muted">Find something soft to wrap yourself in.</p>
            <Link href="/shop" className="btn btn-primary" onClick={() => cart.close()} tabIndex={open ? 0 : -1}>
              Shop the collection
            </Link>
          </div>
        ) : (
          <>
            {site.freeShippingThreshold > 0 && (
              <div className="border-b border-line bg-sand px-4 py-3 text-center text-sm md:px-6">
                {remaining > 0 ? (
                  <>
                    You&apos;re <strong>{formatPrice(remaining)}</strong> away from free shipping
                  </>
                ) : (
                  <>You&apos;ve unlocked free shipping ✨</>
                )}
              </div>
            )}
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-4 md:px-6">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4 py-4">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={() => cart.close()}
                    tabIndex={open ? 0 : -1}
                    className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-md bg-sand"
                  >
                    <ProductImage image={item.image} sizes="80px" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-2">
                      <p className="text-[0.95rem] leading-snug">{item.title}</p>
                      <p className="shrink-0 font-medium">{formatPrice(item.price * item.qty)}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-line">
                        <button
                          type="button"
                          className="grid size-9 place-items-center"
                          aria-label={`Decrease quantity of ${item.title}`}
                          onClick={() => cart.setQty(item.productId, item.qty - 1)}
                          tabIndex={open ? 0 : -1}
                        >
                          <MinusIcon size={16} />
                        </button>
                        <span className="w-6 text-center text-sm" aria-live="polite">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          className="grid size-9 place-items-center disabled:opacity-40"
                          aria-label={`Increase quantity of ${item.title}`}
                          onClick={() => cart.setQty(item.productId, item.qty + 1)}
                          disabled={item.maxQty !== undefined && item.qty >= item.maxQty}
                          tabIndex={open ? 0 : -1}
                        >
                          <PlusIcon size={16} />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-sm text-muted underline underline-offset-4"
                        onClick={() => cart.remove(item.productId)}
                        tabIndex={open ? 0 : -1}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6">
              <div className="mb-1 flex justify-between text-lg">
                <span>Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <p className="mb-4 text-sm text-muted">Shipping and taxes calculated at checkout.</p>
              <Link
                href="/checkout"
                className="btn btn-primary w-full"
                onClick={() => cart.close()}
                tabIndex={open ? 0 : -1}
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
