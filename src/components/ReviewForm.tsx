"use client";

import { useState } from "react";

type Piece = { slug: string; title: string };
const MIN = 20;
const MAX = 1000;

export function ReviewForm({ pieces, initialProduct, thanks }: { pieces: Piece[]; initialProduct?: string; thanks: string }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [rating, setRating] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-line bg-white p-8 text-center" role="status">
        <p className="font-display text-3xl">{thanks}</p>
      </div>
    );
  }

  const field = "h-12 w-full rounded-xl border border-line bg-white px-4 text-base outline-none focus:border-ink";
  const err = (k: string) => errors[k] && <p role="alert" className="mt-1 text-sm text-accent">{errors[k]}</p>;
  return (
    <form
      noValidate
      className="space-y-4 rounded-2xl border border-line bg-white/60 p-5 md:p-8"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        const found: Record<string, string> = {};
        const name = (f.name ?? "").trim();
        const text = (f.text ?? "").trim();
        if (!name || name.length > 60) found.name = "Please add your name (up to 60 letters).";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((f.email ?? "").trim())) found.email = "Please add a valid email.";
        if (!rating) found.rating = "Please choose a star rating.";
        if (text.length < MIN) found.text = `Please write at least ${MIN} characters.`;
        if (text.length > MAX) found.text = `Please keep it under ${MAX} characters.`;
        setErrors(found);
        if (Object.keys(found).length) return;
        setState("sending");
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, location: (f.location ?? "").trim(), email: f.email.trim(), rating, text, productSlug: f.productSlug || undefined, website: f.website ?? "" }),
        }).catch(() => null);
        if (res?.ok) return setState("done");
        const j = (await res?.json().catch(() => null)) as { error?: string; errors?: Record<string, string> } | null;
        setErrors({ ...(j?.errors ?? {}), form: j?.error ?? "Something went wrong. Please try again." });
        setState("idle");
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Your name</span>
          <input name="name" autoComplete="name" maxLength={60} className={field} />
          {err("name")}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Town <span className="font-normal text-muted">(optional)</span></span>
          <input name="location" maxLength={60} className={field} />
          {err("location")}
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Email <span className="font-normal text-muted">(never shown)</span></span>
        <input name="email" type="email" autoComplete="email" className={field} />
        {err("email")}
      </label>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Your rating</legend>
        <div className="flex gap-1" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
              onClick={() => setRating(n)}
              className={`h-11 w-11 text-3xl leading-none ${n <= rating ? "text-marigold" : "text-line"}`}
            >
              ★
            </button>
          ))}
        </div>
        {err("rating")}
      </fieldset>
      {pieces.length > 0 && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Which piece? <span className="font-normal text-muted">(optional)</span></span>
          <select name="productSlug" defaultValue={pieces.some((p) => p.slug === initialProduct) ? initialProduct : ""} className={field}>
            <option value="">Not sure / more than one</option>
            {pieces.map((p) => (
              <option key={p.slug} value={p.slug}>{p.title}</option>
            ))}
          </select>
        </label>
      )}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Your review</span>
        <textarea name="text" rows={5} maxLength={MAX} className="w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none focus:border-ink" placeholder="How does it feel, fit and wear?" />
        {err("text")}
      </label>
      {/* Honeypot: off-screen, not display:none; people never reach it. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {errors.form && <p role="alert" className="text-sm text-accent">{errors.form}</p>}
      <button className="btn btn-primary w-full sm:w-auto" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send my review"}
      </button>
    </form>
  );
}
