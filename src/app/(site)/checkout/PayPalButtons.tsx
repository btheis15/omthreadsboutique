"use client";

import { useEffect, useRef, useState } from "react";

/**
 * PayPal's own button (PayPal JavaScript SDK v6). The order was already
 * priced by the admin; pressing it makes PayPal's order, and approving it
 * collects the payment and opens the thank-you page.
 * No Venmo button here: in v6 Venmo exists only through the "venmo-payments"
 * component, which is deliberately not loaded (shoppers use the shop's own
 * Venmo option instead). https://developer.paypal.com/docsai/payments/methods/venmo/integrate
 */

type Session = { start: (options: { presentationMode: string }, order: Promise<{ orderId: string }>) => Promise<void> };
type Sdk = {
  findEligibleMethods: (o: { currencyCode: string }) => Promise<{ isEligible: (m: string) => boolean }>;
  createPayPalOneTimePaymentSession: (o: SessionOptions) => Session;
};
type SessionOptions = { onApprove: (d: { orderId: string }) => Promise<void>; onCancel: () => void; onError: (e: unknown) => void };
declare global {
  interface Window {
    paypal?: { createInstance: (o: { clientId: string; components: string[]; pageType: string }) => Promise<Sdk> };
  }
}

let sdkLoading: Promise<void> | null = null;
function loadSdk(src: string) {
  sdkLoading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      sdkLoading = null;
      reject(new Error("PayPal didn't load"));
    };
    document.head.append(s);
  });
  return sdkLoading;
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { orderId?: string; url?: string; paid?: boolean; error?: string };
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}

export function PayPalButtons({ token, clientId, sdkUrl, onMessage }: { token: string; clientId: string; sdkUrl: string; onMessage: (m: string | null) => void }) {
  const paypalRef = useRef<HTMLElement>(null);
  const [ready, setReady] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    const cleanups: (() => void)[] = [];
    (async () => {
      try {
        await loadSdk(sdkUrl);
        const sdk = await window.paypal!.createInstance({ clientId, components: ["paypal-payments"], pageType: "checkout" });
        const methods = await sdk.findEligibleMethods({ currencyCode: "USD" });
        if (cancelled) return;
        const options: SessionOptions = {
          async onApprove({ orderId }) {
            onMessage("Confirming your payment…");
            try {
              const r = await post("/api/checkout/paypal/approve", { token, orderId });
              window.location.href = r.url ?? "/checkout";
            } catch (e) {
              onMessage(e instanceof Error ? e.message : "We couldn't confirm the payment.");
            }
          },
          onCancel: () => onMessage("Payment cancelled. Nothing was charged."),
          onError: () => onMessage("PayPal couldn't complete the payment. Please try again, or choose another way to pay."),
        };
        const wire = (el: HTMLElement | null, method: "paypal", make: () => Session) => {
          if (!el || !methods.isEligible(method)) return;
          const session = make();
          const click = () => {
            onMessage(null);
            // Not awaited before start(): the browser only allows the payment window straight from the click.
            const order = post("/api/checkout/paypal", { token, fundingSource: method }).then((r) => ({ orderId: r.orderId! }));
            session.start({ presentationMode: "auto" }, order).catch(() => onMessage("PayPal couldn't open. Please try again."));
          };
          el.addEventListener("click", click);
          el.removeAttribute("hidden");
          cleanups.push(() => el.removeEventListener("click", click));
        };
        wire(paypalRef.current, "paypal", () => sdk.createPayPalOneTimePaymentSession(options));
        setReady("ready");
      } catch {
        if (!cancelled) setReady("failed");
      }
    })();
    return () => {
      cancelled = true;
      cleanups.forEach((c) => c());
    };
  }, [token, clientId, sdkUrl, onMessage]);

  return (
    <div className="mt-6 space-y-3">
      {ready === "loading" && <p className="text-center text-sm text-muted">Loading PayPal…</p>}
      {ready === "failed" && <p className="rounded-lg bg-sale/10 p-3 text-sm text-sale">PayPal didn&apos;t load. Check your connection, or choose another way to pay.</p>}
      <paypal-button ref={paypalRef} type="pay" hidden></paypal-button>
    </div>
  );
}
