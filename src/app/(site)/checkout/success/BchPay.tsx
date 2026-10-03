"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BCH_WALLETS, type BchPayment, type BchQuote } from "@/lib/bch";
import { wcProjectId } from "@/lib/bchWalletConnect";
import { Address, BchReceipt, CopyButton, dollars, QrCode, RollingAmount } from "./bchParts";
import { WalletPay } from "./WalletPay";

// The burst when the payment lands: threads in the logo's colors fly out from the tick.
const THREADS = ["#b8873a", "#a52b57", "#23706f", "#0ac18e", "#6f93b3", "#e2a93f"];
const BURST = Array.from({ length: 22 }, (_, i) => ({
  angle: i * (360 / 22) + ((i * 37) % 11) - 5,
  dist: 74 + ((i * 53) % 46),
  spin: ((i * 71) % 300) - 150,
  color: THREADS[i % THREADS.length],
  delay: (i % 4) * 18,
}));

function PaymentLanded() {
  return (
    <div className="bch-landed rounded-2xl border border-peacock bg-peacock/5 px-5 py-9 text-center" role="status" aria-live="polite">
      <div className="bch-landed-mark" aria-hidden="true">
        <span className="bch-landed-wave" />
        <span className="bch-landed-wave" style={{ animationDelay: "0.25s" }} />
        {BURST.map((b, i) => (
          <span
            key={i}
            className="bch-thread"
            style={{ "--a": `${b.angle}deg`, "--d": `${b.dist}px`, "--s": `${b.spin}deg`, background: b.color, animationDelay: `${180 + b.delay}ms` } as React.CSSProperties}
          />
        ))}
        <svg viewBox="0 0 64 64" className="bch-landed-tick">
          <circle cx="32" cy="32" r="30" fill="#0ac18e" />
          <path d="M19 33.5l8.5 8.5L45.5 23" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
        </svg>
      </div>
      <p className="bch-landed-text mt-6 font-display text-2xl">Payment received!</p>
      <p className="bch-landed-text mt-1 text-ink/75" style={{ animationDelay: "0.55s" }}>
        Thank you. Just a moment while we finish your order<span className="bch-dots" />
      </p>
    </div>
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
            <span className="font-medium">{coupon.stack ? "Have Om Threads tokens?" : "Have an Om Threads coupon token?"}</span>{" "}
            <span className="text-ink/80">{coupon.stack ? "Send them before you pay: each one takes Bitcoin Cash off." : "Send it before you pay and the discount comes off."}</span>
          </p>
          <button type="button" onClick={() => setShow(true)} className="btn btn-outline h-10 min-h-0 px-4 text-sm">
            {coupon.stack ? "Use my tokens" : "Use a coupon"}
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
          <div className="order-2 flex flex-col items-center gap-2 sm:order-1">
            <QrCode text={coupon.uri} size={176} label="QR code with the coupon address" />
            <p className="text-center text-sm text-muted">{coupon.stack ? "Scan to send your tokens" : "Scan to send your coupon"}</p>
          </div>
          <div className="order-1 min-w-0 sm:order-2">
            <p className="font-medium">{coupon.stack ? "Send your tokens to this address" : "Send your coupon token to this address"}</p>
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
              {coupon.stack ? "Send them from my wallet app" : "Send it from my wallet app"}
            </a>
            <p className="mt-2 text-sm leading-relaxed text-ink/80">
              {coupon.stack
                ? "Send them all at once or a few at a time. Each takes its Bitcoin Cash off in a few seconds, and the amount to pay updates by itself. Then pay as usual."
                : "It takes a few seconds: the discount appears above and the amount to pay updates by itself. Then pay as usual. One coupon per order; it comes back to us when you use it."}
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

  // Two ways to pay: connect a wallet (one tap, tokens and BCH together) or scan the QR code.
  const canConnect = Boolean(wcProjectId && bch.walletPay);
  const [method, setMethod] = useState<"wallet" | "qr">(canConnect ? "wallet" : "qr");
  const viaWallet = canConnect && method === "wallet";
  // What the wallet panel's token choice makes of the order (shown in the receipt as the slider moves).
  const [preview, setPreview] = useState<BchQuote | null>(null);

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

  /** Paid from the wallet: look now rather than at the next check. */
  async function checkNow() {
    try {
      const res = await fetch(`/api/checkout/status?order=${encodeURIComponent(token)}`, { cache: "no-store" });
      const data = (await res.json()) as { status: string; bch: BchPayment | null };
      if (data.status !== "awaiting_bch") router.refresh();
      else if (data.bch) setBch(data.bch);
    } catch {
      /* the regular check follows */
    }
  }

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
  const held = left === null ? 1 : Math.min(1, left / (bch.minutes * 60));

  return (
    <div className="mt-6">
      {test && (
        <p className="mb-5 rounded-lg border border-dashed border-zari bg-sand p-3 text-sm leading-relaxed">
          Test order: send just {dollars(bch.usdCents)} of real Bitcoin Cash. BCH has no test network, so this is a real (tiny) payment, and it goes to the shop&apos;s own wallet.
        </p>
      )}

      {bch.applied && (
        <p key={bch.applied.label} className="bch-rise mb-5 rounded-lg border border-peacock bg-peacock/5 p-3 text-[0.95rem]" style={{ animationDelay: "0s" }} role="status">
          <span className="font-medium">
            {bch.applied.bch ? "Tokens applied" : "Coupon applied"}: {bch.applied.label}
          </span>{" "}
          · {bch.applied.bch ? `${bch.applied.bch} BCH (${dollars(bch.applied.discountCents)})` : dollars(bch.applied.discountCents)} off. The amount below is your new total.
        </p>
      )}

      {open ? (
        <div className="bch-card overflow-hidden rounded-2xl border border-ink bg-ivory">
          {/* How long the price is held: a gold thread that runs down, turning rani in the last two minutes. */}
          <div className="h-1 bg-line/70" aria-hidden="true">
            <div className={`bch-hold h-full ${lowTime ? "low" : ""}`} style={{ width: `${held * 100}%` }} />
          </div>
          {canConnect && (
            <div className="bch-switch mx-5 mt-5 sm:mx-6" role="tablist" aria-label="How to pay">
              <span className="bch-switch-pill" style={{ transform: method === "wallet" ? "translateX(0)" : "translateX(100%)" }} aria-hidden="true" />
              <button type="button" role="tab" aria-selected={method === "wallet"} onClick={() => setMethod("wallet")}>
                Connect wallet
              </button>
              <button type="button" role="tab" aria-selected={method === "qr"} onClick={() => setMethod("qr")}>
                Scan QR code
              </button>
            </div>
          )}
          {viaWallet ? (
            <div key="wallet" className="p-5 sm:p-6">
              <WalletPay token={token} bch={bch} onPreview={setPreview} onSent={checkNow} />
              {left !== null && (
                <p className="mt-4 text-center text-sm text-muted">
                  Price held for{" "}
                  <span className={`tabular-nums ${lowTime ? "font-medium text-sale" : ""}`}>
                    {Math.floor(left / 60)}:{pad(left % 60)}
                  </span>
                </p>
              )}
            </div>
          ) : (
          <div key="qr" className="grid gap-6 p-5 sm:grid-cols-[auto_1fr] sm:p-6">
            <div className="bch-qr-card order-2 flex flex-col items-center sm:order-1">
              <QrCode text={bch.uri!} size={224} label="QR code with the payment address and amount" listening />
              <div className="mt-3 flex w-full items-baseline justify-between gap-3 px-1 text-[0.8rem] text-muted">
                <span>Scan with your wallet</span>
                <span className="flex items-center gap-1.5 font-display text-[0.7rem] uppercase tracking-[0.08em] text-zari">
                  <span className="bch-dot" aria-hidden="true" /> Bitcoin Cash
                </span>
              </div>
            </div>

            <div className="order-1 min-w-0 sm:order-2">
              {bch.state === "partial" && (
                <p className="bch-rise mb-4 rounded-lg bg-marigold/15 p-3 text-sm leading-relaxed">
                  We&apos;ve received {bch.paidBch} BCH. Please send the remaining <strong>{bch.amountBch} BCH</strong> to complete your order.
                </p>
              )}
              <p className="bch-rise text-sm uppercase tracking-[0.14em] text-muted">{bch.state === "partial" ? "Send the rest" : "Send exactly"}</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="whitespace-nowrap text-[1.75rem] font-medium tabular-nums sm:text-3xl">
                  <RollingAmount value={bch.amountBch!} /> <span className="bch-unit text-xl text-[#0a9e75]">BCH</span>
                </p>
                <CopyButton value={bch.amountBch!} label="amount" />
              </div>
              <p className="bch-rise mt-1 text-sm text-muted" style={{ animationDelay: "0.35s" }}>
                {bch.state === "partial" ? `Order total ${dollars(bch.usdCents)}` : `${dollars(bch.usdCents)} at today's rate`}
                {left !== null && (
                  <>
                    {" "}
                    ·{" "}
                    <span className={`tabular-nums ${lowTime ? "font-medium text-sale" : ""}`}>
                      price held for {Math.floor(left / 60)}:{pad(left % 60)}
                    </span>
                  </>
                )}
              </p>

              <p className="bch-rise mt-5 text-sm uppercase tracking-[0.14em] text-muted" style={{ animationDelay: "0.42s" }}>
                To this address
              </p>
              <div className="bch-rise mt-1 flex items-start justify-between gap-3" style={{ animationDelay: "0.48s" }}>
                <Address value={bch.address!} />
                <CopyButton value={bch.address!} label="address" />
              </div>

              <div className="bch-rise" style={{ animationDelay: "0.56s" }}>
                <a href={bch.uri!} className="btn btn-primary bch-open mt-6 w-full">
                  Open in my wallet app
                </a>
                <p className="mt-2 text-center text-xs text-muted">Opens Selene, Paytaca, Electron Cash or another BCH wallet with everything filled in.</p>
              </div>
            </div>
          </div>
          )}

          {(viaWallet && preview?.breakdown ? preview.breakdown : bch.breakdown) && (
            <BchReceipt
              breakdown={(viaWallet && preview?.breakdown ? preview.breakdown : bch.breakdown)!}
              paid={bch.state === "partial" ? bch.paidBch : null}
              left={bch.state === "partial" ? bch.amountBch : null}
            />
          )}

          <div className="flex items-center gap-3 border-t border-line bg-sand px-5 py-4 sm:px-6" role="status" aria-live="polite">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0ac18e] opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[#0ac18e]" />
            </span>
            <p className="text-[0.95rem]">
              <span className="font-medium">Watching the network for your payment.</span>{" "}
              <span className="text-ink/80">This page updates by itself the moment it arrives, usually within seconds.</span>
            </p>
          </div>
        </div>
      ) : bch.state === "arrived" ? (
        <PaymentLanded />
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

      {open && bch.coupon && !viaWallet && <CouponStep coupon={bch.coupon} />}

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
