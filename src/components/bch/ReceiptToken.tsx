"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import logo from "@/assets/logo.png";
import type { BchPayment, BchReceiptToken } from "@/lib/bch";
import { declined, resumeWallet, startConnection, wcProjectId } from "@/lib/bch/walletConnect";
import { BchIcon, dollars, QrCode } from "./parts";

type Phase = "paper" | "morph" | "spin" | "throw" | "land" | "inwallet";

const touch = () => window.matchMedia("(pointer: coarse)");
const subscribeTouch = (fn: () => void) => {
  const m = touch();
  m.addEventListener("change", fn);
  return () => m.removeEventListener("change", fn);
};
const shortAddress = (a: string) => {
  const body = a.replace(/^bitcoincash:/, "");
  return `${body.slice(0, 6)}…${body.slice(-6)}`;
};
const paidWhen = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
const short = (s: string) => {
  const body = s.replace(/^bitcoincash:/, "");
  return body.length > 16 ? `${body.slice(0, 8)}…${body.slice(-8)}` : body;
};
const played = (name: string, set = false) => {
  try {
    if (set) sessionStorage.setItem(`omt-receipt:${name}`, "1");
    return Boolean(sessionStorage.getItem(`omt-receipt:${name}`));
  } catch {
    return set;
  }
};
// The threads that burst from the coin as it's thrown, in the logo's colors.
const SPARKS = Array.from({ length: 14 }, (_, i) => ({ a: i * (360 / 14) + ((i * 29) % 9), d: 46 + ((i * 37) % 30), delay: (i % 3) * 25 }));
// The coin and the ghost coins streaking behind it.
const FLIGHT = [0, 45, 90, 135];

/**
 * The receipt as an Om Receipt CashToken, on the order page. It shows the receipt as paper. When the CashToken
 * goes to the shopper's wallet, the paper folds into a gold Om Threads coin, which spins and is thrown into their
 * wallet, then settles into "In your wallet". Paid from a wallet that can't safely be sent tokens, the shopper
 * claims it here first (by connecting a wallet or pasting an address that holds tokens).
 */
export function ReceiptToken({ token, initial, expected = false }: { token: string; initial: BchReceiptToken | null; expected?: boolean }) {
  const [rt, setRt] = useState(initial);
  const [phase, setPhase] = useState<Phase>("paper");
  // Already sent: whether it was seen going into the wallet (in this tab) is read after the page loads, as only the
  // browser knows; the card stays hidden for that moment so the receipt doesn't fold away on screen.
  const [settled, setSettled] = useState(initial?.state !== "sent");
  const [open, setOpen] = useState(false);
  const [uri, setUri] = useState<string | null>(null);
  const [paste, setPaste] = useState(false);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flight, setFlight] = useState({ cx: 0, cy: 0, dx: 0, dy: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const wallet = useRef<HTMLSpanElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phone = useSyncExternalStore(subscribeTouch, () => touch().matches, () => false);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (settled) return;
    const t = setTimeout(() => {
      if (initial && played(initial.name)) setPhase("inwallet");
      setSettled(true);
    }, 0);
    return () => clearTimeout(t);
    // Once, after the page loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Folds the receipt into a coin and throws it into the wallet. */
  const throwIt = useCallback(() => {
    if (!rt || !stage.current || !paper.current) return;
    played(rt.name, true);
    setOpen(false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setPhase("inwallet");
    const s = stage.current.getBoundingClientRect();
    const p = paper.current.getBoundingClientRect();
    const cx = p.left - s.left + p.width / 2;
    const cy = p.top - s.top + Math.min(p.height / 2, 220);
    setFlight({ cx, cy, dx: 0, dy: 0 });
    setPhase("morph");
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
    at(760, () => setPhase("spin"));
    at(1380, () => {
      const w = wallet.current?.getBoundingClientRect();
      const st = stage.current?.getBoundingClientRect();
      if (w && st) setFlight({ cx, cy, dx: w.left - st.left + w.width / 2 - cx, dy: w.top - st.top + w.height / 2 - cy });
      setPhase("throw");
    });
    at(2300, () => setPhase("land"));
    at(3500, () => setPhase("inwallet"));
  }, [rt]);

  // Just paid, with a CashToken chosen: the receipt is made a moment later.
  useEffect(() => {
    if (rt || !expected) return;
    let stop = false;
    let tries = 0;
    let t: ReturnType<typeof setTimeout>;
    const look = async () => {
      try {
        const res = await fetch(`/api/checkout/status?order=${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = (await res.json()) as { bch: BchPayment | null };
        if (stop) return;
        if (data.bch?.receiptToken) return setRt(data.bch.receiptToken);
      } catch {
        /* again shortly */
      }
      if (!stop && ++tries < 8) t = setTimeout(look, 2500);
    };
    t = setTimeout(look, 1500);
    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [token, rt, expected]);

  // Being minted (or just claimed): look again until it's in the wallet, then throw it.
  useEffect(() => {
    if (!rt || rt.state !== "sending") return;
    let stop = false;
    let tries = 0;
    let t: ReturnType<typeof setTimeout>;
    const look = async () => {
      try {
        const res = await fetch(`/api/checkout/status?order=${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = (await res.json()) as { bch: BchPayment | null };
        if (stop) return;
        if (data.bch?.receiptToken) setRt(data.bch.receiptToken);
        if (data.bch?.receiptToken?.state !== "sending") return;
      } catch {
        /* again shortly */
      }
      if (!stop && ++tries < 40) t = setTimeout(look, 3000);
    };
    t = setTimeout(look, 2500);
    return () => {
      stop = true;
      clearTimeout(t);
    };
  }, [token, rt]);

  // In the wallet and not yet seen being thrown there (in this tab): a moment to see the receipt, then the throw.
  useEffect(() => {
    if (!settled || rt?.state !== "sent" || phase !== "paper" || played(rt.name)) return;
    const t = setTimeout(throwIt, 1100);
    return () => clearTimeout(t);
  }, [settled, rt, phase, throwIt]);

  async function claim(to: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/bch/receipt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, address: to }) });
      const data = (await res.json().catch(() => ({}))) as { receiptToken?: BchReceiptToken; error?: string };
      if (!res.ok || !data.receiptToken) throw new Error(data.error ?? "Couldn't send your receipt just now. Please try again.");
      setUri(null);
      setPaste(false);
      setRt(data.receiptToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  }

  async function claimWithWallet() {
    setError(null);
    setBusy(true);
    try {
      const known = await resumeWallet();
      if (known) return void (await claim(known.address));
      const c = await startConnection();
      setUri(c.uri);
      setBusy(false);
      const w = await c.connected;
      await claim(w.address);
    } catch (e) {
      setUri(null);
      setBusy(false);
      setError(declined(e) ? "The connection was declined in your wallet." : "Couldn't reach a wallet just now. Try again, or paste an address.");
    }
  }

  if (!rt) return null;
  const r = rt.receipt;
  const number = r.order;
  const flying = phase === "morph" || phase === "spin" || phase === "throw" || phase === "land";
  const showPaper = phase !== "inwallet" || open;

  return (
    <section className={`receipt-token mt-8 ${flying ? "flying" : ""}`} style={settled ? undefined : { visibility: "hidden" }} aria-live="polite">
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow">Your receipt · a CashToken</p>
        {phase === "inwallet" && (
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-sm text-muted underline underline-offset-4">
            {open ? "Hide receipt" : "View receipt"}
          </button>
        )}
      </div>

      <div ref={stage} className="receipt-stage" data-phase={phase} style={{ "--cx": `${flight.cx}px`, "--cy": `${flight.cy}px`, "--dx": `${flight.dx}px`, "--dy": `${flight.dy}px` } as React.CSSProperties}>
        {/* The wallet it's thrown into: it slides in as the receipt turns into a coin. */}
        {flying && (
          <span ref={wallet} className="receipt-wallet" aria-hidden="true">
            <span className="receipt-wallet-ring" />
            <svg viewBox="0 0 48 48" width="34" height="34">
              <rect x="5" y="12" width="38" height="27" rx="6" fill="var(--color-ink)" />
              <path d="M11 12l19-6 3 6" fill="none" stroke="var(--color-ink)" strokeWidth="3" strokeLinejoin="round" />
              <rect x="29" y="21" width="14" height="9" rx="3" fill="var(--color-zari)" />
              <circle cx="34.5" cy="25.5" r="1.8" fill="var(--color-ivory)" />
            </svg>
            <span className="receipt-plus">+1 Om Receipt</span>
          </span>
        )}

        <div className={`receipt-fold ${showPaper ? "open" : ""}`}>
          <div>
            <div ref={paper} className="receipt-paper">
              <div className="receipt-paper-inner">
                <header className="flex items-center gap-3">
                  <Image src={logo} alt="" sizes="44px" className="size-11 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg leading-tight">{r.shop}</p>
                    <p className="text-sm text-muted">{paidWhen(r.paidAt)}</p>
                  </div>
                  <span className="receipt-badge">{rt.name.replace(` #${number}`, "")}</span>
                </header>
                <p className="mt-4 font-display text-2xl">Order {number}</p>
                {r.test && <p className="mt-1 text-xs text-muted">A test order: a real CashToken for a tiny real payment.</p>}
                <dl className="receipt-lines mt-3">
                  {r.items.map((i) => (
                    <div key={`${i.title}-${i.option}-${i.qty}`}>
                      <dt>
                        {i.qty} × {i.title}
                        {i.option && <span className="block text-xs text-muted">{i.option}</span>}
                        {i.qty > 1 && <span className="block text-xs text-muted">{dollars(i.unitCents)} each</span>}
                      </dt>
                      <dd>{dollars(i.cents)}</dd>
                    </div>
                  ))}
                  <div>
                    <dt>Subtotal</dt>
                    <dd>{dollars(r.subtotalCents)}</dd>
                  </div>
                  {r.discount && (
                    <div className="text-peacock">
                      <dt>
                        {r.discount.label}
                        {r.discount.tokens && (
                          <span className="block text-xs">
                            {r.discount.tokens}
                            {r.discount.bch ? ` · ${r.discount.bch} BCH` : ""}
                          </span>
                        )}
                      </dt>
                      <dd>−{dollars(r.discount.cents)}</dd>
                    </div>
                  )}
                  <div>
                    <dt>
                      Shipping<span className="block text-xs text-muted">{r.shipping.label}</span>
                    </dt>
                    <dd>{r.shipping.cents ? dollars(r.shipping.cents) : "Free"}</dd>
                  </div>
                  {r.taxCents > 0 && (
                    <div>
                      <dt>Sales tax</dt>
                      <dd>{dollars(r.taxCents)}</dd>
                    </div>
                  )}
                  <div className="total">
                    <dt>Total</dt>
                    <dd>{dollars(r.totalCents)}</dd>
                  </div>
                </dl>
                <dl className="receipt-pay mt-3">
                  <div>
                    <dt className="flex items-center gap-1.5">
                      <BchIcon size={12} /> Paid
                    </dt>
                    <dd>
                      {r.payment.paidBch} BCH
                      {r.payment.usdPerBch ? <span className="block text-xs text-muted">at ${r.payment.usdPerBch.toFixed(2)} per BCH</span> : null}
                    </dd>
                  </div>
                  <div>
                    <dt>How</dt>
                    <dd>{r.payment.method}</dd>
                  </div>
                  {r.payment.paidTo && (
                    <div>
                      <dt>To</dt>
                      <dd className="font-mono text-xs" title={r.payment.paidTo}>
                        {short(r.payment.paidTo)}
                      </dd>
                    </div>
                  )}
                  {r.payment.tx && (
                    <div>
                      <dt>Transaction</dt>
                      <dd>
                        <a href={`https://blockchair.com/bitcoin-cash/transaction/${r.payment.tx}`} target="_blank" rel="noopener noreferrer" className="font-mono text-xs underline underline-offset-4">
                          {short(r.payment.tx)}
                        </a>
                      </dd>
                    </div>
                  )}
                  {r.reward && (
                    <div>
                      <dt>Earned</dt>
                      <dd>{r.reward}</dd>
                    </div>
                  )}
                </dl>
                {(r.returns || r.website || r.contact) && (
                  <p className="mt-3 text-center text-xs leading-relaxed text-muted">
                    {r.returns && <span className="block">{r.returns.replace(/:\s*https?:\/\/\S+$/, "")}</span>}
                    {[r.website, r.contact].filter(Boolean).map((x) => x!.replace(/^https?:\/\//, "")).join(" · ")}
                  </p>
                )}
                {r.note && <p className="mt-2 text-center font-display text-[0.95rem] italic text-ink/80">{r.note}</p>}
                <p className="receipt-foot">One of a kind · numbered by your order · yours to keep</p>
              </div>
            </div>
          </div>
        </div>

        {/* The coin (and its streak), at the receipt's centre, then thrown along an arc into the wallet. */}
        {flying &&
          FLIGHT.map((delay, i) => (
            <span key={delay} className={`receipt-fly-x ${i ? "ghost" : ""}`} style={{ animationDelay: `${delay}ms`, "--ghost": String(0.45 - i * 0.12) } as React.CSSProperties} aria-hidden="true">
              <span className="receipt-fly-y" style={{ animationDelay: `${delay}ms` }}>
                <span className="receipt-coin">
                  <span className="receipt-coin-face">
                    <Image src={logo} alt="" sizes="64px" className="receipt-coin-logo" />
                  </span>
                  {i === 0 && SPARKS.map((sp, n) => <span key={n} className="receipt-spark" style={{ "--a": `${sp.a}deg`, "--d": `${sp.d}px`, animationDelay: `${sp.delay}ms` } as React.CSSProperties} />)}
                </span>
              </span>
            </span>
          ))}
      </div>

      {phase === "inwallet" && rt.state === "sent" ? (
        <div className="receipt-landed">
          <span className="receipt-mini-coin" aria-hidden="true">
            <Image src={logo} alt="" sizes="36px" className="size-9" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl leading-tight">{rt.name.replace(/-/g, "\u2011")} is in your wallet</p>
            <p className="text-sm text-muted">
              {rt.to ? `${shortAddress(rt.to)} · ` : ""}
              {rt.txUrl && (
                <a href={rt.txUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  See it on the blockchain
                </a>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPhase("paper");
              timers.current.push(setTimeout(throwIt, 1300));
            }}
            className="text-sm text-muted underline underline-offset-4"
            aria-label="Play the animation again"
          >
            Replay
          </button>
        </div>
      ) : rt.state === "sending" ? (
        <p className="receipt-note">
          <span className="pay-watching inline-flex">
            <span aria-hidden="true" />
          </span>
          Minting your Om Receipt{rt.to ? ` for ${shortAddress(rt.to)}` : ""}…
        </p>
      ) : rt.state === "sent" ? (
        <p className="receipt-note">On its way into your wallet…</p>
      ) : rt.state === "expired" ? (
        <p className="receipt-note text-ink/75">This receipt wasn&apos;t claimed in time. Your order is still here, and so is the receipt above.</p>
      ) : uri ? (
        <div className="mt-5 flex flex-col items-center text-center">
          {phone ? (
            <a href={uri} className="pay-primary">
              Open my wallet app
            </a>
          ) : (
            <QrCode text={uri} size={208} label="QR code to connect your wallet" listening />
          )}
          <p className="mt-3 text-sm text-ink/75">Approve the connection in Cashonize, Paytaca or Zapit, and your receipt goes straight to it.</p>
          <button type="button" onClick={() => setUri(null)} className="mt-2 text-sm text-muted underline underline-offset-4">
            Cancel
          </button>
        </div>
      ) : (
        <div className="mt-5">
          <p className="text-[0.95rem] text-ink/80">
            Send it to a wallet that holds CashTokens: Cashonize, Paytaca, Zapit or Electron Cash.{rt.claimUntil ? ` Until ${new Date(rt.claimUntil).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.` : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {wcProjectId && (
              <button type="button" onClick={claimWithWallet} disabled={busy} className="btn btn-primary">
                {busy ? "Sending…" : "Send to my wallet"}
              </button>
            )}
            <button type="button" onClick={() => setPaste((v) => !v)} className="btn btn-outline">
              Paste an address
            </button>
          </div>
          {paste && (
            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                void claim(address.trim());
              }}
            >
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="bitcoincash:z… or bitcoincash:q…"
                spellCheck={false}
                autoComplete="off"
                className="min-w-0 flex-1 rounded-full border border-line bg-ivory px-4 py-2.5"
                aria-label="Your wallet's address"
              />
              <button type="submit" disabled={busy || !address.trim()} className="btn btn-primary">
                {busy ? "Sending…" : "Send it"}
              </button>
            </form>
          )}
          <p className="mt-3 text-xs text-muted">Not an exchange&apos;s address: exchanges can&apos;t hold CashTokens.</p>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-sale/10 p-3 text-sm text-sale">
          {error}
        </p>
      )}
    </section>
  );
}
