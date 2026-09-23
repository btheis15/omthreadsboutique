import "server-only";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";

/**
 * Stores contact messages and newsletter sign-ups in the admin's "Inbox",
 * and (optionally) emails the owner via Resend.
 *
 * Stored in the Om Threads admin when SHOP_API_URL + SHOP_API_TOKEN are set,
 * otherwise in Sanity when SANITY_WRITE_TOKEN is set. Email alerts need
 * RESEND_API_KEY + NOTIFY_EMAIL.
 */
export type Submission = { kind: "message" | "newsletter"; email: string; name?: string; message?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validate(input: unknown): Submission | string {
  if (!input || typeof input !== "object") return "Invalid request.";
  const b = input as Record<string, unknown>;
  // Honeypot: real people never fill the hidden "company" field.
  if (typeof b.company === "string" && b.company.length > 0) return "Invalid request.";
  const email = typeof b.email === "string" ? b.email.trim().slice(0, 200) : "";
  if (!EMAIL_RE.test(email)) return "Please enter a valid email address.";
  const kind = b.kind === "newsletter" ? "newsletter" : "message";
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 120) : undefined;
  const message = typeof b.message === "string" ? b.message.trim().slice(0, 4000) : undefined;
  if (kind === "message" && !message) return "Please write a message.";
  return { kind, email, name, message };
}

export async function saveSubmission(s: Submission): Promise<{ stored: boolean }> {
  const token = process.env.SANITY_WRITE_TOKEN;
  const shopApiUrl = (process.env.SHOP_API_URL ?? "").replace(/\/$/, "");
  let stored = false;
  let storeError: unknown;
  if (shopApiUrl) {
    // If the Mac mini is unreachable, the email alert below still gets the message to the owner.
    try {
      const res = await fetch(`${shopApiUrl}/api/inbox`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.SHOP_API_TOKEN ?? ""}`, "Content-Type": "application/json" },
        body: JSON.stringify(s),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`admin answered ${res.status}`);
      stored = true;
    } catch (e) {
      storeError = e;
      console.error("[inbox] could not save to the admin:", e);
    }
  } else if (projectId && token) {
    const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });
    await client.create({ _type: "submission", ...s, submittedAt: new Date().toISOString() });
    stored = true;
  } else {
    console.warn("[inbox] SANITY_WRITE_TOKEN not set; submission not stored:", s.kind, s.email);
  }

  const resendKey = process.env.RESEND_API_KEY;
  const notify = process.env.NOTIFY_EMAIL;
  if (resendKey && notify) {
    const subject = s.kind === "newsletter" ? `New newsletter sign-up: ${s.email}` : `New message from ${s.name || s.email}`;
    const text =
      s.kind === "newsletter" ? `${s.email} signed up for new-arrival emails.` : `${s.name ?? ""} <${s.email}>\n\n${s.message}`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || "Om Threads <onboarding@resend.dev>",
        to: [notify],
        reply_to: s.email,
        subject,
        text,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Resend answered ${res.status}`);
        stored = true;
      })
      .catch((e) => console.error("[inbox] email failed", e));
  }
  // Nowhere got the message: tell the visitor to try again rather than silently dropping it.
  if (!stored && storeError) throw storeError;
  return { stored };
}
