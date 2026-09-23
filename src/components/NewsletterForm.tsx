"use client";

import { useState } from "react";

/** Newsletter sign-up. Saved to the admin Inbox via /api/subscribe. */
export function NewsletterForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  if (state === "done") {
    return (
      <p className="animate-rise text-[1rem]" role="status">
        Thank you! 🙏 You&apos;re on the list for new arrivals.
      </p>
    );
  }
  const dark = tone === "dark";
  return (
    <form
      className="w-full max-w-md"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.currentTarget));
        setState("sending");
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }).catch(() => null);
        if (res?.ok) setState("done");
        else {
          setState("error");
          setError(((await res?.json().catch(() => null)) as { error?: string } | null)?.error ?? "Please try again.");
        }
      }}
    >
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={`newsletter-email-${tone}`}>
          Email address
        </label>
        <input
          id={`newsletter-email-${tone}`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email"
          className={`h-12 min-w-0 flex-1 rounded-full border px-5 text-base outline-none ${
            dark
              ? "border-ivory/25 bg-ivory/10 text-ivory placeholder:text-ivory/50 focus:border-zari-light"
              : "border-line bg-white focus:border-ink"
          }`}
        />
        {/* Honeypot for bots */}
        <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <button
          type="submit"
          disabled={state === "sending"}
          className={`btn shrink-0 ${dark ? "bg-zari text-indigo-deep hover:bg-zari-light" : "btn-primary"}`}
        >
          {state === "sending" ? "…" : "Sign up"}
        </button>
      </div>
      {state === "error" && (
        <p role="alert" className={`mt-2 text-sm ${dark ? "text-marigold" : "text-accent"}`}>
          {error}
        </p>
      )}
    </form>
  );
}
