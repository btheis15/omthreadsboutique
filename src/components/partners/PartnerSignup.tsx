"use client";

import Link from "next/link";
import { useState } from "react";
import { CopyButton } from "./CopyButton";
import { type Business, SellerTerms, TERMS_VERSION } from "./SellerTerms";
import { field, post, saveCode, saveKey } from "./shared";

type SignedUp = { code: string; name: string; link: string; key: string; pageUrl: string; email: string | null };

/** The sign-up form, then the partner's link and their page's link. */
/** `countries` comes from the server (names from one place, so the page hydrates the same). */
export function PartnerSignup({ ratePercent, business, countries }: { ratePercent: number; business: Business | null; countries: { code: string; name: string }[] }) {
  const [state, setState] = useState<"idle" | "sending">("idle");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<SignedUp | null>(null);

  if (done) {
    return (
      <div className="animate-rise rounded-2xl border border-line bg-white p-6 md:p-8" role="status">
        <p className="font-display text-3xl">Welcome, {done.name}!</p>
        <p className="mt-2 text-muted">
          Here&apos;s your link to the whole shop. Share it anywhere: Bitcoin Cash sales through it earn you {ratePercent}%. To share one piece, open it
          here: on this device, each piece&apos;s page now shows your link for it.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <code className="flex min-h-12 flex-1 items-center rounded-xl border border-line bg-sand px-4 py-2 text-sm break-all">{done.link}</code>
          <CopyButton text={done.link} label="Copy link" />
        </div>
        <div className="mt-6 rounded-xl border border-zari-light bg-ivory p-4">
          <p className="font-medium">Bookmark your seller page</p>
          <p className="mt-1 text-sm text-muted">
            It shows your sales and commissions, and it&apos;s where you change your payout address. Keep this link private: it&apos;s your key.
            {done.email ? " We've also sent a link to confirm your email." : ""}
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
        const r = await post<SignedUp>("/api/partners/signup", {
          name: f.get("name"),
          address: f.get("address"),
          email: f.get("email"),
          country: f.get("country"),
          mailingAddress: f.get("mailingAddress"),
          usPerson: f.get("usPerson"),
          certify: f.get("certify") === "on",
          agree: f.get("agree") === "on",
          termsVersion: TERMS_VERSION,
        });
        setState("idle");
        if (r.ok) {
          saveKey(r.data.key);
          saveCode(r.data.code);
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

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Country you live in</span>
          <select name="country" required defaultValue="" className={field}>
            <option value="" disabled>
              Choose…
            </option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          {err("country")}
        </label>
        <fieldset className="block">
          <legend className="mb-1.5 block text-sm font-medium">US citizen or US tax resident?</legend>
          <div className="flex h-12 items-center gap-5 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" name="usPerson" value="yes" required /> Yes
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="usPerson" value="no" /> No
            </label>
          </div>
          {err("usPerson")}
        </fieldset>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Mailing address</span>
        <span className="mb-1.5 block text-sm text-muted">It goes in our agreement with you.</span>
        <textarea name="mailingAddress" required rows={2} autoComplete="street-address" className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-ink" />
        {err("mailingAddress")}
      </label>

      <details className="rounded-xl border border-line bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium">Seller terms (our agreement)</summary>
        <div className="mt-3">
          <SellerTerms ratePercent={ratePercent} business={business} />
        </div>
      </details>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="certify" className="mt-1 size-4" required />
        <span>I don&apos;t live in a country or region under US embargo, and I&apos;m not on a US sanctions list.</span>
      </label>
      {err("certify")}
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="agree" className="mt-1 size-4" required />
        <span>
          I agree to the{" "}
          <a href="/partners/terms" target="_blank" className="underline underline-offset-4">
            seller terms
          </a>
          , including that I&apos;m responsible for my own taxes.
        </span>
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
