import "server-only";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";

/**
 * Stores contact messages and newsletter sign-ups in the admin's "Inbox",
 * and (optionally) emails the owner via Resend.
 *
 * Needs SANITY_WRITE_TOKEN. Email alerts also need RESEND_API_KEY + NOTIFY_EMAIL.
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
  let stored = false;
  if (projectId && token) {
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
    }).catch((e) => console.error("[inbox] email failed", e));
    stored = true;
  }
  return { stored };
}
