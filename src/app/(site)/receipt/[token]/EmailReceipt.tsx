"use client";

import { useState } from "react";

/** "Email me this receipt": sent from the shop's own email (at most three per sale). */
export function EmailReceipt({ token, canEmail }: { token: string; canEmail: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [to, setTo] = useState("");
  if (!canEmail) return <p className="mt-3 text-sm text-muted">This receipt has already been emailed the most times it can be.</p>;
  if (state === "done")
    return (
      <p className="mt-3 animate-rise" role="status">
        Sent to {to}. 🙏 It can take a minute to arrive.
      </p>
    );
  return (
    <form
      className="mt-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        const res = await fetch("/api/receipt/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email: to }),
        }).catch(() => null);
        if (res?.ok) setState("done");
        else {
          setState("error");
          setError(((await res?.json().catch(() => null)) as { error?: string } | null)?.error ?? "Please try again.");
        }
      }}
    >
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="receipt-email">
          Your email
        </label>
        <input
          id="receipt-email"
          type="email"
          required
          autoComplete="email"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Your email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-12 min-w-0 flex-1 rounded-full border border-line bg-white px-5 text-base outline-none focus:border-ink"
        />
        <button type="submit" disabled={state === "sending"} className="btn btn-primary shrink-0">
          {state === "sending" ? "Sending…" : "Email it"}
        </button>
      </div>
      {state === "error" && (
        <p className="mt-2 text-sm text-sale" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
