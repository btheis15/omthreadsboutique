"use client";

import Link from "next/link";
import { useState } from "react";
import { CopyButton } from "./CopyButton";
import { field, post, saveKey } from "./shared";

type SignedUp = { code: string; name: string; link: string; key: string; pageUrl: string; email: string | null };

/** The sign-up form, then the partner's link and their page's link. */
export function PartnerSignup({ ratePercent, holdDays }: { ratePercent: number; holdDays: number }) {
  const [state, setState] = useState<"idle" | "sending">("idle");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<SignedUp | null>(null);

  if (done) {
    return (
      <div className="animate-rise rounded-2xl border border-line bg-white p-6 md:p-8" role="status">
        <p className="font-display text-3xl">Welcome, {done.name}!</p>
        <p className="mt-2 text-muted">Here&apos;s your link. Share it anywhere: Bitcoin Cash sales through it earn you {ratePercent}%.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <code className="flex min-h-12 flex-1 items-center rounded-xl border border-line bg-sand px-4 py-2 text-sm break-all">{done.link}</code>
          <CopyButton text={done.link} label="Copy link" />
        </div>
        <div className="mt-6 rounded-xl border border-zari-light bg-ivory p-4">
          <p className="font-medium">Bookmark your seller page</p>
          <p className="mt-1 text-sm text-muted">
            It shows your sales and commissions, and it&apos;s where you change your payout address. Keep this link private: it&apos;s your key.
            {done.email ? " We've also sent a link to confirm your email." : " Add your email there: it's needed before your first payout."}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Link href={`/partners/me#key=${done.key}`} className="btn btn-primary">
              Open my seller page
            </Link>
            <CopyButton text={done.pageUrl} label="Copy page link" />
          </div>
        </div>
      </div>
    );
  }

  const err = (k: string) =>
    errors[k] ? (
      <p className="mt-1 text-sm text-accent" role="alert">
        {errors[k]}
      </p>
    ) : null;
  return (
    <form
      className="space-y-4 rounded-2xl border border-line bg-white/60 p-5 md:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        setError("");
        setErrors({});
        const f = new FormData(e.currentTarget);
        const r = await post<SignedUp>("/api/partners/signup", { name: f.get("name"), address: f.get("address"), email: f.get("email"), agree: f.get("agree") === "on" });
        setState("idle");
        if (r.ok) {
          saveKey(r.data.key);
          setDone(r.data);
        } else {
          setError(r.error);
          setErrors(r.errors ?? {});
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Your name</span>
          <input name="name" required autoComplete="name" className={field} />
          {err("name")}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Email <span className="font-normal text-muted">(optional for now)</span>
          </span>
          <input name="email" type="email" autoComplete="email" className={field} />
          {err("email")}
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Your Bitcoin Cash address</span>
        <span className="mb-1.5 block text-sm text-muted">Where your commissions are sent. In your wallet, tap Receive and copy the address.</span>
        <input name="address" required autoComplete="off" spellCheck={false} placeholder="bitcoincash:q…" className={`${field} font-mono text-sm`} />
        {err("address")}
      </label>

      <details className="rounded-xl border border-line bg-white p-4 text-sm">
        <summary className="cursor-pointer font-medium">Seller terms</summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted">
          <li>You earn {ratePercent}% of the items&apos; price (after any coupon; not tax or shipping) on orders paid with Bitcoin Cash through your link, within 30 days of the visit.</li>
          <li>It&apos;s paid in Bitcoin Cash to your address {holdDays} days after the sale, at the rate the shopper paid. A refunded order earns nothing (a partial refund, less).</li>
          <li>Before your first payout you confirm your email, and we approve your account. If your commissions in a year reach the amount the IRS asks us to report, we&apos;ll ask for a W-9 (US) so we can send you a 1099.</li>
          <li>Prices, discounts and the commission rate are set by Om Threads. You can&apos;t offer your own discounts or make promises for us.</li>
          <li>Be honest: say you earn a commission when you share your link, and no spam.</li>
          <li>You&apos;re an independent seller, not an employee. We may change these terms, pause or end the program, or remove an account.</li>
        </ul>
      </details>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="agree" className="mt-1 size-4" required />
        <span>I agree to the seller terms.</span>
      </label>
      {err("agree")}
      {error && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={state === "sending"}>
        {state === "sending" ? "Signing you up…" : "Get my link"}
      </button>
    </form>
  );
}

/** "Email me my page": the answer is the same whether or not the email is known. */
export function SignInByEmail() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  if (state === "sent") return <p className="text-muted" role="status">If that email belongs to a seller, a link is on its way. It works for 24 hours.</p>;
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        const r = await post("/api/partners/signin", { email: new FormData(e.currentTarget).get("email") });
        if (r.ok) setState("sent");
        else {
          setState("error");
          setError(r.error);
        }
      }}
    >
      <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={field} aria-label="Your email" />
      <button type="submit" className="btn btn-outline shrink-0" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Email me my page"}
      </button>
      {state === "error" && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}
    </form>
  );
}
