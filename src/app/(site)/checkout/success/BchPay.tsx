"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { encode } from "uqr";
import { BCH_WALLETS, type BchPayment } from "@/lib/bch";
import { formatPrice } from "@/lib/site";

const dollars = (cents: number) => formatPrice(cents / 100);

/** The payment link as a QR code, drawn here (nothing is sent to a QR service). */
function QrCode({ text, size }: { text: string; size: number }) {
  const { d, n } = useMemo(() => {
    const qr = encode(text, { ecc: "M", border: 2 });
    let path = "";
    qr.data.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (!row[x]) continue;
        let run = 1;
        while (row[x + run]) run++;
        path += `M${x} ${y}h${run}v1h-${run}z`;
        x += run - 1;
      }
    });
    return { d: path, n: qr.size };
  }, [text]);
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} shapeRendering="crispEdges" role="img" aria-label="QR code with the payment address and amount">
      <rect width={n} height={n} fill="#ffffff" />
      <path d={d} fill="#2b1b12" />
    </svg>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement("textarea");
      el.value = value;
      document.body.append(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button type="button" onClick={copy} className="shrink-0 rounded-full border border-line bg-ivory px-3 py-1.5 text-sm hover:border-ink" aria-label={`Copy the ${label}`}>
      <span aria-live="polite">{copied ? "Copied ✓" : "Copy"}</span>
    </button>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "Have a coupon token?": send it to the order's token address and the price comes down. */
function CouponStep({ coupon }: { coupon: NonNullable<BchPayment["coupon"]> }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-zari bg-sand/60 p-5">
      {!show ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p>
            <span className="font-medium">Have an Om Threads coupon token?</span>{" "}
            <span className="text-ink/80">Send it before you pay and the discount comes off.</span>
          </p>
          <button type="button" onClick={() => setShow(true)} className="btn btn-outline h-10 min-h-0 px-4 text-sm">
            Use a coupon
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
          <div className="order-2 flex flex-col items-center gap-2 sm:order-1">
            <div className="rounded-xl border border-line bg-white p-2">
              <QrCode text={coupon.uri} size={168} />
            </div>
            <p className="text-center text-sm text-muted">Scan to send your coupon</p>
          </div>
          <div className="order-1 min-w-0 sm:order-2">
            <p className="font-medium">Send your coupon token to this address</p>
            <ul className="mt-2 space-y-1 text-[0.95rem]">
              {coupon.coupons.map((c) => (
                <li key={c.label}>
                  <span className="font-medium">{c.label}</span>: {c.off} <span className="text-muted">· send {c.send}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-start justify-between gap-3">
              <p className="min-w-0 break-all font-mono text-[0.85rem] leading-relaxed">{coupon.address}</p>
              <CopyButton value={coupon.address} label="coupon address" />
            </div>
            <a href={coupon.uri} className="btn btn-outline mt-4 w-full">
              Send it from my wallet app
            </a>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">
              It takes a few seconds: the discount appears above and the amount to pay updates by itself. Then pay as usual. One coupon per order; it comes back to us when you use it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// A clock that ticks every second once the page is in the browser (null while rendering on the server).
let clock = 0;
const subscribeClock = (onTick: () => void) => {
  clock = Date.now();
  const t = setInterval(() => {
    clock = Date.now();
    onTick();
  }, 1000);
  return () => clearInterval(t);
};
const clockNow = () => clock || null;
const noClock = () => null;

/**
 * The Bitcoin Cash payment screen: the amount and address (QR code on a
 * computer, "open in your wallet" on a phone), how long the price is held,
 * and the payment's status, which updates by itself. When the payment
 * arrives the page turns into the thank-you page.
 */
export function BchPay({ token, initial, test }: { token: string; initial: BchPayment; test: boolean }) {
  const router = useRouter();
  const [bch, setBch] = useState(initial);
  const now = useSyncExternalStore(subscribeClock, clockNow, noClock);
  const [renewing, setRenewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settled = bch.state === "expired_partial";
  const bchArriving = useRef(false);
  useEffect(() => {
    bchArriving.current = bch.state === "arrived";
  }, [bch.state]);
  useEffect(() => {
    let stop = false;
    let t: ReturnType<typeof setTimeout>;
    const check = async () => {
      try {
        const res = await fetch(`/api/checkout/status?order=${encodeURIComponent(token)}`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { status: string; bch: BchPayment | null };
          if (stop) return;
          // Paid, being confirmed, or closed: the page itself shows what comes next.
          if (data.status !== "awaiting_bch") return router.refresh();
          if (data.bch) {
            if (data.bch.applied && !bch.applied) router.refresh();
            setBch(data.bch);
          }
        }
      } catch {
        /* checked again shortly */
      }
      if (!stop) t = setTimeout(check, settled ? 15_000 : document.hidden ? 10_000 : bchArriving.current ? 1500 : 3000);
    };
    t = setTimeout(check, 3000);
    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [token, router, settled, bch.applied]);

  async function renew() {
    setRenewing(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/bch/renew", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setError(data.error ?? "Couldn't get a new price. Please try again.");
      else {
        const s = await fetch(`/api/checkout/status?order=${encodeURIComponent(token)}`, { cache: "no-store" });
        const next = (await s.json()) as { status: string; bch: BchPayment | null };
        if (next.status !== "awaiting_bch") router.refresh();
        else if (next.bch) setBch(next.bch);
      }
    } catch {
      setError("Couldn't reach checkout. Check your connection and try again.");
    }
    setRenewing(false);
  }

  const left = now !== null && bch.expiresAt ? Math.max(0, Math.floor((Date.parse(bch.expiresAt) - now) / 1000)) : null;
  const timeUp = left === 0;
  const open = (bch.state === "waiting" || bch.state === "partial") && !timeUp && bch.uri && bch.address && bch.amountBch;
  const lowTime = left !== null && left <= 120;

  return (
    <div className="mt-6">
      {test && (
        <p className="mb-5 rounded-lg border border-dashed border-zari bg-sand p-3 text-sm leading-relaxed">
          Test order: send just {dollars(bch.usdCents)} of real Bitcoin Cash. BCH has no test network, so this is a real (tiny) payment, and it goes to the shop&apos;s own wallet.
        </p>
      )}

      {bch.applied && (
        <p className="mb-5 rounded-lg border border-peacock bg-peacock/5 p-3 text-[0.95rem]" role="status">
          <span className="font-medium">Coupon applied: {bch.applied.label}</span> · {dollars(bch.applied.discountCents)} off. The amount below is your new total.
        </p>
      )}

      {open ? (
        <div className="overflow-hidden rounded-2xl border border-ink">
          <div className="grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:p-6">
            <div className="order-2 flex flex-col items-center gap-2 sm:order-1">
              <div className="rounded-xl border border-line bg-white p-2">
                <QrCode text={bch.uri!} size={208} />
              </div>
              <p className="text-center text-sm text-muted">Scan with your wallet app</p>
            </div>

            <div className="order-1 min-w-0 sm:order-2">
              {bch.state === "partial" && (
                <p className="mb-4 rounded-lg bg-marigold/15 p-3 text-sm leading-relaxed">
                  We&apos;ve received {bch.paidBch} BCH. Please send the remaining <strong>{bch.amountBch} BCH</strong> to complete your order.
                </p>
              )}
              <p className="text-sm uppercase tracking-[0.14em] text-muted">{bch.state === "partial" ? "Send the rest" : "Send exactly"}</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="text-3xl font-medium tabular-nums">
                  {bch.amountBch} <span className="text-xl">BCH</span>
                </p>
                <CopyButton value={bch.amountBch!} label="amount" />
              </div>
              <p className="mt-1 text-sm text-muted">
                {bch.state === "partial" ? `Order total ${dollars(bch.usdCents)}` : `${dollars(bch.usdCents)} at today's rate`}
                {left !== null && (
                  <>
                    {" "}
                    ·{" "}
                    <span className={lowTime ? "font-medium text-sale" : ""}>
                      price held for {Math.floor(left / 60)}:{pad(left % 60)}
                    </span>
                  </>
                )}
              </p>

              <p className="mt-5 text-sm uppercase tracking-[0.14em] text-muted">To this address</p>
              <div className="mt-1 flex items-start justify-between gap-3">
                <p className="min-w-0 break-all font-mono text-[0.9rem] leading-relaxed">{bch.address}</p>
                <CopyButton value={bch.address!} label="address" />
              </div>

              <a href={bch.uri!} className="btn btn-primary mt-6 w-full">
                Open in my wallet app
              </a>
              <p className="mt-2 text-center text-xs text-muted">Opens Selene, Paytaca, Electron Cash or another BCH wallet with everything filled in.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-line bg-sand px-5 py-4 sm:px-6" role="status" aria-live="polite">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-peacock opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-peacock" />
            </span>
            <p className="text-[0.95rem]">
              <span className="font-medium">Waiting for your payment.</span>{" "}
              <span className="text-ink/80">This page updates by itself the moment it arrives, usually within seconds.</span>
            </p>
          </div>
        </div>
      ) : bch.state === "arrived" ? (
        <div className="flex items-center gap-3 rounded-2xl border border-peacock bg-peacock/5 p-5" role="status" aria-live="polite">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-peacock opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-peacock" />
          </span>
          <p className="text-lg font-medium">Payment received! Just a moment…</p>
        </div>
      ) : bch.state === "checking" ? (
        <div className="rounded-2xl border border-ink p-5" role="status">
          <p className="text-lg font-medium">Payment received: the network is double-checking it</p>
          <p className="mt-1 leading-relaxed text-ink/80">This usually takes a few minutes. There&apos;s nothing more you need to do: this page updates by itself, and we&apos;ll email you once it&apos;s settled.</p>
        </div>
      ) : bch.state === "expired_partial" ? (
        <div className="rounded-2xl border border-ink p-5" role="status">
          <p className="text-lg font-medium">Part of your payment arrived</p>
          <p className="mt-1 leading-relaxed text-ink/80">
            We received {bch.paidBch} of {bch.totalBch} BCH before the price hold ended. Please don&apos;t send any more: we&apos;ll email you to either complete your order or send it back.{" "}
            <Link href="/contact" className="underline underline-offset-4">
              Contact us
            </Link>{" "}
            if you have any questions.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-ink p-5" role="status" aria-live="polite">
          {bch.state === "expired" ? (
            <>
              <p className="text-lg font-medium">The price hold has ended</p>
              <p className="mt-1 text-ink/80">Nothing was received, so nothing was charged. Bitcoin Cash prices move, so each one is held for {bch.minutes} minutes.</p>
              {bch.canRenew ? (
                <button type="button" onClick={renew} disabled={renewing} className="btn btn-primary mt-5 w-full sm:w-auto">
                  {renewing ? "Getting a new price…" : "Get a new price"}
                </button>
              ) : (
                <Link href="/checkout" className="btn btn-primary mt-5">
                  Back to checkout
                </Link>
              )}
            </>
          ) : (
            <>
              <p className="text-lg font-medium">Checking for your payment…</p>
              <p className="mt-1 text-ink/80">The price hold has just ended. If you sent the payment in time, it will show here in a moment. Please don&apos;t send it again.</p>
            </>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-sale/10 p-3 text-sm text-sale">
              {error}
            </p>
          )}
        </div>
      )}

      {open && bch.coupon && <CouponStep coupon={bch.coupon} />}

      <div className="mt-6 divide-y divide-line rounded-xl border border-line text-[0.95rem]">
        <details className="group px-4 py-3">
          <summary className="cursor-pointer list-none font-medium marker:hidden">
            Which wallet can I use? <span className="float-right text-muted group-open:rotate-45">+</span>
          </summary>
          <p className="mt-2 leading-relaxed text-ink/85">
            Any Bitcoin Cash wallet, for example{" "}
            {BCH_WALLETS.map((w, i) => (
              <span key={w.name}>
                <a href={w.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  {w.name}
                </a>
                {i < BCH_WALLETS.length - 2 ? ", " : i === BCH_WALLETS.length - 2 ? " or " : ""}
              </span>
            ))}
            . Exodus works too. Make sure you&apos;re sending Bitcoin Cash (BCH), not Bitcoin (BTC).
          </p>
        </details>
        <details className="group px-4 py-3">
          <summary className="cursor-pointer list-none font-medium marker:hidden">
            Paying from an exchange? <span className="float-right text-muted group-open:rotate-45">+</span>
          </summary>
          <p className="mt-2 leading-relaxed text-ink/85">
            Some exchanges take their fee out of the amount you send, so less than the full amount arrives. Send from your own wallet if you can, or check the exchange will deliver the exact amount shown. If it arrives short, this page shows what&apos;s left to send.
          </p>
        </details>
        <details className="group px-4 py-3">
          <summary className="cursor-pointer list-none font-medium marker:hidden">
            Is it safe? <span className="float-right text-muted group-open:rotate-45">+</span>
          </summary>
          <p className="mt-2 leading-relaxed text-ink/85">
            Your payment goes straight into our own wallet: there&apos;s no payment company in between, and we never see your wallet or its keys. Bitcoin Cash payments can&apos;t be reversed, so check the amount before you send. Questions?{" "}
            <Link href="/contact" className="underline underline-offset-4">
              Contact us
            </Link>
            .
          </p>
        </details>
      </div>
    </div>
  );
}
