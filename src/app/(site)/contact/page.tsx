import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { Divider } from "@/components/ornaments";
import { getSettings } from "@/lib/catalog";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${site.name}.`,
  alternates: { canonical: "/contact" },
};

export const revalidate = 300;

export default async function ContactPage() {
  const settings = await getSettings();
  const channels = [
    settings.email && { href: `mailto:${settings.email}`, label: "Email", value: settings.email, external: false },
    settings.whatsapp && {
      href: `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`,
      label: "WhatsApp",
      value: "Chat with us",
      external: true,
    },
    { href: site.etsyUrl, label: "Message us on Etsy", value: "omthreadsboutique.etsy.com", external: true },
    settings.instagramUrl && { href: settings.instagramUrl, label: "Instagram", value: "Follow along", external: true },
  ].filter(Boolean) as { href: string; label: string; value: string; external: boolean }[];

  return (
    <div className="container-page max-w-3xl pt-10 md:pt-16">
      <p className="font-deva text-xl text-accent" data-reveal>
        नमस्ते
      </p>
      <h1 className="mt-2 text-4xl md:text-6xl" data-reveal style={{ "--i": 1 } as React.CSSProperties}>
        We&apos;d love to hear from you
      </h1>
      <p className="mt-4 text-lg text-muted" data-reveal style={{ "--i": 2 } as React.CSSProperties}>
        Questions about a piece, a custom order, gifting or styling? Write to us and we&apos;ll reply within one business
        day.
      </p>

      <div className="mt-10" data-reveal>
        <ContactForm />
      </div>

      <Divider className="my-12" />

      <div className="grid gap-4 sm:grid-cols-2">
        {channels.map((c, i) => (
          <a
            key={c.label}
            href={c.href}
            {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="rounded-xl border border-line bg-white p-6 transition hover:-translate-y-0.5 hover:border-zari hover:shadow-lg"
            data-reveal
            style={{ "--i": i } as React.CSSProperties}
          >
            <p className="eyebrow mb-2">{c.label}</p>
            <p className="text-lg">{c.value}</p>
          </a>
        ))}
      </div>

      <p className="mt-10 text-muted">
        Looking for shipping or return details? See our{" "}
        <Link href="/faq" className="underline underline-offset-4">
          FAQ
        </Link>
        .
      </p>
    </div>
  );
}
