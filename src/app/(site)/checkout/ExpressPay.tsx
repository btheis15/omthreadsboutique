"use client";

import { Elements, ExpressCheckoutElement, useElements, useStripe } from "@stripe/react-stripe-js";
// "pure": Stripe.js is only fetched when loadStripe is called (the plain import adds it to every page that imports this file).
import { loadStripe } from "@stripe/stripe-js/pure";
import type { Stripe, StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import { useMemo, useRef, useState } from "react";
import { formatPrice, site } from "@/lib/site";

type Line = { productId: string; variantId?: string; qty: number };
type ExpressRate = { id: string; label: string; cents: number; taxCents: number; totalCents: number; minDays?: number | null; maxDays?: number | null };
type ExpressQuote = { quoteId: string; subtotalCents?: number; discountCents?: number; rates: ExpressRate[] };
type Props = {
  publishableKey: string;
  lines: Line[];
  /** Items total after any coupon, only used as the sheet's opening amount. */
  openingCents: number;
  coupon?: string;
  giftNote?: string;
  /** Countries the shop prices live (the wallet only offers these). */
  countries: string[];
};

// One Stripe.js load per key, and only once a checkout page actually offers the button.
const stripes = new Map<string, Promise<Stripe | null>>();
const stripeFor = (key: string) => {
  let p = stripes.get(key);
  if (!p) stripes.set(key, (p = loadStripe(key)));
  return p;
};

const dollars = (cents: number) => formatPrice(cents / 100);

/**
 * Apple Pay and Google Pay: the wallet already knows the shopper's address, so they skip the form.
 * Stripe's Express Checkout Element (deferred intent). Everything about money comes from the shop:
 * options and tax for the partial address while the sheet is open, the exact total when it is approved.
 * Shows nothing at all when no wallet is available on this device.
 */
export function ExpressPay(props: Props) {
  const [ready, setReady] = useState(false);
  const stripe = useMemo(() => stripeFor(props.publishableKey), [props.publishableKey]);
  // A changed cart or coupon starts the sheet over (the amount must match what the shop will charge).
  const key = JSON.stringify([props.lines, props.coupon]);
  return (
    <section className={ready ? "" : "h-0 overflow-hidden"} aria-label="Pay with Apple Pay or Google Pay">
      <Elements
        key={key}
        stripe={stripe}
        options={{
          mode: "payment",
          currency: "usd",
          amount: Math.max(50, props.openingCents),
          appearance: { variables: { borderRadius: "8px" } },
        }}
      >
        <Inner {...props} onReady={setReady} />
      </Elements>
      {ready && <p className="my-6 text-center text-sm text-muted">or enter your address</p>}
    </section>
  );
}

function Inner({ lines, openingCents, coupon, giftNote, countries, onReady }: Props & { onReady: (v: boolean) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const quote = useRef<ExpressQuote | null>(null);
  // Where the last quote was for (the partial address: country, state, ZIP).
  const place = useRef<string>("");
  // The option and total the sheet is showing right now. The shop is only ever asked to charge this total.
  const shown = useRef<{ rateId: string; total: number } | null>(null);

  // The shop's total for each option (items, coupon, that option's shipping and tax); the browser only adds nothing up.
  // After a "total changed" answer (the full street taxed differently) the shop's new total is remembered for that place
  // and option, so the next time the sheet opens it shows it (a new sheet re-quotes with new rate ids, hence the signature).
  // It's never used inside the sheet that failed: that sheet still shows the old total.
  const changed = useRef<Map<string, { total: number; tax: number }>>(new Map());
  const sig = (r: ExpressRate) => {
    const q = quote.current;
    return JSON.stringify([place.current, r.label, r.cents, r.taxCents, r.totalCents, q?.subtotalCents ?? null, q?.discountCents ?? null]);
  };
  const totalFor = (r: ExpressRate) => changed.current.get(sig(r))?.total ?? r.totalCents;
  const taxFor = (r: ExpressRate) => changed.current.get(sig(r))?.tax ?? r.taxCents;
  const show = (r: ExpressRate) => {
    shown.current = { rateId: r.id, total: totalFor(r) };
    elements?.update({ amount: Math.max(50, totalFor(r)) });
  };
  const lineItems = (r: ExpressRate) => [
    { name: "Items", amount: totalFor(r) - r.cents - taxFor(r) },
    { name: "Shipping", amount: r.cents },
    ...(taxFor(r) ? [{ name: "Sales tax", amount: taxFor(r) }] : []),
  ];
  const estimate = (r: ExpressRate) => {
    const min = r.minDays && r.minDays > 0 ? { unit: "business_day" as const, value: r.minDays } : undefined;
    const max = r.maxDays && r.maxDays > 0 ? { unit: "business_day" as const, value: r.maxDays } : undefined;
    return min || max ? { deliveryEstimate: { ...(min ? { minimum: min } : {}), ...(max ? { maximum: max } : {}) } } : {};
  };
  const sheetRate = (r: ExpressRate) => ({ id: r.id, displayName: r.label, amount: r.cents, ...estimate(r) });

  return (
    <div>
      <ExpressCheckoutElement
        options={{
          emailRequired: true,
          phoneNumberRequired: true,
          shippingAddressRequired: true,
          allowedShippingCountries: countries,
          business: { name: site.name },
          // Apple Pay and Google Pay only: Link and the other wallets stay off.
          paymentMethods: { applePay: "auto", googlePay: "auto", link: "never", paypal: "never", klarna: "never", amazonPay: "never" },
          buttonHeight: 48,
        }}
        onReady={({ availablePaymentMethods }) => onReady(Boolean(availablePaymentMethods && (availablePaymentMethods.applePay || availablePaymentMethods.googlePay)))}
        onClick={({ resolve }) => {
          setMessage(null);
          quote.current = null;
          shown.current = null;
          resolve({
            lineItems: [{ name: "Items", amount: Math.max(0, openingCents) }],
            // Replaced as soon as the wallet shares where it's going.
            shippingRates: [{ id: "pending", displayName: "Shipping", amount: 0 }],
          });
        }}
        onCancel={() => {
          quote.current = null;
          shown.current = null;
          elements?.update({ amount: Math.max(50, openingCents) });
        }}
        onShippingAddressChange={async ({ address, resolve, reject }) => {
          quote.current = null;
          shown.current = null;
          try {
            const res = await fetch("/api/express/rates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines, coupon, address }) });
            const data = (await res.json().catch(() => ({}))) as Partial<ExpressQuote> & { fallback?: boolean };
            if (!res.ok || data.fallback || !data.quoteId || !Array.isArray(data.rates) || !data.rates.length) return reject();
            const q = data as ExpressQuote;
            quote.current = q;
            place.current = JSON.stringify([address.country, address.state, address.postal_code].map((v) => String(v ?? "").toUpperCase().trim()));
            show(q.rates[0]);
            resolve({ shippingRates: q.rates.map(sheetRate), lineItems: lineItems(q.rates[0]) });
          } catch {
            reject();
          }
        }}
        onShippingRateChange={({ shippingRate, resolve, reject }) => {
          const q = quote.current;
          const r = q?.rates.find((x) => x.id === shippingRate.id);
          if (!q || !r) return reject();
          show(r);
          resolve({ lineItems: lineItems(r) });
        }}
        onConfirm={async (event: StripeExpressCheckoutElementConfirmEvent) => {
          const fail = (text: string, reason: "fail" | "invalid_shipping_address" = "fail") => {
            setMessage(text);
            event.paymentFailed({ reason, message: text });
          };
          const q = quote.current;
          const rateId = event.shippingRate?.id ?? shown.current?.rateId;
          const r = q?.rates.find((x) => x.id === rateId);
          // Only the total this sheet showed for this option is ever sent (never one learnt after it opened).
          if (!stripe || !elements || !q || !r || shown.current?.rateId !== r.id) return fail("Something went wrong with your shipping choice. Please try again.");
          const expected = shown.current.total;
          const { error: submitError } = await elements.submit();
          if (submitError) return fail(submitError.message ?? "Couldn't use that payment method.");
          const ship = event.shippingAddress;
          if (!ship) return fail("We need a shipping address to send this to.", "invalid_shipping_address");
          let order: { clientSecret?: string; orderToken?: string; totalCents?: number; taxCents?: number; code?: string; error?: string; errors?: Record<string, string> };
          try {
            const res = await fetch("/api/express/order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                lines,
                coupon,
                giftNote,
                quoteId: q.quoteId,
                rateId: r.id,
                name: event.billingDetails?.name ?? ship.name,
                email: event.billingDetails?.email,
                phone: event.billingDetails?.phone,
                shipping: { name: ship.name, address: ship.address },
                expectedTotalCents: expected,
              }),
            });
            order = await res.json().catch(() => ({}));
            // The shop's total moved (tax for the full address, a price): nothing was created or charged.
            // Show the new total; tapping the button again approves it.
            if (res.status === 409 && order.code === "total_changed" && typeof order.totalCents === "number") {
              changed.current.set(sig(r), { total: order.totalCents, tax: typeof order.taxCents === "number" ? order.taxCents : taxFor(r) });
              return fail(`With your full address the total is ${dollars(order.totalCents)} (sales tax). Nothing was charged. Tap the button again to pay the new total.`);
            }
          } catch {
            return fail("Couldn't reach checkout. Check your connection and try again.");
          }
          if (!order.clientSecret || !order.orderToken) {
            if (order.errors?.rate) quote.current = null;
            return fail(order.error ?? "Couldn't start the payment. Nothing was charged.", order.errors?.rate ? "invalid_shipping_address" : "fail");
          }
          // The shop's real total isn't what the sheet showed (tax with the full address, a price that moved):
          // never charge a different amount than the shopper approved; the unpaid order simply expires.
          if (order.totalCents !== expected) return fail(`The total changed to ${dollars(order.totalCents ?? 0)}, so nothing was charged. Please check your cart and try again.`);
          const { error } = await stripe.confirmPayment({
            elements,
            clientSecret: order.clientSecret,
            confirmParams: { return_url: `${window.location.origin}/checkout/success?order=${encodeURIComponent(order.orderToken)}` },
          });
          // Only reached when the payment didn't go through (otherwise the browser is sent to return_url).
          if (error) fail(error.message ?? "That payment didn't go through. Nothing was charged.");
        }}
      />
      {message && (
        <p role="alert" className="mt-3 rounded-lg bg-sale/10 p-3 text-sm text-sale">
          {message}
        </p>
      )}
    </div>
  );
}
