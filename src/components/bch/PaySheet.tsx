"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import logo from "@/assets/logo.png";
import type { BchPayment, BchQuote, BchWalletInfo } from "@/lib/bch";
import { Cancelled, declined, disconnectWallet, resumeWallet, signInWallet, startConnection, walletAppLink, type WalletSession } from "@/lib/bch/walletConnect";
import { Address, BchIcon, BchReceipt, CopyButton, dollars, QrCode, RewardGlyph, RollingAmount } from "./parts";

type Phase = "starting" | "connecting" | "loading" | "review" | "approving" | "sending" | "done";
type Method = "wallet" | "any";

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
 * Om Threads Pay: the shop's own way to pay with Bitcoin Cash, in one sheet that slides up over the page
 * (from the bottom on a phone, a card in the middle on a computer). It brings together what BCH wallets
 * can do:
 * - Connect a wallet (Cashonize, Paytaca, Zapit, over BCH WalletConnect): see what's in it, choose how
 *   many of the shop's tokens to spend, and pay in one tap; one approval in the wallet sends the BCH and
 *   the tokens together in one transaction. Until then, the tokens can change, or it can be cancelled.
 * - Any wallet (Selene, Electron Cash, an exchange…): scan the QR code or open the payment link, with the
 *   tokens sent first if the shopper has some.
 * Both show the same order in Bitcoin Cash, and both end on the same "Paid".
 */
export function PaySheet({
  open,
  onClose,
  token,
  bch,
  orderNo,
  left,
  canConnect,
  onPreview,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  token: string;
  bch: BchPayment;
  orderNo?: string;
  left: number | null;
  canConnect: boolean;
  onPreview: (q: BchQuote | null) => void;
  onSent: () => void;
}) {
  const [method, setMethod] = useState<Method>(canConnect ? "wallet" : "any");
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
  const viaWallet = method === "wallet" && canConnect;

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

  // Connecting: the wallet connected before comes back by itself; otherwise a new connection is offered.
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
      setError(declined(e) ? "The connection was declined in your wallet." : "Couldn't reach a wallet just now. Try again, or choose “Any wallet”.");
    }
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setClosing(false);
      if (viaWallet && !wallet && phase === "starting") void begin();
    }, 0);
    document.body.style.overflow = "hidden";
    sheet.current?.focus();
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
    };
    // When the sheet opens, or the shopper switches to connecting a wallet.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, viaWallet]);

  // What the order does underneath: paid (either way) → "Paid"; the price hold ended → the sheet steps aside.
  const payable = bch.state === "waiting" || bch.state === "partial";
  const landed = bch.state === "arrived" || bch.state === "checking" || bch.state === "paid";
  useEffect(() => {
    if (!open || phase === "done" || phase === "sending") return;
    if (landed) {
      const t = setTimeout(() => {
        setPhase("done");
        setTimeout(close, 2400);
      }, 0);
      return () => clearTimeout(t);
    }
    if (!payable && phase !== "approving") {
      const t = setTimeout(close, 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payable, landed, phase]);

  // The price for the tokens chosen, asked a moment after the stepper or slider stops.
  useEffect(() => {
    if (!open || !viaWallet || phase !== "review" || !info) return;
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
  }, [open, viaWallet, phase, info, amount, offer?.category, token, onPreview, bch.amountBch]);

  // Closing plays the slide-out, then the sheet is gone: nothing stays over the page, even if it stays mounted.
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  function close() {
    if (closeTimer.current) return;
    if (phase === "approving") abort.current?.abort();
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      closeTimer.current = undefined;
      setClosing(false);
      onClose();
    }, 260);
  }

  function choose(m: Method) {
    if (phase === "approving" || phase === "sending") return;
    setMethod(m);
    setError(null);
    onPreview(m === "wallet" ? quote : null);
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
      setTimeout(close, 2400);
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

  const asked = (viaWallet ? quote?.amountBch : null) ?? bch.amountBch ?? "0";
  const breakdown = (viaWallet ? quote?.breakdown : null) ?? bch.breakdown ?? null;
  const usd = breakdown?.total.cents ?? bch.usdCents;
  const short = info ? sats(info.bch) < sats(asked) + 2000 : false;
  const off = quote?.breakdown?.lines.find((l) => l.kind === "tokens");
  const spending = viaWallet && quote?.tokens && amount > 0 ? quote.tokens.text : null;
  const name = wallet?.name ?? "your wallet";
  const busy = phase === "approving" || phase === "sending";
  // The rewards promotion: what this payment earns back in the shop's tokens.
  // (Worked out by the admin, for the tokens chosen when connected.)
  const earns = (viaWallet && quote ? quote.rewardEarns : bch.rewardEarns) ?? null;

  /** Connecting a wallet (once; remembered), then the tokens, then waiting for the shopper's approval. */
  function walletPane() {
    if (phase === "starting" || phase === "connecting") {
      return (
        <section className="pay-step px-6 pb-7">
          {phase === "starting" ? (
            <div className="bch-skeleton h-48 rounded-2xl" aria-label="Getting ready" />
          ) : uri ? (
            phone && !showQr ? (
              <div className="text-center">
                <WalletGlyph />
                <p className="mt-4 font-display text-2xl">Connect your wallet</p>
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
                <p className="mt-4 font-display text-xl">Scan with your wallet to connect</p>
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
          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-sale/10 p-3 text-center text-sm text-sale">
              {error}
            </p>
          )}
        </section>
      );
    }

    if (phase === "approving" || phase === "sending") {
      return (
        <section className="pay-step px-6 pt-2 pb-8 text-center" aria-live="polite">
          <div className="pay-approve-mark" aria-hidden="true">
            <span />
            <span />
            <WalletGlyph />
          </div>
          <p className="mt-5 font-display text-2xl">{phase === "sending" ? "Sending…" : `Approve it in ${name}`}</p>
          <p className="mt-1 text-sm text-ink/75">
            {asked} BCH{spending ? ` and ${spending}` : ""} to Om Threads Boutique
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
      );
    }

    return (
      <section className="pay-step">
        <div className="pay-row">
          <span className="pay-row-label">Pay with</span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-medium">
              {name}
              {wallet?.address && <span className="text-xs font-normal tracking-wide text-muted">{shortAddress(wallet.address)}</span>}
            </p>
            <p className="text-sm text-muted">{info ? `${info.bch} BCH available${offer ? ` · ${offer.haveText}` : ""}` : "Reading your wallet…"}</p>
          </div>
          <button type="button" onClick={changeWallet} className="text-sm text-muted underline underline-offset-4">
            Change
          </button>
        </div>

        {phase === "loading" && <div className="bch-skeleton mx-6 my-4 h-28 rounded-2xl" />}

        {offer && phase === "review" && (
          <div className="pay-row stack">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{offer.label} tokens</p>
                <p className="text-sm text-peacock">{offer.value} BCH off each</p>
              </div>
              {max > 0 && (
                <div className="pay-stepper">
                  <button type="button" onClick={() => setAmount((a) => Math.max(0, a - 1))} disabled={amount <= 0} aria-label="One fewer">
                    −
                  </button>
                  <span className="font-display">
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
                <span className="text-peacock">
                  Saves {off.bch} BCH ({dollars(off.cents)}) · using {tokenCount(amount, offer.decimals)} of {offer.haveText}
                </span>
              ) : (
                <span className="text-muted">Keeping all {offer.haveText} for another time</span>
              )}
            </p>
          </div>
        )}
      </section>
    );
  }

  return (
    <div className={`pay-sheet-wrap ${closing ? "closing" : ""}`} role="presentation" onKeyDown={(e) => e.key === "Escape" && close()}>
      <div className="pay-sheet-backdrop" onClick={close} aria-hidden="true" />
      <div
        ref={sheet}
        className="pay-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Om Threads Pay: pay with Bitcoin Cash"
        tabIndex={-1}
        style={drag ? { transform: `translateY(${drag}px)`, transition: "none" } : undefined}
      >
        <div className="pay-sheet-grab" onPointerDown={dragStart} onPointerMove={dragMove} onPointerUp={dragEnd} onPointerCancel={dragEnd}>
          <span aria-hidden="true" />
        </div>

        <header className="flex items-center gap-3 px-6 pb-4">
          <Image src={logo} alt="" sizes="48px" className="size-12 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl leading-tight">Om Threads Pay</p>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <BchIcon size={14} /> Bitcoin Cash{orderNo ? ` · Order ${orderNo}` : ""}
            </p>
          </div>
          <button type="button" onClick={close} className="pay-sheet-x" aria-label="Close">
            ✕
          </button>
        </header>

        {phase === "done" ? (
          <section className="pay-step px-6 pt-2 pb-9 text-center" aria-live="polite">
            <div className="pay-done-mark mx-auto" aria-hidden="true">
              <svg viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="30" fill="var(--color-peacock)" />
                <circle cx="32" cy="32" r="27" fill="none" stroke="var(--color-zari-light)" strokeWidth="1.5" />
                <path d="M19 33.5l8.5 8.5L45.5 23" fill="none" stroke="var(--color-ivory)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} />
              </svg>
            </div>
            <p className="mt-4 font-display text-3xl">Paid</p>
            <p className="mt-1 text-ink/75">
              {asked} BCH{spending ? ` and ${spending}` : ""}. Thank you!
            </p>
            {earns && (
              <p className="pay-reward mx-auto mt-4 w-fit">
                <RewardGlyph />
                <span>
                  {earns} {viaWallet ? "on their way to your wallet" : "to claim on your order page"}
                </span>
              </p>
            )}
          </section>
        ) : (
          <>
            {/* The two ways, side by side: connect a wallet (one tap, with tokens), or any wallet (scan or open). */}
            {canConnect && (
              <div className="pay-methods mx-6 mb-4" role="tablist" aria-label="How to pay">
                <span className="pay-methods-pill" style={{ transform: method === "wallet" ? "translateX(0)" : "translateX(100%)" }} aria-hidden="true" />
                <button type="button" role="tab" aria-selected={method === "wallet"} onClick={() => choose("wallet")} disabled={busy}>
                  Connect wallet
                  <span>One tap · use your tokens</span>
                </button>
                <button type="button" role="tab" aria-selected={method === "any"} onClick={() => choose("any")} disabled={busy}>
                  Any wallet
                  <span>Scan or open a link</span>
                </button>
              </div>
            )}

            {viaWallet ? walletPane() : <AnyWalletPane bch={bch} phone={phone} showQr={showQr} setShowQr={setShowQr} />}

            {/* The order, folded away until asked for; the total; and (connected) the one button. */}
            {(!viaWallet || phase === "review") && (
              <>
                {breakdown && (
                  <div className="pay-row stack">
                    <button type="button" onClick={() => setDetails((d) => !d)} className="flex w-full items-center justify-between text-sm" aria-expanded={details}>
                      <span className="text-muted">Order details</span>
                      <span className={`text-muted transition-transform duration-300 ${details ? "rotate-180" : ""}`}>⌄</span>
                    </button>
                    <div className={`pay-details ${details ? "open" : ""}`}>
                      <div className="pt-2">
                        <BchReceipt breakdown={breakdown} paid={bch.state === "partial" ? bch.paidBch : null} left={bch.state === "partial" ? bch.amountBch : null} flat />
                      </div>
                    </div>
                  </div>
                )}
                <div className="px-6 pt-4 pb-7">
                  <div className="flex items-end justify-between gap-3">
                    <span className="eyebrow">{bch.state === "partial" ? "Left to pay" : "Pay Om Threads"}</span>
                    <span className="text-right">
                      <span className="block font-display text-[2rem] leading-none">
                        <RollingAmount value={asked} /> <span className="text-lg text-zari">BCH</span>
                      </span>
                      <span className="mt-1 block text-sm text-muted tabular-nums">
                        {dollars(usd)}
                        {spending ? ` · plus ${spending}` : ""}
                      </span>
                    </span>
                  </div>
                  {earns && (
                    <p key={earns} className="pay-reward mt-4">
                      <RewardGlyph />
                      <span>
                        You&apos;ll earn <b>{earns}</b> back{viaWallet ? ", straight to this wallet" : ": claim them after paying"}
                      </span>
                    </p>
                  )}
                  {viaWallet ? (
                    <>
                      {short && <p className="mt-3 rounded-xl bg-marigold/15 p-3 text-sm">This wallet has {info?.bch} BCH, a little less than this needs with the network fee. Add some, or choose “Any wallet”.</p>}
                      {error && (
                        <p role="alert" className="mt-3 rounded-xl bg-sale/10 p-3 text-sm text-sale">
                          {error}
                        </p>
                      )}
                      <button type="button" onClick={pay} disabled={phase !== "review" || !quote || short} className="pay-primary mt-5">
                        Pay with <BchIcon size={22} /> {asked} BCH
                      </button>
                      <p className="mt-2 text-center text-xs text-muted">
                        You approve it once in {name}, which sends it.{left !== null && left > 0 ? ` Price held ${Math.floor(left / 60)}:${pad(left % 60)}.` : ""}
                      </p>
                    </>
                  ) : (
                    <p className="pay-watching mt-4" role="status">
                      <span aria-hidden="true" />
                      Watching for your payment{left !== null && left > 0 ? ` · price held ${Math.floor(left / 60)}:${pad(left % 60)}` : ""}
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Any wallet: tokens first if the shopper has some, then the payment by QR code or link (with the amount and address to copy). */
function AnyWalletPane({ bch, phone, showQr, setShowQr }: { bch: BchPayment; phone: boolean; showQr: boolean; setShowQr: (v: boolean) => void }) {
  const [tokens, setTokens] = useState(false);
  const qr = !phone || showQr;
  return (
    <section className="pay-step px-6 pb-2">
      {bch.state === "partial" && (
        <p className="mb-4 rounded-xl bg-marigold/15 p-3 text-sm">
          We&apos;ve received {bch.paidBch} BCH. Please send the remaining <strong>{bch.amountBch} BCH</strong>.
        </p>
      )}

      {bch.coupon && (
        <div className="pay-tokens-first mb-5">
          <button type="button" onClick={() => setTokens((t) => !t)} className="flex w-full items-center justify-between gap-3 text-left" aria-expanded={tokens}>
            <span>
              <span className="block font-medium">{bch.coupon.stack ? "Have Om Threads tokens?" : "Have an Om Threads coupon?"}</span>
              <span className="block text-sm text-ink/70">Send {bch.coupon.stack ? "them" : "it"} first: the amount below updates by itself.</span>
            </span>
            <span className={`text-muted transition-transform duration-300 ${tokens ? "rotate-180" : ""}`}>⌄</span>
          </button>
          <div className={`pay-details ${tokens ? "open" : ""}`}>
            <div>
              <div className="flex flex-col items-center gap-3 pt-4 text-center">
                {!phone && <QrCode text={bch.coupon.uri} size={164} label="QR code to send your tokens" />}
                <ul className="text-sm">
                  {bch.coupon.coupons.map((c) => (
                    <li key={c.label}>
                      <span className="font-medium">{c.label}</span>: {c.off} <span className="text-muted">· send {c.send}</span>
                    </li>
                  ))}
                </ul>
                <a href={bch.coupon.uri} className="btn btn-outline h-11 min-h-0 w-full text-sm">
                  Send {bch.coupon.stack ? "tokens" : "the coupon"} from my wallet app
                </a>
                <div className="flex w-full items-start justify-between gap-3 text-left">
                  <Address value={bch.coupon.address} />
                  <CopyButton value={bch.coupon.address} label="token address" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        {qr ? (
          <QrCode text={bch.uri!} size={phone ? 220 : 232} label="QR code with the payment address and amount" listening />
        ) : (
          <a href={bch.uri!} className="pay-primary">
            Open in my wallet app <BchIcon size={22} />
          </a>
        )}
        <p className="mt-3 text-sm text-ink/75">
          {qr ? "Scan with Selene, Paytaca, Electron Cash or any Bitcoin Cash wallet." : "Selene, Paytaca, Electron Cash or any Bitcoin Cash wallet opens with everything filled in."}
        </p>
        {phone && (
          <button type="button" onClick={() => setShowQr(!showQr)} className="mt-2 text-sm text-muted underline underline-offset-4">
            {showQr ? "Open in my wallet app instead" : "Show the QR code (wallet on another device)"}
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl bg-sand/70 p-4">
        <div className="min-w-0">
          <p className="eyebrow">{bch.state === "partial" ? "Send the rest" : "Send exactly"}</p>
          <p className="font-display text-2xl">
            {bch.amountBch} <span className="text-base text-zari">BCH</span>
          </p>
          <p className="eyebrow mt-2">To</p>
          <Address value={bch.address!} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <p className="text-sm text-muted">One link with the address and amount: paste it in any wallet.</p>
          <CopyButton value={bch.uri!} label="payment link" />
        </div>
      </div>
    </section>
  );
}

function WalletGlyph() {
  return (
    <span className="relative mx-auto grid size-16 place-items-center rounded-full bg-ivory shadow-[0_6px_20px_rgb(35_49_66/0.12)]">
      <svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true">
        <rect x="5" y="12" width="38" height="27" rx="6" fill="var(--color-ink)" />
        <path d="M11 12l19-6 3 6" fill="none" stroke="var(--color-ink)" strokeWidth="3" strokeLinejoin="round" />
        <rect x="29" y="21" width="14" height="9" rx="3" fill="var(--color-zari)" />
        <circle cx="34.5" cy="25.5" r="1.8" fill="var(--color-ivory)" />
      </svg>
      <span className="absolute -right-1 -bottom-1">
        <BchIcon size={22} />
      </span>
    </span>
  );
}
