"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { cart } from "@/components/cart/store";

/** Empties the cart once the order is paid (a bag set aside for a Hot Sale piece comes back), and re-checks while a payment is still confirming. */
export function AfterPayment({ clearCart, keepChecking }: { clearCart: boolean; keepChecking: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!clearCart) return;
    cart.clear();
    cart.bringBack();
  }, [clearCart]);
  useEffect(() => {
    if (!keepChecking) return;
    // Every 5 seconds for two minutes, then every 30 (a stablecoin payment can take a while).
    let n = 0;
    let t: ReturnType<typeof setTimeout>;
    const next = () => {
      t = setTimeout(() => {
        n++;
        router.refresh();
        if (n < 60) next();
      }, n < 24 ? 5000 : 30_000);
    };
    next();
    return () => clearTimeout(t);
  }, [keepChecking, router]);
  return null;
}
