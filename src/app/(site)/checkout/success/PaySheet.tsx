"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import logo from "@/assets/logo.png";
import type { BchPayment, BchQuote, BchWalletInfo } from "@/lib/bch";
import { Cancelled, declined, disconnectWallet, resumeWallet, signInWallet, startConnection, walletAppLink, type WalletSession } from "@/lib/bchWalletConnect";
import { CopyButton, dollars, QrCode, RollingAmount } from "./bchParts";

type Phase = "starting" | "connecting" | "loading" | "review" | "approving" | "sending" | "done";

const post = async <T,>(path: string, body: Record<string, unknown>): Promise<T> => {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
};
const sats = (bch: string) => Math.round(Number(bch) * 1e8);
const shortAddress = (a: string) => {
  const body = a.replace(/^bitcoincash:/, "");
  return `${body.slice(0, 5)}…${body.slice(-5)}`;
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
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The payment sheet: slides up over the page like Apple Pay. The shopper connects their wallet once
 * (Cashonize, Paytaca, Zapit), sees what's in it, chooses how many of the shop's tokens to spend, checks
 * the total, and pays: one approval in the wallet sends the BCH and the tokens together in one
 * transaction. Until they approve, they can change the tokens, or cancel and nothing is sent.
 */
export function PaySheet({
  open,
  onClose,
  token,
  bch,
  orderNo,
  left,
  onPreview,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  bch: BchPayment;
  orderNo?: string;
  left: number | null;
  onPreview: (q: BchQuote | null) => void;
  onSent: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("starting");
  const [uri, setUri] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [wallet, setWallet] = useState<WalletSession | null>(null);
  const [info, setInfo] = useState<BchWalletInfo | null>(null);
  const [amount, setAmount] = useState(0);
  const [quote, setQuote] = useState<BchQuote | null>(null);
  const [details, setDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [drag, setDrag] = useState(0);
  const dragFrom = useRef<number | null>(null);
  const abort = useRef<AbortController | null>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const phone = useSyncExternalStore(subscribeTouch, () => touch().matches, () => false);
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
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
      setPhase("review");
    },
    [token],
  );

  // Opening: the wallet connected before comes back by itself; otherwise a new connection is offered.
  const begin = useCallback(async () => {
    setError(null);
    setPhase("starting");
    try {
      const known = await resumeWallet();
      if (known) {
        setWallet(known);
        return load(known);
      }
      const c = await startConnection();
      setUri(c.uri);
      setPhase("connecting");
      const w = await c.connected;
      setUri(null);
      setWallet(w);
      await load(w);
    } catch (e) {
      setUri(null);
      setPhase("connecting");
      setError(declined(e) ? "The connection was declined in your wallet." : "Couldn't connect to a wallet just now. Try again, or pay with the QR code.");
    }
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setClosing(false);
      if (!wallet) void begin();
    }, 0);
    document.body.style.overflow = "hidden";
    sheet.current?.focus();
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
    // Only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // The order moved on underneath (paid from another device, or the price hold ended): the sheet steps aside.
  const payable = bch.state === "waiting" || bch.state === "partial";
  useEffect(() => {
    if (!open || payable || phase === "approving" || phase === "sending" || phase === "done") return;
    const t = setTimeout(close, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payable, phase]);

  // The price for the tokens chosen, asked a moment after the stepper or slider stops.
  useEffect(() => {
    if (!open || phase !== "review" || !info) return;
    let live = true;
    const t = setTimeout(async () => {
      try {
        const q = await post<BchQuote>("/api/checkout/bch/quote", { token, category: offer?.category ?? "", amount: String(amount) });
        if (!live) return;
        setQuote(q);
        onPreview(q);
      } catch (e) {
        if (live) setError(e instanceof Error ? e.message : String(e));
      }
    }, 200);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [open, phase, info, amount, offer?.category, token, onPreview, bch.amountBch]);

  function close() {
    if (phase === "approving") abort.current?.abort();
    setClosing(true);
    setTimeout(onClose, 260);
  }

  async function changeWallet() {
    if (wallet) await disconnectWallet(wallet);
    setWallet(null);
    setInfo(null);
    setQuote(null);
    onPreview(null);
    void begin();
  }

  async function pay() {
    if (!wallet) return;
    setError(null);
    setPhase("approving");
    const ctl = new AbortController();
    abort.current = ctl;
    try {
      const built = await post<{ request: unknown }>("/api/checkout/bch/build", { token, address: wallet.address, category: offer?.category ?? "", amount: String(amount) });
      if (ctl.signal.aborted) throw new Cancelled();
      const hex = await signInWallet(wallet, built.request, ctl.signal);
      // Approved: the wallet has sent it. Handing it to the shop too makes the page update at once.
      setPhase("sending");
      await post("/api/checkout/bch/submit", { token, hex }).catch(() => {});
      setPhase("done");
      onSent();
      setTimeout(close, 2200);
    } catch (e) {
      setPhase("review");
      if (e instanceof Cancelled) setError(null);
      else setError(declined(e) ? "You declined it in your wallet. Nothing was sent." : e instanceof Error ? e.message : String(e));
    } finally {
      abort.current = null;
    }
  }

  // Dragging the top of the sheet down closes it (as on a phone).
  const dragStart = (e: React.PointerEvent) => {
    if (phase === "approving" || phase === "sending") return;
    dragFrom.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const dragMove = (e: React.PointerEvent) => {
    if (dragFrom.current !== null) setDrag(Math.max(0, e.clientY - dragFrom.current));
  };
  const dragEnd = () => {
    if (dragFrom.current === null) return;
    dragFrom.current = null;
    if (drag > 110) close();
    setDrag(0);
  };

  if (!open && !closing) return null;

  const asked = quote?.amountBch ?? bch.amountBch ?? "0";
  const usd = quote?.breakdown?.total.cents ?? bch.usdCents;
  const short = info ? sats(info.bch) < sats(asked) + 2000 : false;
  const off = quote?.breakdown?.lines.find((l) => l.kind === "tokens");
  const spending = quote?.tokens && amount > 0 ? quote.tokens.text : null;
  const name = wallet?.name ?? "your wallet";

  return (
    <div className={`pay-sheet-wrap ${closing ? "closing" : ""}`} role="presentation" onKeyDown={(e) => e.key === "Escape" && close()}>
      <div className="pay-sheet-backdrop" onClick={close} aria-hidden="true" />
      <div
        ref={sheet}
        className="pay-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Pay with Bitcoin Cash"
        tabIndex={-1}
        style={drag ? { transform: `translateY(${drag}px)`, transition: "none" } : undefined}
      >
        <div className="pay-sheet-grab" onPointerDown={dragStart} onPointerMove={dragMove} onPointerUp={dragEnd} onPointerCancel={dragEnd}>
          <span aria-hidden="true" />
        </div>

        <header className="flex items-center gap-3 px-5 pb-4">
          <Image src={logo} alt="" sizes="44px" className="size-11 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg leading-tight">Om Threads Boutique</p>
            <p className="text-sm text-muted">{orderNo ? `Order ${orderNo} · ` : ""}Bitcoin Cash</p>
          </div>
          <button type="button" onClick={close} className="pay-sheet-x" aria-label="Close">
            ✕
          </button>
        </header>

        {/* Connecting a wallet (once; it's remembered for next time). */}
        {(phase === "starting" || phase === "connecting") && (
          <section className="pay-step px-5 pt-2 pb-6">
            {phase === "starting" ? (
              <div className="bch-skeleton h-48 rounded-2xl" aria-label="Getting ready" />
            ) : uri ? (
              phone && !showQr ? (
                <div className="text-center">
                  <WalletGlyph />
                  <p className="mt-4 text-xl font-medium">Connect your wallet</p>
                  <p className="mx-auto mt-1 max-w-xs text-sm text-ink/75">Cashonize, Paytaca or Zapit opens and asks to connect. Approve it, then come back here to pay.</p>
                  <a href={uri} className="pay-primary mt-6">
                    Open my wallet app
                  </a>
                  <div className="mt-4 flex justify-center gap-5 text-sm">
                    <a href={`https://cashonize.com/?uri=${encodeURIComponent(uri)}`} target="_blank" rel="noopener noreferrer" className="text-muted underline underline-offset-4">
                      Cashonize on the web
                    </a>
                    <button type="button" onClick={() => setShowQr(true)} className="text-muted underline underline-offset-4">
                      Wallet on another device
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <QrCode text={uri} size={236} label="QR code to connect your wallet" listening />
                  <p className="mt-4 text-lg font-medium">Scan with your wallet to connect</p>
                  <p className="mt-1 max-w-xs text-sm text-ink/75">In Cashonize, Paytaca or Zapit. Nothing is paid yet: you&apos;ll see the total first.</p>
                  <div className="mt-3 flex items-center gap-3 text-sm">
                    <CopyButton value={uri} label="connection link" />
                    {phone && (
                      <button type="button" onClick={() => setShowQr(false)} className="text-muted underline underline-offset-4">
                        Back
                      </button>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="text-center">
                <button type="button" onClick={begin} className="pay-primary">
                  Try again
                </button>
              </div>
            )}
            {error && <p role="alert" className="mt-4 rounded-xl bg-sale/10 p-3 text-center text-sm text-sale">{error}</p>}
          </section>
        )}

        {(phase === "loading" || phase === "review") && (
          <section className="pay-step">
            {/* Paying with */}
            <div className="pay-row">
              <span className="pay-row-label">Pay with</span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium">
                  <span className="bch-dot" aria-hidden="true" /> {name}
                  {wallet?.address && <span className="font-mono text-xs font-normal text-muted">{shortAddress(wallet.address)}</span>}
                </p>
                <p className="text-sm text-muted">{info ? `${info.bch} BCH available${offer ? ` · ${offer.haveText}` : ""}` : "Reading your wallet…"}</p>
              </div>
              <button type="button" onClick={changeWallet} className="text-sm text-muted underline underline-offset-4">
                Change
              </button>
            </div>

            {phase === "loading" && <div className="bch-skeleton mx-5 my-4 h-28 rounded-2xl" />}

            {/* The shop's tokens: as many as the shopper likes, up to what they hold. */}
            {offer && phase === "review" && (
              <div className="pay-row stack">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{offer.label} tokens</p>
                    <p className="text-sm text-[#087f5d]">{offer.value} BCH off each</p>
                  </div>
                  {max > 0 && (
                    <div className="pay-stepper">
                      <button type="button" onClick={() => setAmount((a) => Math.max(0, a - 1))} disabled={amount <= 0} aria-label="One fewer">
                        −
                      </button>
                      <span className="tabular-nums">
                        <RollingAmount value={tokenCount(amount, offer.decimals)} />
                      </span>
                      <button type="button" onClick={() => setAmount((a) => Math.min(max, a + 1))} disabled={amount >= max} aria-label="One more">
                        +
                      </button>
                    </div>
                  )}
                </div>
                {max > 1 && (
                  <input
                    type="range"
                    className="bch-range mt-4 w-full"
                    min={0}
                    max={max}
                    step={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    aria-label={`How many ${offer.symbol ?? "tokens"} to use`}
                    style={{ "--fill": `${(amount / max) * 100}%` } as React.CSSProperties}
                  />
                )}
                <p className="mt-2 text-sm" aria-live="polite">
                  {max === 0 ? (
                    <span className="text-muted">None in this wallet.</span>
                  ) : off && amount > 0 ? (
                    <span className="text-[#087f5d]">
                      Saves <span className="font-mono font-semibold">{off.bch} BCH</span> ({dollars(off.cents)}) · using {tokenCount(amount, offer.decimals)} of {offer.haveText}
                    </span>
                  ) : (
                    <span className="text-muted">Keeping all {offer.haveText} for another time</span>
                  )}
                </p>
              </div>
            )}

            {/* The order, line by line (folded away until asked for). */}
            {quote?.breakdown && (
              <div className="pay-row stack">
                <button type="button" onClick={() => setDetails((d) => !d)} className="flex w-full items-center justify-between text-sm" aria-expanded={details}>
                  <span className="text-muted">Order details</span>
                  <span className={`text-muted transition-transform duration-300 ${details ? "rotate-180" : ""}`}>⌄</span>
                </button>
                <div className={`pay-details ${details ? "open" : ""}`}>
                  <dl className="pt-2 text-sm">
                    {quote.breakdown.lines.map((l) => (
                      <div key={l.kind} className={`flex justify-between gap-3 py-1 ${l.kind === "tokens" ? "text-[#087f5d]" : ""}`}>
                        <dt>{l.kind === "items" ? `Items · ${l.label}` : l.kind === "shipping" ? "Shipping" : l.kind === "tax" ? "Sales tax" : `${l.label} (${l.tokens})`}</dt>
                        <dd className="font-mono tabular-nums">
                          {l.kind === "tokens" || l.kind === "coupon" ? "−" : ""}
                          {l.bch} BCH
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}

            {/* The total and the one button. */}
            <div className="px-5 pt-4 pb-6">
              <div className="flex items-end justify-between gap-3">
                <span className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">Pay Om Threads</span>
                <span className="text-right">
                  <span className="block text-3xl font-medium tabular-nums">
                    <RollingAmount value={asked} /> <span className="text-lg text-[#087f5d]">BCH</span>
                  </span>
                  <span className="text-sm text-muted tabular-nums">
                    {dollars(usd)}
                    {spending ? ` · plus ${spending}` : ""}
                  </span>
                </span>
              </div>
              {short && phase === "review" && (
                <p className="mt-3 rounded-xl bg-marigold/15 p-3 text-sm">This wallet has {info?.bch} BCH, a little less than this needs with the network fee. Add some, or pay with the QR code from another wallet.</p>
              )}
              {error && (
                <p role="alert" className="mt-3 rounded-xl bg-sale/10 p-3 text-sm text-sale">
                  {error}
                </p>
              )}
              <button type="button" onClick={pay} disabled={phase !== "review" || !quote || short} className="pay-primary mt-4">
                <span className="bch-dot" aria-hidden="true" /> Pay {asked} BCH
              </button>
              <p className="mt-2 text-center text-xs text-muted">
                You approve it once in {name}, which sends it. {left !== null && left > 0 ? `Price held ${Math.floor(left / 60)}:${pad(left % 60)}.` : ""}
              </p>
            </div>
          </section>
        )}

        {/* Waiting for the shopper to approve it in their wallet: they can still cancel. */}
        {(phase === "approving" || phase === "sending") && (
          <section className="pay-step px-5 pt-2 pb-7 text-center" aria-live="polite">
            <div className="pay-approve-mark" aria-hidden="true">
              <span />
              <span />
              <WalletGlyph />
            </div>
            <p className="mt-5 text-xl font-medium">{phase === "sending" ? "Sending…" : `Approve it in ${name}`}</p>
            <p className="mt-1 text-sm text-ink/75">
              <span className="font-mono">{asked} BCH</span>
              {spending ? ` and ${spending}` : ""} to Om Threads Boutique
            </p>
            {phone && phase === "approving" && wallet && (
              <a href={walletAppLink(wallet)} className="pay-primary mt-6">
                Open {name}
              </a>
            )}
            {phase === "approving" && (
              <button type="button" onClick={() => abort.current?.abort()} className="mt-4 text-sm text-muted underline underline-offset-4">
                Cancel payment
              </button>
            )}
            <p className="mt-4 text-xs text-muted">Nothing is sent until you approve it.</p>
          </section>
        )}

        {phase === "done" && (
          <section className="pay-step px-5 pt-2 pb-8 text-center" aria-live="polite">
            <svg viewBox="0 0 64 64" className="pay-done-mark mx-auto" aria-hidden="true">
              <circle cx="32" cy="32" r="30" fill="#0ac18e" />
              <path d="M19 33.5l8.5 8.5L45.5 23" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
            </svg>
            <p className="mt-4 text-2xl font-medium">Paid</p>
            <p className="mt-1 text-sm text-ink/75">
              <span className="font-mono">{asked} BCH</span>
              {spending ? ` and ${spending}` : ""} sent. Thank you!
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

function WalletGlyph() {
  return (
    <svg viewBox="0 0 48 48" width="56" height="56" className="relative mx-auto" aria-hidden="true">
      <rect x="5" y="12" width="38" height="27" rx="6" fill="var(--color-ink)" />
      <path d="M11 12l19-6 3 6" fill="none" stroke="var(--color-ink)" strokeWidth="3" strokeLinejoin="round" />
      <rect x="29" y="21" width="14" height="9" rx="3" fill="#0ac18e" />
      <circle cx="34.5" cy="25.5" r="1.8" fill="#fff" />
    </svg>
  );
}
