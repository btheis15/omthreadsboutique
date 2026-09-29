import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { shopApi, shopperIp } from "@/lib/catalog";
import { formatPrice } from "@/lib/site";
import { AfterPayment } from "./AfterPayment";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

type Props = { searchParams: Promise<{ order?: string }> };

type Summary = {
  number: string;
  status: "paid" | "processing" | "awaiting" | "failed" | "expired" | "refunded";
  provider: "stripe" | "exodus";
  test: boolean;
  email: string | null;
  emailing: boolean;
  country: string;
  items: { title: string; option: string | null; quantity: number; unitCents: number }[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  shippingLabel: string | null;
};

const dollars = (cents: number) => formatPrice(cents / 100);

export default async function SuccessPage({ searchParams }: Props) {
  const { order } = await searchParams;
  let summary: Summary | null = null;
  if (order && /^[\w-]{10,64}$/.test(order)) {
    try {
      const { status, data } = await shopApi(`/api/checkout/order/${order}`, { shopperIp: shopperIp(await headers()) });
      if (status === 200) summary = data as unknown as Summary;
    } catch {
      /* shown as "we'll email you" below */
    }
  }

  if (!summary) {
    return (
      <div className="container-page max-w-xl py-20 text-center">
        <h1 className="text-4xl">Thank you</h1>
        <p className="mt-4 text-ink/80">We couldn&apos;t show your order just now, but if your payment went through you&apos;ll get a confirmation email shortly.</p>
        <Link href="/shop" className="btn btn-primary mt-8">
          Continue shopping
        </Link>
      </div>
    );
  }

  const paid = summary.status === "paid";
  const waiting = summary.status === "processing" || summary.status === "awaiting";
  return (
    <div className="container-page max-w-2xl pt-10 pb-20 md:pt-16">
      <AfterPayment clearCart={paid || summary.status === "processing"} keepChecking={waiting} />
      {summary.test && (
        <p className="mb-6 rounded-lg bg-sand p-3 text-sm">Test order: no real payment was taken.</p>
      )}
      <p className="text-sm uppercase tracking-[0.16em] text-muted">Order {summary.number}</p>
      <h1 className="mt-2 text-4xl md:text-5xl">
        {paid ? "Thank you for your order" : waiting ? "Confirming your payment…" : "Your payment didn't go through"}
      </h1>
      <p className="mt-4 leading-relaxed text-ink/85">
        {paid
          ? summary.emailing && summary.email
            ? `We've received your payment. Your receipt is on its way to ${summary.email}, and we'll email you again with tracking as soon as it ships.`
            : "We've received your payment. We'll be in touch with tracking as soon as it ships."
          : waiting
            ? summary.provider === "exodus"
              ? "Your stablecoin payment is being confirmed on the blockchain. This page updates by itself; you can also close it: we'll email you once it's confirmed."
              : "This usually takes a few seconds. This page updates by itself."
            : "Nothing was charged. Your cart is still saved, so you can try again."}
      </p>

      <ul className="mt-8 divide-y divide-line border-y border-line">
        {summary.items.map((i, n) => (
          <li key={n} className="flex justify-between gap-4 py-4">
            <span>
              {i.quantity > 1 ? `${i.quantity} × ` : ""}
              {i.title}
              {i.option && <span className="block text-sm text-muted">{i.option}</span>}
            </span>
            <span>{dollars(i.unitCents * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-1 text-[0.95rem]">
        <dt className="text-muted">Items</dt>
        <dd className="text-right">{dollars(summary.subtotalCents)}</dd>
        <dt className="text-muted">Shipping{summary.shippingLabel ? ` · ${summary.shippingLabel}` : ""}</dt>
        <dd className="text-right">{summary.shippingCents ? dollars(summary.shippingCents) : "Free"}</dd>
        {summary.taxCents > 0 && (
          <>
            <dt className="text-muted">Sales tax</dt>
            <dd className="text-right">{dollars(summary.taxCents)}</dd>
          </>
        )}
        <dt className="font-medium">Total</dt>
        <dd className="text-right font-medium">{dollars(summary.totalCents)}</dd>
      </dl>

      {summary.country === "IN" && paid && (
        <p className="mt-6 rounded-lg bg-sand p-4 text-sm leading-relaxed">
          Shipping to India: the carrier collects any import duty on delivery, and Indian customs will text or email you to upload ID (Aadhaar, PAN or passport) before releasing the parcel.
        </p>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/shop" className="btn btn-primary">
          Continue shopping
        </Link>
        {!paid && !waiting && (
          <Link href="/checkout" className="btn btn-outline">
            Back to checkout
          </Link>
        )}
      </div>
    </div>
  );
}
