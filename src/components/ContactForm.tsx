"use client";

import { useState } from "react";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  if (state === "done") {
    return (
      <div className="animate-rise rounded-2xl border border-line bg-white p-8 text-center" role="status">
        <p className="font-display text-3xl">Dhanyavaad!</p>
        <p className="mt-2 text-muted">Thank you for your message. We&apos;ll reply within one business day.</p>
      </div>
    );
  }

  const field = "h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-ink";
  return (
    <form
      className="space-y-4 rounded-2xl border border-line bg-white/60 p-5 md:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        setState("sending");
        const data = Object.fromEntries(new FormData(e.currentTarget));
        const res = await fetch("/api/contact", {
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
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Your name</span>
          <input name="name" autoComplete="name" className={field} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Message</span>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-ink"
          placeholder="Ask about a piece, custom orders, gifting…"
        />
      </label>
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {state === "error" && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
