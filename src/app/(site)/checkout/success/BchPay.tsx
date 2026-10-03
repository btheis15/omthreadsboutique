"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import logo from "@/assets/logo.png";
import { BCH_WALLETS, type BchPayment, type BchQuote } from "@/lib/bch";
import { wcProjectId } from "@/lib/bchWalletConnect";
import { BchIcon, BchReceipt, dollars, RollingAmount } from "./bchParts";
import { PaySheet } from "./PaySheet";

// The burst when the payment lands: threads in the logo's colors fly out from the tick.
const THREADS = ["#b8873a", "#a52b57", "#23706f", "#e3bf80", "#6f93b3", "#e2a93f"];
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
          <circle cx="32" cy="32" r="30" fill="var(--color-peacock)" />
          <circle cx="32" cy="32" r="27" fill="none" stroke="var(--color-zari-light)" strokeWidth="1.5" />
          <path d="M19 33.5l8.5 8.5L45.5 23" fill="none" stroke="var(--color-ivory)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
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
export function BchPay({ token, initial, test, orderNo }: { token: string; initial: BchPayment; test: boolean; orderNo?: string }) {
  const router = useRouter();
  const [bch, setBch] = useState(initial);
  const now = useSyncExternalStore(subscribeClock, clockNow, noClock);
  const [renewing, setRenewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Om Threads Pay: one sheet with both ways to pay, connecting a wallet (one tap, tokens and BCH
  // together; when the site has a WalletConnect project) or any wallet (QR code or link).
  const canConnect = Boolean(wcProjectId && bch.walletPay);
  // What the token choice in the sheet makes of the order (shown in the receipt as the slider moves).
  const [preview, setPreview] = useState<BchQuote | null>(null);
  // The sheet slides up by itself when the shopper arrives from checkout (once per order).
  const [sheet, setSheet] = useState(false);
  const seen = `omt-pay-sheet:${token}`;
  useEffect(() => {
    if (initial.state !== "waiting") return;
    const remembered = (set?: boolean) => {
      try {
        if (set) sessionStorage.setItem(seen, "1");
        return Boolean(sessionStorage.getItem(seen));
      } catch {
        return false; // private browsing: it opens every time
      }
    };
    if (remembered()) return;
    const t = setTimeout(() => {
      remembered(true);
      setSheet(true);
    }, 450);
    return () => clearTimeout(t);
  }, [initial.state, seen]);
  // Back from the wallet app (or another tab): look at the payment straight away.
  useEffect(() => {
    const back = () => {
      if (document.visibilityState === "visible") void checkNowRef.current();
    };
    document.addEventListener("visibilitychange", back);
    return () => document.removeEventListener("visibilitychange", back);
  }, []);

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
  const checkNowRef = useRef(checkNow);
  useEffect(() => {
    checkNowRef.current = checkNow;
  });
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
        <p key={bch.applied.label} className="bch-rise mb-5 rounded-xl border border-peacock/40 bg-peacock/5 p-3 text-[0.95rem]" style={{ animationDelay: "0s" }} role="status">
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
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="bch-rise eyebrow flex items-center gap-1.5" style={{ animationDelay: "0.1s" }}>
                  <BchIcon size={14} /> {bch.state === "partial" ? "Left to pay" : "Pay with Bitcoin Cash"}
                </p>
                <p className="mt-2 font-display text-[2.4rem] leading-none whitespace-nowrap">
                  <RollingAmount value={bch.amountBch!} /> <span className="bch-unit text-2xl text-zari">BCH</span>
                </p>
                <p className="bch-rise mt-2 text-sm text-muted" style={{ animationDelay: "0.35s" }}>
                  {bch.state === "partial" ? `Order total ${dollars(bch.usdCents)}` : `${dollars(preview?.breakdown?.total.cents ?? bch.breakdown?.total.cents ?? bch.usdCents)} at today's rate`}
                  {left !== null && (
                    <>
                      {" "}
                      ·{" "}
                      <span className={`tabular-nums ${lowTime ? "font-medium text-sale" : ""}`}>
                        held {Math.floor(left / 60)}:{pad(left % 60)}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <Image src={logo} alt="" sizes="64px" className="bch-qr-pop-in size-16 shrink-0" />
            </div>
            {bch.state === "partial" && (
              <p className="bch-rise mt-4 rounded-xl bg-marigold/15 p-3 text-sm leading-relaxed">
                We&apos;ve received {bch.paidBch} BCH. Please send the remaining <strong>{bch.amountBch} BCH</strong> to complete your order.
              </p>
            )}
            <button type="button" onClick={() => setSheet(true)} className="bch-connect mt-6">
              <span className="bch-connect-glow" aria-hidden="true" />
              <span className="relative flex w-full items-center justify-between gap-3">
                <span className="text-left">
                  <span className="block font-display text-xl">Pay now</span>
                  <span className="block text-sm text-ivory/75">{canConnect ? "Connect your wallet, or scan with any wallet" : "Scan or open in any Bitcoin Cash wallet"}</span>
                </span>
                <BchIcon size={30} />
              </span>
            </button>
            <p className="mt-3 text-center text-xs text-muted">
              {bch.coupon?.stack ? "Use your Om Threads tokens in the next step. " : ""}Nothing is sent until you approve it in your wallet.
            </p>
          </div>

          {(preview?.breakdown ?? bch.breakdown) && (
            <BchReceipt
              breakdown={(preview?.breakdown ?? bch.breakdown)!}
              paid={bch.state === "partial" ? bch.paidBch : null}
              left={bch.state === "partial" ? bch.amountBch : null}
            />
          )}

          <div className="flex items-center gap-3 border-t border-line bg-sand px-5 py-4 sm:px-6" role="status" aria-live="polite">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-peacock opacity-50" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-peacock" />
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

      {/* Kept while it's up, so it can show "Paid" when the payment lands. */}
      {(open || sheet) && (
        <PaySheet
          open={sheet}
          onClose={() => setSheet(false)}
          token={token}
          bch={bch}
          orderNo={orderNo}
          left={left}
          canConnect={canConnect}
          onPreview={setPreview}
          onSent={checkNow}
        />
      )}

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
