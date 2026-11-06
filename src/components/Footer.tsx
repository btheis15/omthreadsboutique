import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/logo.png";
import { site } from "@/lib/site";
import type { Menus, T } from "@/lib/site-text";
import type { SiteSettings } from "@/lib/types";
import { NewsletterForm } from "./NewsletterForm";
import { BorderBand, JaaliPattern, Mandala } from "./ornaments";

const groups = (categories: { slug: string; title: string }[]) => [
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
      { href: "/crafts", label: "The crafts" },
      { href: "/policies/privacy", label: "Privacy" },
      { href: "/policies/terms", label: "Terms" },
    ],
  },
];

export function Footer({
  settings,
  categories,
  partnersOpen = false,
  t,
  text,
  menu,
}: {
  settings: SiteSettings;
  categories: { slug: string; title: string }[];
  partnersOpen?: boolean;
  t: T;
  /** The owner's text overrides, for the sign-up form (a client component). */
  text: Record<string, string>;
  /** The owner's footer menu; absent = the built-in columns. */
  menu?: Menus["footer"];
}) {
  const allGroups = menu ? [{ title: "Links", links: menu }] : groups(categories);
  return (
    <footer className="relative mt-24 overflow-hidden bg-indigo-deep text-ivory">
      <BorderBand id="footer-band" className="text-zari" />
      <JaaliPattern id="footer-jaali" className="pointer-events-none absolute inset-0 text-zari-light" opacity={0.08} />
      <Mandala className="animate-spin-slow pointer-events-none absolute -right-40 -bottom-40 size-[28rem] text-zari/15" />

      <div className="container-page relative py-14">
        <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between" data-reveal>
          <div>
            <p className="font-deva text-lg text-zari-light">{t("footerNewsletterHindi")}</p>
            <h2 className="mt-1 text-3xl md:text-4xl">{t("footerNewsletterHeading")}</h2>
            <p className="mt-2 text-ivory/70">{t("footerNewsletterBody")}</p>
          </div>
          <NewsletterForm tone="dark" text={text} />
        </div>

        <div className="grid grid-cols-2 gap-8 border-t border-ivory/15 pt-10 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <p className="flex items-center gap-3 font-display text-2xl">
              <Image src={logo} alt="" sizes="56px" className="size-14 shrink-0" /> {t("siteName")}
            </p>
            <p className="mt-2 max-w-xs text-sm text-ivory/70">{t("siteTagline")}.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={site.etsyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-zari/60 px-4 text-sm hover:bg-zari hover:text-indigo-deep"
              >
                {t("footerEtsyButton")}
              </a>
              {settings.instagramUrl && (
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center rounded-full border border-ivory/30 px-4 text-sm hover:bg-ivory hover:text-indigo-deep"
                >
                  Instagram
                </a>
              )}
            </div>
          </div>
          {(partnersOpen && !menu ? allGroups.map((g) => (g.title === "About" ? { ...g, links: [...g.links, { href: "/partners", label: "Sell for Om Threads" }] } : g)) : allGroups).map((g) => (
            <div key={g.title}>
              <h3 className="mb-3 font-sans text-xs font-semibold tracking-[0.2em] text-zari-light uppercase">{g.title}</h3>
              <ul className="space-y-1">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="inline-block py-1.5 text-[0.95rem] text-ivory/85 hover:text-zari-light">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 text-xs text-ivory/55">
          {t("footerCopyright", { year: new Date().getFullYear(), name: t("siteName") })}
        </p>
      </div>
    </footer>
  );
}
