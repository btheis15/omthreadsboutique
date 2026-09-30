"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { cart, useCart } from "@/components/cart/store";
import { ExternalIcon, ShieldIcon } from "@/components/icons";
import { ProductImage } from "@/components/ProductImage";
import { shippingCents } from "@/lib/payments-shared";
import { formatPrice, site } from "@/lib/site";
import type { CheckoutInfo } from "@/lib/types";
import { PayPalButtons } from "./PayPalButtons";

type Provider = CheckoutInfo["providers"][number];
// PayPal, crypto and Zelle need the address on this page (Stripe asks on its own page).
const asksAddress = (p: Provider) => p !== "stripe";
type Customer = { name: string; email: string; phone: string; line1: string; line2: string; city: string; state: string; postal_code: string };
const EMPTY: Customer = { name: "", email: "", phone: "", line1: "", line2: "", city: "", state: "", postal_code: "" };
const dollars = (cents: number) => formatPrice(cents / 100);

/**
 * The cart and, when the shop's own checkout is on, the way to pay: Stripe
 * (cards, Apple Pay, Google Pay, and UPI for shoppers in India) or Exodus
 * (USDC/USDT stablecoins). Without it, each piece links to Etsy.
 */
export function CheckoutView({
  checkout,
  cancelled,
  testerLink,
  returnDays,
}: {
  checkout: CheckoutInfo | null;
  cancelled: boolean;
  testerLink: "on" | "invalid" | null;
  returnDays: number;
}) {
  const { items, subtotal } = useCart();
  const onSite = Boolean(checkout);
  const [country, setCountry] = useState(checkout?.countries[0]?.code ?? "US");
  const [rateId, setRateId] = useState<string | undefined>(undefined);
  const [provider, setProvider] = useState<Provider>(checkout?.providers[0] ?? "stripe");
  const [testAsIndia, setTestAsIndia] = useState(false);
  const [customer, setCustomer] = useState<Customer>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  // After "Continue" with PayPal: the priced order, ready for PayPal's buttons.
  const [paypalOrder, setPaypalOrder] = useState<string | null>(null);
  const [paypalMessage, setPaypalMessage] = useState<string | null>(null);
  const onPayPalMessage = useCallback((m: string | null) => setPaypalMessage(m), []);

  const subtotalCents = items.reduce((n, i) => n + Math.round(i.price * 100) * i.qty, 0);
  const place = checkout?.countries.find((c) => c.code === country) ?? checkout?.countries[0];
  const rate = place?.rates.find((r) => r.id === rateId) ?? place?.rates[0];
  const shipping = rate ? shippingCents(rate, subtotalCents) : 0;
  const nextFree = useMemo(() => (rate && rate.freeOverCents !== null && shipping > 0 ? rate.freeOverCents - subtotalCents : null), [rate, shipping, subtotalCents]);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
          provider,
          country: place?.code,
          rateId: rate?.id,
          testAs: checkout?.mode === "test" && testAsIndia && place?.code === "IN" ? "IN" : undefined,
          customer:
            asksAddress(provider)
              ? { name: customer.name, email: customer.email, phone: customer.phone, address: { line1: customer.line1, line2: customer.line2, city: customer.city, state: customer.state, postal_code: customer.postal_code } }
              : undefined,
        }),
      });
      const data = (await res.json()) as { url?: string; paypal?: { token: string }; error?: string; errors?: Record<string, string> };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.paypal) {
        setPaypalOrder(data.paypal.token);
        setLoading(false);
        return;
      }
      setError(data.error ?? "Something went wrong. Please try again.");
      setFieldErrors(data.errors ?? {});
    } catch {
      setError("Couldn't reach checkout. Check your connection and try again.");
    }
    setLoading(false);
  }

  if (items.length === 0) {
    return (
      <div className="container-page max-w-xl py-20 text-center">
        {testerLink === "on" && <p className="mb-6 rounded-lg bg-sand p-3 text-sm">Tester link accepted: this browser now sees the test checkout. Add something to your cart to try it.</p>}
        <h1 className="text-4xl">Your cart is empty</h1>
        <Link href="/shop" className="btn btn-primary mt-8">
          Continue shopping
        </Link>
      </div>
    );
  }

  const field = (name: keyof Customer, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="mb-1 block text-sm">{label}</span>
      <input
        {...props}
        value={customer[name]}
        onChange={(e) => setCustomer({ ...customer, [name]: e.target.value })}
        aria-invalid={Boolean(fieldErrors[name])}
        className={`w-full rounded-lg border bg-ivory px-3 py-2.5 ${fieldErrors[name] ? "border-sale" : "border-line"}`}
      />
      {fieldErrors[name] && <span className="mt-1 block text-sm text-sale">{fieldErrors[name]}</span>}
    </label>
  );

  return (
    <div className="container-page max-w-3xl pt-10 pb-16 md:pt-16">
      <h1 className="text-4xl md:text-5xl">Checkout</h1>

      {testerLink === "invalid" && (
        <p className="mt-6 rounded-lg bg-sale/10 p-3 text-sm text-sale">That tester link is out of date. Copy the current one from the admin (Orders → Checkout setup).</p>
      )}
      {checkout?.mode === "test" && (
        <div className="mt-6 rounded-xl border border-dashed border-zari bg-sand p-4 text-[0.95rem]">
          <p className="font-medium">Test mode: only you can see this checkout.</p>
          <p className="mt-1 text-ink/80">
            Pay with the test card 4242 4242 4242 4242, any future date and any 3 digits. No real money moves, and your stock and Etsy aren&apos;t changed.{" "}
            <a href="/api/tester?off=1" className="underline underline-offset-4">
              Leave test mode
            </a>
          </p>
        </div>
      )}
      {cancelled && onSite && <p className="mt-6 rounded-lg bg-sand p-3 text-sm">Payment cancelled. Nothing was charged, and your cart is still here.</p>}

      {!onSite && (
        <div className="mt-6 rounded-xl border border-line bg-sand p-5">
          <p className="font-medium">Online checkout is coming soon</p>
          <p className="mt-1 text-[0.95rem] text-ink/80">
            For now, please complete your purchase securely on Etsy. Tap <strong>Buy on Etsy</strong> next to each piece below.
          </p>
        </div>
      )}

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.key} className="flex gap-4 py-5">
            <div className="relative aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-md bg-sand">
              <ProductImage image={item.image} sizes="80px" />
            </div>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href={`/product/${item.slug}`} className="hover:underline">
                  {item.title}
                </Link>
                {item.option && <p className="text-sm text-muted">{item.option}</p>}
                <p className="text-sm text-muted">
                  Qty {item.qty} · {formatPrice(item.price * item.qty)}
                </p>
              </div>
              {!onSite && (
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

      {!onSite && (
        <div className="mt-6 flex items-center justify-between text-lg">
          <span>Subtotal</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
      )}

      {checkout && place && rate && (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="text-xl">Shipping</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm">Ship to</span>
                <select
                  value={place.code}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    setRateId(undefined);
                  }}
                  className="w-full rounded-lg border border-line bg-ivory px-3 py-2.5"
                >
                  {checkout.countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {place.rates.length > 1 ? (
                <label className="block">
                  <span className="mb-1 block text-sm">Delivery</span>
                  <select value={rate.id} onChange={(e) => setRateId(e.target.value)} className="w-full rounded-lg border border-line bg-ivory px-3 py-2.5">
                    {place.rates.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label} · {shippingCents(r, subtotalCents) ? dollars(shippingCents(r, subtotalCents)) : "Free"}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="self-end pb-2.5 text-[0.95rem]">
                  {rate.label} · {shipping ? dollars(shipping) : "Free"}
                </div>
              )}
            </div>
            <p className="mt-2 text-sm text-muted">
              Arrives in about {rate.minDays}–{rate.maxDays} business days after it ships.
              {nextFree !== null && nextFree > 0 && ` Add ${dollars(nextFree)} more for free shipping.`}
            </p>
            {place.code === "IN" && (
              <p className="mt-3 rounded-lg bg-sand p-3 text-sm leading-relaxed">
                Shipping to India: any import duty is paid on delivery, and Indian customs asks the recipient for ID (Aadhaar, PAN or passport) before releasing the parcel.
              </p>
            )}
          </section>

          {checkout.providers.length > 1 && (
            <section>
              <h2 className="text-xl">Pay with</h2>
              <div className="mt-3 grid gap-2" role="radiogroup" aria-label="Pay with">
                {checkout.providers.map((p) => (
                  <label key={p} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${provider === p ? "border-ink" : "border-line"}`}>
                    <input
                      type="radio"
                      name="provider"
                      checked={provider === p}
                      onChange={() => {
                        setProvider(p);
                        setPaypalOrder(null);
                        setPaypalMessage(null);
                      }}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-medium">
                        {p === "stripe"
                          ? `Card, Apple Pay or Google Pay${place.code === "IN" ? ", or UPI" : ""}`
                          : p === "paypal"
                            ? place.code === "US"
                              ? "PayPal or Venmo"
                              : "PayPal"
                            : p === "exodus"
                              ? "Exodus Pay or another crypto wallet"
                              : "Zelle"}
                      </span>
                      <span className="block text-sm text-muted">
                        {p === "stripe"
                          ? place.code === "IN"
                            ? "Secure checkout by Stripe. Shoppers in India see rupees and can pay by UPI."
                            : "Secure checkout by Stripe."
                          : p === "paypal"
                            ? "Pay with your PayPal or Venmo account, in PayPal's own window."
                            : p === "exodus"
                              ? `Pay in ${checkout.exodusCoins || "USDC or USDT"} from Exodus Pay, MetaMask, Phantom or any wallet, on Exodus's secure page.`
                              : `Place the order, then send the payment from your bank's Zelle. We hold it for you for ${checkout.zelle?.holdHours ?? 48} hours and ship once it arrives.`}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {asksAddress(provider) && (
            <section>
              <h2 className="text-xl">Your details</h2>
              <p className="mt-1 text-sm text-muted">Where we ship it, and how to send your receipt.</p>
              <fieldset disabled={Boolean(paypalOrder)} className="mt-3 grid gap-3 disabled:opacity-60 sm:grid-cols-2">
                {field("name", "Full name", { autoComplete: "name" })}
                {field("email", "Email", { type: "email", autoComplete: "email" })}
                {field("phone", "Phone", { type: "tel", autoComplete: "tel" })}
                <div className="hidden sm:block" />
                {field("line1", "Address", { autoComplete: "address-line1" })}
                {field("line2", "Apartment, suite (optional)", { autoComplete: "address-line2" })}
                {field("city", "City", { autoComplete: "address-level2" })}
                {field("state", place.code === "US" ? "State" : "State / region", { autoComplete: "address-level1", placeholder: place.code === "US" ? "IL" : undefined })}
                {field("postal_code", place.code === "US" ? "ZIP code" : place.code === "IN" ? "PIN code" : "Postal code", { autoComplete: "postal-code", inputMode: place.code === "US" || place.code === "IN" ? "numeric" : undefined })}
              </fieldset>
            </section>
          )}

          <section>
            <dl className="grid grid-cols-[1fr_auto] gap-y-1 border-t border-line pt-4 text-[0.95rem]">
              <dt className="text-muted">Items</dt>
              <dd className="text-right">{dollars(subtotalCents)}</dd>
              <dt className="text-muted">Shipping</dt>
              <dd className="text-right">{shipping ? dollars(shipping) : "Free"}</dd>
              <dt className="text-lg font-medium">Total</dt>
              <dd className="text-right text-lg font-medium">{dollars(subtotalCents + shipping)}</dd>
            </dl>
            {checkout.taxAdded && <p className="mt-1 text-sm text-muted">Sales tax, where it applies, is added on the payment page.</p>}

            {checkout.mode === "test" && provider === "stripe" && place.code === "IN" && (
              <label className="mt-4 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={testAsIndia} onChange={(e) => setTestAsIndia(e.target.checked)} />
                Test as a shopper in India (shows rupees and UPI on Stripe&apos;s page)
              </label>
            )}

            {error && (
              <p role="alert" className="mt-4 rounded-lg bg-sale/10 p-3 text-sm text-sale">
                {error}
              </p>
            )}
            {provider === "paypal" && paypalOrder && checkout.paypal ? (
              <>
                <PayPalButtons token={paypalOrder} clientId={checkout.paypal.clientId} sdkUrl={checkout.paypal.sdkUrl} onMessage={onPayPalMessage} />
                {paypalMessage && <p className="mt-3 text-center text-sm">{paypalMessage}</p>}
                <button type="button" onClick={() => setPaypalOrder(null)} className="mt-3 w-full text-sm text-muted underline underline-offset-4">
                  Change the address or cart
                </button>
              </>
            ) : (
              <button type="button" onClick={startCheckout} disabled={loading} className="btn btn-primary mt-6 w-full">
                {loading
                  ? "Starting secure checkout…"
                  : provider === "exodus"
                    ? "Continue to Exodus Pay"
                    : provider === "paypal"
                      ? place.code === "US"
                        ? "Continue to PayPal or Venmo"
                        : "Continue to PayPal"
                      : provider === "zelle"
                        ? "Place order and get the Zelle details"
                        : "Continue to secure payment"}
              </button>
            )}
            <p className="mt-3 flex items-center justify-center gap-2 text-center text-sm text-muted">
              <ShieldIcon size={16} />{" "}
              {provider === "exodus"
                ? "You pay on Exodus's page, from your own wallet."
                : provider === "paypal"
                  ? "You pay in PayPal's own window. We never see your PayPal or card details."
                  : provider === "zelle"
                    ? "You send it from your own bank's app. Zelle payments can't be reversed, so check the details before sending."
                    : "Payments are processed by Stripe. We never see your card details."}
            </p>
            <p className="mt-1 text-center text-sm text-muted">
              <Link href="/policies/returns" className="underline underline-offset-4">
                {returnDays}-day returns
              </Link>{" "}
              ·{" "}
              <Link href="/policies/shipping" className="underline underline-offset-4">
                Shipping
              </Link>
            </p>
          </section>
        </div>
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
