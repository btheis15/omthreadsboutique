import type { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.png";
import { shopApi, shopperIp } from "@/lib/catalog";
import { site } from "@/lib/site";
import { EmailReceipt } from "./EmailReceipt";

export const metadata: Metadata = { title: "Your receipt", robots: { index: false } };

type Props = { params: Promise<{ token: string }> };

/** An in-person sale's receipt, from the Om Threads admin (GET /api/receipt/:token). Nothing about the customer. */
type Receipt = {
  number: string;
  paidAt: string;
  test: boolean;
  items: { title: string; option: string | null; quantity: number; unitCents: number }[];
  subtotalCents: number;
  discountCents: number;
  discountLabel: string | null;
  taxCents: number;
  totalCents: number;
  refundedCents: number;
  method: string;
  tenderedCents?: number;
  changeCents?: number;
  canEmail: boolean;
};

// A receipt shows the cents on every amount ($85.00, not $85).
const dollars = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * The receipt for a sale made in person: the customer scans the QR code on the seller's phone (the Sell app's
 * Paid screen) and it opens here, with "Email me this receipt". The link's token is the sale's own random one.
 */
export default async function ReceiptPage({ params }: Props) {
  const { token } = await params;
  let r: Receipt | null = null;
  if (/^[\w-]{10,64}$/.test(token)) {
    try {
      const { status, data } = await shopApi(`/api/receipt/${token}`, { shopperIp: shopperIp(await headers()) });
      if (status === 200) r = data as unknown as Receipt;
    } catch {
      /* shown below */
    }
  }
  if (!r) {
    return (
      <div className="container-page max-w-xl py-20 text-center">
        <h1 className="text-4xl">Receipt</h1>
        <p className="mt-4 text-ink/80">We couldn&apos;t find this receipt just now. Please try the link again in a moment.</p>
        <Link href="/shop" className="btn btn-primary mt-8">
          Visit the shop
        </Link>
      </div>
    );
  }
  const date = new Date(r.paidAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "America/Chicago" });
  return (
    <div className="container-page max-w-xl pt-10 pb-20 md:pt-16">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-4">
          <Image src={logo} alt="" width={64} height={64} className="h-16 w-16" />
          <div>
            <p className="font-display text-xl">{site.name}</p>
            <p className="text-sm text-muted">Receipt {r.number}</p>
          </div>
        </div>
        {r.test && <p className="mt-4 rounded-lg bg-sand p-3 text-sm">Practice sale: nothing real was charged.</p>}
        <p className="mt-5 text-sm text-muted">{date}</p>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {r.items.map((i, n) => (
            <li key={n} className="flex justify-between gap-4 py-3">
              <span>
                {i.quantity > 1 ? `${i.quantity} × ` : ""}
                {i.title}
                {i.option && <span className="text-muted"> · {i.option}</span>}
              </span>
              <span className="tabular-nums">{dollars(i.unitCents * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 text-[0.95rem]">
          <Row label="Subtotal" value={dollars(r.subtotalCents)} />
          {r.discountCents > 0 && <Row label={r.discountLabel ?? "Discount"} value={`−${dollars(r.discountCents)}`} />}
          <Row label="Sales tax" value={r.taxCents ? dollars(r.taxCents) : "none"} />
          <div className="flex justify-between border-t border-line pt-2 text-lg font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{dollars(r.totalCents)}</dd>
          </div>
          <Row label="Paid" value={r.method} />
          {r.tenderedCents ? <Row label="Cash given · change" value={`${dollars(r.tenderedCents)} · ${dollars(r.changeCents ?? 0)}`} /> : null}
          {r.refundedCents > 0 && <Row label="Refunded" value={`−${dollars(r.refundedCents)}`} />}
        </dl>
        <p className="mt-6 text-sm text-muted">Thank you for shopping with us. Save this page, or email it to yourself:</p>
        <EmailReceipt token={token} canEmail={r.canEmail} />
      </div>
      <p className="mt-8 text-center">
        <Link href="/shop" className="underline underline-offset-4">
          Visit the shop online
        </Link>
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/80">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
