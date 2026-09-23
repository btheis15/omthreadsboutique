import Link from "next/link";
import { categories, site } from "@/lib/site";
import { NewsletterForm } from "./NewsletterForm";

const groups = [
  {
    title: "Shop",
    links: [{ href: "/shop", label: "Shop all" }, ...categories.map((c) => ({ href: `/shop/${c.slug}`, label: c.title }))],
  },
  {
    title: "Help",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/care-guide", label: "Care guide" },
      { href: "/policies/shipping", label: "Shipping" },
      { href: "/policies/returns", label: "Returns & exchanges" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "Our story" },
      { href: "/policies/privacy", label: "Privacy" },
      { href: "/policies/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-sand">
      <div className="container-page py-14">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl">Be first to see new arrivals</h2>
            <p className="mt-2 text-muted">New pieces, styling ideas and the occasional offer. No spam.</p>
          </div>
          <NewsletterForm />
        </div>

        <div className="grid grid-cols-2 gap-8 border-t border-line pt-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <p className="font-display text-2xl">{site.name}</p>
            <p className="mt-2 max-w-xs text-sm text-muted">{site.tagline}.</p>
            <a
              href={site.etsyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink px-4 py-2 text-sm hover:bg-ink hover:text-ivory"
            >
              <span aria-hidden>★</span> Shop us on Etsy
            </a>
          </div>
          {groups.map((g) => (
            <div key={g.title}>
              <h3 className="eyebrow mb-3 font-sans">{g.title}</h3>
              <ul className="space-y-1">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-block py-1.5 text-[0.95rem] hover:text-accent">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 text-xs text-muted">
          © {new Date().getFullYear()} {site.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
