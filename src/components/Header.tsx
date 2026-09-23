"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { crafts } from "@/lib/crafts";
import { categories, nav, site } from "@/lib/site";
import { cart, useCart } from "./cart/store";
import { ArrowIcon, BagIcon, CloseIcon, MenuIcon, SearchIcon } from "./icons";
import { Mandala, Paisley } from "./ornaments";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { count } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  // Close overlays on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/80">
      <div className="container-page flex h-16 items-center justify-between gap-2 md:h-20">
        <div className="flex flex-1 items-center gap-1 md:hidden">
          <button
            type="button"
            className="-ml-2 grid size-11 place-items-center"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon />
          </button>
        </div>

        <Link href="/" className="group flex items-center gap-2.5 leading-none" aria-label="Om Threads Boutique, home">
          <span
            aria-hidden="true"
            className="font-deva grid size-10 place-items-center rounded-full border border-zari/60 pt-1 text-[1.35rem] text-accent transition-transform duration-700 ease-soft group-hover:rotate-[360deg] md:size-11"
          >
            ॐ
          </span>
          <span className="flex flex-col">
            <span className="font-display text-[1.45rem] tracking-wide md:text-[1.7rem]">Om Threads</span>
            <span className="mt-1 text-[0.58rem] tracking-[0.42em] text-muted uppercase">Boutique</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden flex-1 justify-center gap-8 md:flex">
          {nav.map((item) =>
            item.href === "/shop" ? (
              // Desktop mega menu: opens on hover or keyboard focus.
              <div key={item.href} className="group/mega flex items-center">
                <Link
                  href={item.href}
                  aria-haspopup="true"
                  className={`relative py-7 text-sm tracking-wide transition-colors hover:text-accent ${
                    pathname.startsWith("/shop") ? "text-accent" : ""
                  }`}
                >
                  {item.label}
                  <span className="absolute inset-x-0 bottom-5 h-px origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover/mega:scale-x-100" />
                </Link>
                <div className="invisible absolute inset-x-0 top-full -translate-y-2 border-b border-line bg-ivory opacity-0 shadow-[0_24px_48px_-24px_rgba(43,27,18,0.35)] transition duration-300 ease-soft group-focus-within/mega:visible group-focus-within/mega:translate-y-0 group-focus-within/mega:opacity-100 group-hover/mega:visible group-hover/mega:translate-y-0 group-hover/mega:opacity-100">
                  <div className="container-page grid grid-cols-[1fr_1.6fr_1.1fr] gap-10 py-10">
                    <div>
                      <p className="eyebrow mb-4">Shop by type</p>
                      <ul className="space-y-1">
                        <li>
                          <Link href="/shop" className="block py-1.5 font-display text-2xl hover:text-accent">
                            Everything
                          </Link>
                        </li>
                        {categories.map((c) => (
                          <li key={c.slug}>
                            <Link href={`/shop/${c.slug}`} className="block py-1.5 font-display text-2xl hover:text-accent">
                              {c.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="eyebrow mb-4">Shop by craft</p>
                      <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {crafts.map((c) => (
                          <li key={c.value}>
                            <Link
                              href={`/shop?craft=${c.value}`}
                              className="flex items-baseline justify-between gap-3 border-b border-line/70 py-2 text-[0.95rem] hover:text-accent"
                            >
                              {c.label}
                              <span className="font-deva text-sm text-zari">{c.hindi}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href="/shop?sort=newest"
                      className="group/card relative isolate flex flex-col justify-end overflow-hidden rounded-2xl bg-indigo p-7 text-ivory"
                    >
                      <Mandala className="animate-spin-slow absolute -top-16 -right-16 -z-10 size-72 text-zari/30" />
                      <Paisley className="absolute top-6 left-6 -z-10 w-16 text-zari-light/60 transition-transform duration-700 group-hover/card:rotate-12" />
                      <p className="font-deva text-lg text-zari-light">नए आगमन</p>
                      <p className="font-display text-3xl">New arrivals</p>
                      <span className="mt-3 inline-flex items-center gap-2 text-sm text-zari-light">
                        Shop the latest <ArrowIcon size={16} className="transition-transform group-hover/card:translate-x-1" />
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`relative py-7 text-sm tracking-wide transition-colors hover:text-accent ${
                  pathname === item.href ? "text-accent" : ""
                } group/link`}
              >
                {item.label}
                <span className="absolute inset-x-0 bottom-5 h-px origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover/link:scale-x-100" />
              </Link>
            ),
          )}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1 md:flex-none">
          <button
            type="button"
            className="grid size-11 place-items-center"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            className="relative -mr-2 grid size-11 place-items-center"
            aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
            onClick={() => cart.open()}
          >
            <BagIcon />
            {count > 0 && (
              <span
                key={count}
                className="animate-bump absolute top-1.5 right-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[0.7rem] leading-5 font-semibold text-white"
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <form
          role="search"
          className="container-page pb-4"
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get("q")?.toString().trim();
            router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
          }}
        >
          <label className="flex items-center gap-3 rounded-full border border-line bg-white px-4">
            <SearchIcon size={18} className="text-muted" />
            <input
              ref={searchRef}
              name="q"
              type="search"
              placeholder="Search pashmina, kani, silk, navy…"
              className="h-12 w-full bg-transparent text-base outline-none"
              aria-label="Search products"
            />
          </label>
        </form>
      )}

      {/* Mobile menu drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${menuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <div
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMenuOpen(false)}
        />
        <nav
          aria-label="Mobile"
          className={`absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-ivory shadow-xl transition-transform duration-300 ease-soft ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <span className="font-display text-2xl">Menu</span>
            <button
              type="button"
              className="-mr-2 grid size-11 place-items-center"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              tabIndex={menuOpen ? 0 : -1}
            >
              <CloseIcon />
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto px-4 py-2">
            {[{ href: "/shop", label: "Shop all" }, ...categories.map((c) => ({ href: `/shop/${c.slug}`, label: c.title }))].map(
              (item, i) => (
                <li
                  key={item.href}
                  style={{ transitionDelay: menuOpen ? `${120 + i * 50}ms` : "0ms" }}
                  className={`transition duration-500 ease-soft ${menuOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"}`}
                >
                  <Link
                    href={item.href}
                    tabIndex={menuOpen ? 0 : -1}
                    className="flex h-14 items-center border-b border-line font-display text-2xl"
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
            {[
              { href: "/crafts", label: "The crafts of North India" },
              { href: "/care-guide", label: "Care & styling guide" },
              { href: "/about", label: "Our story" },
              { href: "/faq", label: "FAQ" },
              { href: "/contact", label: "Contact" },
            ].map((item) => (
              <li key={item.href}>
                <Link href={item.href} tabIndex={menuOpen ? 0 : -1} className="flex h-12 items-center text-[0.95rem]">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <a
            href={site.etsyUrl}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={menuOpen ? 0 : -1}
            className="m-4 btn btn-outline"
          >
            Visit our Etsy shop
          </a>
        </nav>
      </div>
    </header>
  );
}
