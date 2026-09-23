import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${site.name}.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="container-page max-w-3xl pt-10 md:pt-16">
      <h1 className="text-4xl md:text-6xl">We&apos;d love to hear from you</h1>
      <p className="mt-4 text-lg text-muted">
        Questions about a piece, a custom order or styling advice? Reach out and we&apos;ll reply within one business
        day.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {site.email && (
          <a href={`mailto:${site.email}`} className="rounded-xl border border-line bg-white p-6 hover:border-ink">
            <p className="eyebrow mb-2">Email</p>
            <p className="text-lg">{site.email}</p>
          </a>
        )}
        <a
          href={site.etsyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-line bg-white p-6 hover:border-ink"
        >
          <p className="eyebrow mb-2">Message us on Etsy</p>
          <p className="text-lg">omthreadsboutique.etsy.com</p>
        </a>
        {site.instagramUrl && (
          <a
            href={site.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-line bg-white p-6 hover:border-ink"
          >
            <p className="eyebrow mb-2">Instagram</p>
            <p className="text-lg">Follow along</p>
          </a>
        )}
      </div>

      <p className="mt-10 text-muted">
        Looking for shipping or return details? See our <Link href="/faq" className="underline underline-offset-4">FAQ</Link>.
      </p>
    </div>
  );
}
