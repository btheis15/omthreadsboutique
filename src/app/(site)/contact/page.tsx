import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { Divider } from "@/components/ornaments";
import { getFeedPage, getSettings, getT } from "@/lib/catalog";
import { contactContent } from "@/lib/page-content";
import { site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("seoContactTitle"), description: t("seoContactDescription"), alternates: { canonical: "/contact" } };
}

export const revalidate = 300;

export default async function ContactPage() {
  const [settings, page] = await Promise.all([getSettings(), getFeedPage("contact")]);
  const c = contactContent(page);
  const channels = [
    { href: site.contactMailto, label: c.channels.email, value: site.contactEmail, external: false },
    settings.whatsapp && {
      href: `https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`,
      label: c.channels.whatsapp[0],
      value: c.channels.whatsapp[1],
      external: true,
    },
    { href: site.etsyUrl, label: c.channels.etsy[0], value: c.channels.etsy[1], external: true },
    settings.instagramUrl && { href: settings.instagramUrl, label: c.channels.instagram[0], value: c.channels.instagram[1], external: true },
  ].filter(Boolean) as { href: string; label: string; value: string; external: boolean }[];

  return (
    <div className="container-page max-w-3xl pt-10 md:pt-16">
      <p className="font-deva text-xl text-accent" data-reveal>
        नमस्ते
      </p>
      <h1 className="mt-2 text-4xl md:text-6xl" data-reveal style={{ "--i": 1 } as React.CSSProperties}>
        {c.title}
      </h1>
      <p className="mt-4 text-lg text-muted" data-reveal style={{ "--i": 2 } as React.CSSProperties}>
        {c.intro}
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
