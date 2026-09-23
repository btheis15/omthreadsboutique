"use client";

import { useState } from "react";

/**
 * Newsletter signup. Not yet connected to an email service. Hook it up to
 * Mailchimp, Klaviyo or Resend in `onSubmit` (see ADMIN_GUIDE.md).
 */
export function NewsletterForm() {
  const [done, setDone] = useState(false);
  if (done) {
    return <p className="text-[0.95rem]">Thank you! You&apos;re on the list for new arrivals.</p>;
  }
  return (
    <form
      className="flex w-full max-w-md gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <label className="sr-only" htmlFor="newsletter-email">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        autoComplete="email"
        placeholder="Your email"
        className="h-12 min-w-0 flex-1 rounded-full border border-line bg-white px-5 text-base outline-none focus:border-ink"
      />
      <button type="submit" className="btn btn-primary shrink-0">
        Sign up
      </button>
    </form>
  );
}
