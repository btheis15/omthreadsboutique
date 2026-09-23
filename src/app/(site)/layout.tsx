import { Analytics } from "@vercel/analytics/next";
import { ViewTransition } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { getSettings } from "@/lib/catalog";
import { isSanityConfigured } from "@/sanity/env";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      {/* Shared shapes referenced from CSS (e.g. the `arch` utility). */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <clipPath id="mehrab" clipPathUnits="objectBoundingBox">
          <path d="M0,1 L0,0.36 C0,0.2 0.2,0.11 0.36,0.07 C0.44,0.05 0.48,0.03 0.5,0 C0.52,0.03 0.56,0.05 0.64,0.07 C0.8,0.11 1,0.2 1,0.36 L1,1 Z" />
        </clipPath>
      </svg>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to content
      </a>
      {!isSanityConfigured && (
        <div className="bg-marigold px-4 py-1.5 text-center text-xs font-medium text-ink">
          Preview mode: showing sample products. Connect the admin to show your own (see ADMIN_GUIDE.md).
        </div>
      )}
      {settings.announcement && (
        <div className="bg-indigo-deep px-4 py-2 text-center text-xs tracking-wide text-ivory/90">
          <span className="font-deva mr-2 text-zari-light">ॐ</span>
          {settings.announcement}
        </div>
      )}
      <Header />
      <ViewTransition default="none" update="page">
        <main id="main">{children}</main>
      </ViewTransition>
      <Footer settings={settings} />
      <CartDrawer freeShippingThreshold={settings.freeShippingThreshold} />
      <RevealObserver />
      <Analytics />
    </>
  );
}
