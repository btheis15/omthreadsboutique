"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { encode } from "uqr";
import logo from "@/assets/logo.png";
import type { BchPayment } from "@/lib/bch";
import { formatPrice } from "@/lib/site";

export const dollars = (cents: number) => formatPrice(cents / 100);

// The shop's QR look (as on the Share card in the admin): softly rounded ink squares on ivory, the corner
// markers in indigo with a rani centre, and the round logo in the middle. Error correction "H" leaves room for it.
const QR = { ink: "#233142", indigo: "#2d4b68", rani: "#a52b57", ivory: "#fdfaf2", gold: "#b8873a" };
const QUIET = 4;
const r2 = (v: number) => Math.round(v * 100) / 100;

/**
 * The payment link as a QR code, drawn here (nothing is sent to a QR service). It ripples out from the
 * logo as it appears, a sheen passes over it, and while `listening` soft rings pulse out behind it.
 */
export function QrCode({ text, size, label, listening = false }: { text: string; size: number; label: string; listening?: boolean }) {
  const { dots, markers, full, c, logoR } = useMemo(() => {
    const { size: n, data, types } = encode(text, { ecc: "H", border: 0 });
    const U = 10;
    const at = (i: number) => (i + QUIET) * U;
    const mid = n / 2;
    const logoR = n * 0.12;
    let dots = "";
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (!data[y][x] || types[y][x] === 2 || Math.hypot(x + 0.5 - mid, y + 0.5 - mid) < logoR + 0.9) continue;
        const px = r2(at(x) + U * 0.025);
        const py = r2(at(y) + U * 0.025);
        dots += `M${px} ${py}m${U * 0.22} 0h${r2(U * 0.51)}a${U * 0.22} ${U * 0.22} 0 0 1 ${U * 0.22} ${U * 0.22}v${r2(U * 0.51)}a${U * 0.22} ${U * 0.22} 0 0 1 -${U * 0.22} ${U * 0.22}h-${r2(U * 0.51)}a${U * 0.22} ${U * 0.22} 0 0 1 -${U * 0.22} -${U * 0.22}v-${r2(U * 0.51)}a${U * 0.22} ${U * 0.22} 0 0 1 ${U * 0.22} -${U * 0.22}z`;
      }
    }
    const markers = [
      [0, 0],
      [n - 7, 0],
      [0, n - 7],
    ].map(([mx, my]) => ({ x: at(mx), y: at(my) }));
    return { dots, markers, full: (n + QUIET * 2) * U, c: at(0) + mid * U, logoR: logoR * U };
  }, [text]);
  const U = 10;
  const logoPct = `${((logoR * 2) / full) * 100}%`;
  return (
    <div className={`bch-qr ${listening ? "listening" : ""}`} style={{ width: size }}>
      <span className="bch-sonar" aria-hidden="true" />
      <span className="bch-sonar" aria-hidden="true" />
      <div className="bch-qr-box">
        <svg viewBox={`0 0 ${full} ${full}`} className="bch-qr-code" role="img" aria-label={label}>
          <rect width={full} height={full} rx={3 * U} fill={QR.ivory} />
          <path d={dots} fill={QR.ink} />
          {markers.map(({ x, y }) => (
            <g key={`${x}-${y}`}>
              <rect x={x + U / 2} y={y + U / 2} width={6 * U} height={6 * U} rx={2 * U} fill="none" stroke={QR.indigo} strokeWidth={U} />
              <rect x={x + 2 * U} y={y + 2 * U} width={3 * U} height={3 * U} rx={U} fill={QR.rani} />
            </g>
          ))}
          <circle cx={c} cy={c} r={logoR + 0.6 * U} fill={QR.ivory} />
          <circle className="bch-qr-ring" cx={c} cy={c} r={logoR + 0.6 * U} fill="none" stroke={QR.gold} strokeWidth={U * 0.35} pathLength={1} />
        </svg>
        <Image src={logo} alt="" sizes="64px" className="bch-qr-logo" style={{ width: logoPct, height: logoPct }} />
      </div>
    </div>
  );
}

/** Copy: "Copied" rolls up into place, the button turns green and the tick draws itself. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
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
    setCopied((n) => n + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(0), 1800);
  }
  return (
    <button type="button" onClick={copy} className={`bch-copy ${copied ? "done" : ""}`} aria-label={copied ? "Copied" : `Copy the ${label}`}>
      <span className="face idle">Copy</span>
      {/* Keyed by the count, so a second tap plays it again. */}
      <span key={copied} className="face ok" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Copied
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}

/** The amount, its digits rolling up into place one after another (again whenever it changes). */
export function RollingAmount({ value }: { value: string }) {
  return (
    <span key={value} className="bch-roll" aria-label={`${value} BCH`}>
      {[...value].map((ch, i) => (
        <span key={i} aria-hidden="true" style={{ animationDelay: `${120 + i * 38}ms` }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

/** A cash address with its start and end picked out, the parts people check against their wallet. */
export function Address({ value }: { value: string }) {
  const [prefix, body] = value.includes(":") ? [value.slice(0, value.indexOf(":") + 1), value.slice(value.indexOf(":") + 1)] : ["", value];
  const head = body.slice(0, 6);
  const tail = body.length > 12 ? body.slice(-6) : "";
  const middle = body.slice(head.length, body.length - tail.length);
  return (
    <p className="min-w-0 break-all text-[0.95rem] leading-relaxed tracking-[0.02em]">
      <span className="text-muted">{prefix}</span>
      <span className="font-semibold text-indigo">{head}</span>
      {middle}
      <span className="font-semibold text-indigo">{tail}</span>
    </p>
  );
}

/** The order in BCH, line by line, at the price being held: what the tokens took off (or paid), and the total. */
export function BchReceipt({ breakdown, paid, left, flat = false }: { breakdown: NonNullable<BchPayment["breakdown"]>; paid: string | null; left: string | null; flat?: boolean }) {
  const minus = (l: { kind: string }) => l.kind === "tokens" || l.kind === "coupon";
  const name = (l: NonNullable<BchPayment["breakdown"]>["lines"][number]) =>
    l.kind === "items" ? "Items" : l.kind === "shipping" ? "Shipping" : l.kind === "tax" ? "Sales tax" : l.payment ? `Paid with ${l.label} tokens` : l.label;
  return (
    <div className={flat ? "" : "bch-receipt border-t border-line px-5 py-5 sm:px-6"}>
      {!flat && (
        <p className="bch-rise eyebrow" style={{ animationDelay: "0.6s" }}>
          Your order in Bitcoin Cash
        </p>
      )}
      <dl className={`${flat ? "" : "mt-3"} text-[0.95rem]`}>
        {breakdown.lines.map((l, i) => (
          <div key={`${l.kind}${l.payment ? "-paid" : ""}`}>
            {/* Tokens that pay part of it come after the order's total (its tax is on the full price). */}
            {l.payment && breakdown.orderTotal && (
              <div className="bch-line subtotal" style={{ animationDelay: `${0.66 + i * 0.07}s` }}>
                <dt>Order total</dt>
                <dd className="shrink-0 text-right">
                  <span className="whitespace-nowrap tabular-nums">{breakdown.orderTotal.bch} BCH</span>
                  <span className="block text-xs text-muted tabular-nums">{dollars(breakdown.orderTotal.cents)}</span>
                </dd>
              </div>
            )}
            <div className={`bch-line ${l.kind === "tokens" ? "tokens" : ""}`} style={{ animationDelay: `${0.7 + i * 0.07}s` }}>
              <dt className="min-w-0">
                {name(l)}
                {l.kind === "tokens" ? (
                  <span className="bch-chip">
                    {l.tokens} × {l.each}
                  </span>
                ) : l.kind === "items" || l.kind === "shipping" ? (
                  <span className="text-muted"> · {l.label}</span>
                ) : null}
              </dt>
              <dd className="shrink-0 text-right">
                <span className="whitespace-nowrap tabular-nums">
                  {minus(l) ? "−" : ""}
                  {l.kind === "shipping" && !l.cents ? "Free" : `${l.bch} BCH`}
                </span>
                <span className="block text-xs text-muted tabular-nums">
                  {minus(l) ? "−" : ""}
                  {dollars(l.cents)}
                </span>
              </dd>
            </div>
          </div>
        ))}
        <div className="bch-line total" style={{ animationDelay: `${0.7 + breakdown.lines.length * 0.07}s` }}>
          <dt className="font-medium">{breakdown.orderTotal ? "To pay in Bitcoin Cash" : "Total"}</dt>
          <dd className="shrink-0 text-right">
            <span className="whitespace-nowrap font-display text-xl tabular-nums">{breakdown.total.bch} BCH</span>
            <span className="block text-xs text-muted tabular-nums">{dollars(breakdown.total.cents)}</span>
          </dd>
        </div>
        {paid && left && (
          <>
            <div className="bch-line">
              <dt>Received so far</dt>
              <dd className="shrink-0 whitespace-nowrap text-right tabular-nums">−{paid} BCH</dd>
            </div>
            <div className="bch-line total">
              <dt className="font-medium">Left to send</dt>
              <dd className="shrink-0 whitespace-nowrap text-right font-display text-xl tabular-nums">{left} BCH</dd>
            </div>
          </>
        )}
      </dl>
      <p className="mt-3 text-xs text-muted">
        At ${breakdown.usdPerBch.toFixed(2)} per BCH{breakdown.sources.length ? ` (the middle of ${breakdown.sources.join(", ")})` : ""}, held while the timer runs.
      </p>
    </div>
  );
}

/** The Bitcoin Cash mark (its green disc and tilted ₿): the one touch of BCH's own colors. */
export function BchIcon({ size = 18, className = "", label }: { size?: number; className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={`shrink-0 ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <circle cx="16" cy="16" r="16" fill="#0ac18e" />
      <g transform="rotate(-28 16 16)" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11.6 9.6h5a3 3 0 0 1 0 6h-5zM11.6 15.6h5.8a3.2 3.2 0 0 1 0 6.4h-5.8zM11.6 9.6v12.4" />
        <path d="M13.8 7.3v2.3M16.8 7.3v2.3M13.8 22v2.4M16.8 22v2.4" />
      </g>
    </svg>
  );
}

