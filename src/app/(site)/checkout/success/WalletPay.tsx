"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { BchPayment, BchQuote, BchWalletInfo } from "@/lib/bch";
import { connectWallet, declined, disconnectWallet, resumeWallet, signInWallet, type WalletSession } from "@/lib/bchWalletConnect";
import { CopyButton, dollars, QrCode, RollingAmount } from "./bchParts";

type Phase = "idle" | "starting" | "pairing" | "loading" | "ready" | "signing" | "sending" | "sent";

const post = async <T,>(path: string, body: Record<string, unknown>): Promise<T> => {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
};
const sats = (bch: string) => Math.round(Number(bch) * 1e8);
const shortAddress = (a: string) => {
  const body = a.replace(/^bitcoincash:/, "");
  return `${body.slice(0, 6)}…${body.slice(-6)}`;
};
/** A token amount (in its smallest unit) as wallets show it. Counts here stay small (never more than cover an order). */
const tokenCount = (base: number, decimals: number) => (decimals ? (base / 10 ** decimals).toFixed(decimals).replace(/\.?0+$/, "") : String(base));
// A phone (its wallet app is on the same device), as opposed to a computer the wallet scans.
const touch = () => window.matchMedia("(pointer: coarse)");
const subscribeTouch = (fn: () => void) => {
  const m = touch();
  m.addEventListener("change", fn);
  return () => m.removeEventListener("change", fn);
};

/**
 * "Connect wallet": the shopper connects Cashonize, Paytaca or Zapit, chooses how many of the shop's tokens
 * to spend (any number up to what they hold, never more than covers the items), sees the order in BCH
 * update as they go, and pays in one tap: the BCH and the tokens in one transaction, approved once in the wallet.
 */
export function WalletPay({ token, bch, onPreview, onSent }: { token: string; bch: BchPayment; onPreview: (q: BchQuote | null) => void; onSent: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [uri, setUri] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletSession | null>(null);
  const [info, setInfo] = useState<BchWalletInfo | null>(null);
  const [amount, setAmount] = useState(0);
  const [quote, setQuote] = useState<BchQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const offer = info?.tokens[0] ?? null;
  const max = offer ? Number(offer.max) : 0;

  const load = useCallback(
    async (w: WalletSession) => {
      setPhase("loading");
      setError(null);
      try {
        const i = await post<BchWalletInfo>("/api/checkout/bch/wallet", { token, address: w.address });
        setInfo(i);
        // Start with all the tokens that help; the shopper can use fewer.
        setAmount(i.tokens[0] ? Number(i.tokens[0].max) : 0);
        setPhase("ready");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setPhase("ready");
      }
    },
    [token],
  );

  // A wallet connected on an earlier visit comes back by itself.
  useEffect(() => {
    let live = true;
    resumeWallet()
      .then((w) => {
        if (live && w) {
          setWallet(w);
          void load(w);
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [load]);

  // The price for the tokens chosen, asked for a moment after the slider stops.
  useEffect(() => {
    if (phase !== "ready" || !info) return;
    let live = true;
    const t = setTimeout(async () => {
      try {
        const q = await post<BchQuote>("/api/checkout/bch/quote", { token, category: offer?.category ?? "", amount: amount.toString() });
        if (!live) return;
        setQuote(q);
        onPreview(q);
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : String(e));
      }
    }, 220);
    return () => {
      live = false;
      clearTimeout(t);
    };
    // The order's amount changing (e.g. a renewed price) asks again too.
  }, [phase, info, amount, offer?.category, token, onPreview, bch.amountBch]);

  async function connect() {
    setError(null);
    setPhase("starting");
    try {
      const w = await connectWallet((u) => {
        setUri(u);
        setPhase("pairing");
      });
      setUri(null);
      setWallet(w);
      await load(w);
    } catch (e) {
      setUri(null);
      setPhase("idle");
      setError(declined(e) ? "The connection was declined in your wallet." : "Couldn't connect. Please try again, or pay with the QR code instead.");
    }
  }

  async function disconnect() {
    if (wallet) await disconnectWallet(wallet);
    setWallet(null);
    setInfo(null);
    setQuote(null);
    onPreview(null);
    setPhase("idle");
  }

  async function pay() {
    if (!wallet) return;
    setError(null);
    setPhase("signing");
    try {
      const built = await post<{ request: unknown }>("/api/checkout/bch/build", { token, address: wallet.address, category: offer?.category ?? "", amount: amount.toString() });
      const hex = await signInWallet(wallet, built.request);
      setPhase("sending");
      await post("/api/checkout/bch/submit", { token, hex });
      setPhase("sent");
      onSent();
    } catch (e) {
      setPhase("ready");
      setError(declined(e) ? "You declined the payment in your wallet. Nothing was sent." : e instanceof Error ? e.message : String(e));
    }
  }

  const phone = useSyncExternalStore(subscribeTouch, () => touch().matches, () => false);
  const asked = quote?.amountBch ?? bch.amountBch ?? "0";
  const short = info ? sats(info.bch) < sats(asked) : false;
  const off = quote?.breakdown?.lines.find((l) => l.kind === "tokens");

  if (phase === "idle" || phase === "starting") {
    return (
      <div className="bch-wallet-intro">
        <button type="button" onClick={connect} disabled={phase === "starting"} className="bch-connect">
          <span className="bch-connect-glow" aria-hidden="true" />
          <span className="relative flex items-center gap-3">
            <WalletIcon />
            <span className="text-left">
              <span className="block text-lg font-medium">{phase === "starting" ? "Opening a connection…" : "Connect your wallet"}</span>
              <span className="block text-sm text-ivory/75">Pay in one tap{bch.coupon?.stack ? " and use your Om Threads tokens" : ""}</span>
            </span>
          </span>
        </button>
        <p className="mt-3 text-center text-xs text-muted">Works with Cashonize, Paytaca and Zapit. Your wallet shows the payment before anything is sent.</p>
        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-sale/10 p-3 text-sm text-sale">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (phase === "pairing" && uri) {
    return (
      <div className="bch-rise grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center" style={{ animationDelay: "0s" }}>
        {/* On a phone the wallet app is on the same device: its button comes first. */}
        <div className={`flex flex-col items-center ${phone ? "order-2" : ""}`}>
          <QrCode text={uri} size={232} label="QR code to connect your wallet" listening />
        </div>
        <div>
          <p className="text-lg font-medium">Scan with your wallet to connect</p>
          <p className="mt-1 text-sm leading-relaxed text-ink/80">
            In Cashonize, Paytaca or Zapit, scan this code (or tap the link below on your phone). Your wallet asks you to approve the connection; nothing is paid yet.
            <span className="bch-dots" />
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={uri} className="btn btn-primary h-11 min-h-0 px-5 text-sm">
              Open my wallet app
            </a>
            <a href={`https://cashonize.com/?uri=${encodeURIComponent(uri)}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline h-11 min-h-0 px-5 text-sm">
              Cashonize on the web
            </a>
            <CopyButton value={uri} label="connection link" />
          </div>
          <button type="button" onClick={() => setPhase("idle")} className="mt-4 text-sm text-muted underline underline-offset-4">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bch-wallet">
      <div className="bch-rise flex flex-wrap items-center justify-between gap-2" style={{ animationDelay: "0s" }}>
        <p className="flex items-center gap-2 text-sm">
          <span className="bch-dot" aria-hidden="true" />
          <span>
            Connected to <span className="font-medium">{wallet?.name}</span>
            {wallet?.address && <span className="font-mono text-muted"> · {shortAddress(wallet.address)}</span>}
          </span>
        </p>
        <button type="button" onClick={disconnect} className="text-sm text-muted underline underline-offset-4 hover:text-ink">
          Disconnect
        </button>
      </div>
      {info && (
        <p className="bch-rise mt-1 text-sm text-muted" style={{ animationDelay: "0.05s" }}>
          {info.bch} BCH in this wallet{offer ? ` · ${offer.haveText}` : ""}
        </p>
      )}

      {phase === "loading" && <div className="bch-skeleton mt-5 h-36 rounded-2xl" aria-label="Reading your wallet" />}

      {offer && phase !== "loading" && (
        <div className="bch-tokens bch-rise mt-5" style={{ animationDelay: "0.1s" }}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium">Use your {offer.label} tokens</p>
            <p className="text-sm text-[#087f5d]">{offer.value} BCH off each</p>
          </div>
          {max > 0 ? (
            <>
              <div className="mt-4 flex items-center gap-4">
                <button type="button" className="bch-step" onClick={() => setAmount((a) => Math.max(0, a - 1))} disabled={amount <= 0 || phase !== "ready"} aria-label="One fewer">
                  −
                </button>
                <p className="min-w-0 flex-1 text-center">
                  <span className="text-3xl font-medium tabular-nums">
                    <RollingAmount value={tokenCount(amount, offer.decimals)} />
                  </span>{" "}
                  <span className="text-muted">{offer.symbol ?? "tokens"}</span>
                </p>
                <button type="button" className="bch-step" onClick={() => setAmount((a) => Math.min(max, a + 1))} disabled={amount >= max || phase !== "ready"} aria-label="One more">
                  +
                </button>
              </div>
              <input
                type="range"
                className="bch-range mt-4 w-full"
                min={0}
                max={max}
                step={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                disabled={phase !== "ready"}
                aria-label={`How many ${offer.symbol ?? "tokens"} to use`}
                style={{ "--fill": `${max ? (amount / max) * 100 : 0}%` } as React.CSSProperties}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <button type="button" onClick={() => setAmount(0)} className="hover:text-ink">
                  None
                </button>
                <span>
                  {Number(offer.have) > max ? `${offer.maxText} cover the items` : `You have ${offer.haveText}`}
                </span>
                <button type="button" onClick={() => setAmount(max)} className="hover:text-ink">
                  All {tokenCount(max, offer.decimals)}
                </button>
              </div>
              <p className="mt-3 min-h-6 text-center text-sm text-[#087f5d]" aria-live="polite">
                {off && amount > 0 ? (
                  <>
                    Saves <span className="font-mono font-semibold">{off.bch} BCH</span> ({dollars(off.cents)})
                  </>
                ) : (
                  "Keep your tokens for another time"
                )}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">There are no {offer.symbol ?? offer.label} tokens in this wallet.</p>
          )}
        </div>
      )}

      {phase !== "loading" && (
        <div className="bch-rise mt-6" style={{ animationDelay: "0.16s" }}>
          <p className="text-sm uppercase tracking-[0.14em] text-muted">You pay</p>
          <p className="mt-1 text-3xl font-medium tabular-nums">
            <RollingAmount value={asked} /> <span className="text-xl text-[#087f5d]">BCH</span>
            {quote?.tokens && amount > 0 && <span className="ml-2 align-middle text-base text-muted">+ {quote.tokens.text}</span>}
          </p>
          {short && (
            <p className="mt-2 rounded-lg bg-marigold/15 p-3 text-sm">
              This wallet has {info?.bch} BCH, a little less than the payment needs. Add some, or pay with the QR code from another wallet.
            </p>
          )}
          <button type="button" onClick={pay} disabled={phase !== "ready" || !quote || short} className="btn btn-primary bch-open mt-5 w-full text-base">
            {phase === "signing" ? "Approve it in your wallet…" : phase === "sending" ? "Sending…" : phase === "sent" ? "Sent ✓" : `Pay ${asked} BCH${quote?.tokens && amount > 0 ? ` + ${quote.tokens.text}` : ""}`}
          </button>
          <p className="mt-2 text-center text-xs text-muted">
            {phase === "signing"
              ? `Check it in ${wallet?.name ?? "your wallet"}: ${asked} BCH${quote?.tokens && amount > 0 ? ` and ${quote.tokens.text}` : ""} to Om Threads, then approve.`
              : "One transaction, approved once in your wallet, plus a tiny network fee."}
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-sale/10 p-3 text-sm text-sale">
          {error}
        </p>
      )}
    </div>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" className="shrink-0">
      <rect x="3" y="8" width="26" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M7 8l13-4 2 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <rect x="20" y="14" width="9" height="6" rx="2" fill="#0ac18e" />
      <circle cx="23.5" cy="17" r="1.2" fill="#fff" />
    </svg>
  );
}
