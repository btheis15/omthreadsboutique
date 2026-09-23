import { CartDrawer } from "@/components/cart/CartDrawer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { site } from "@/lib/site";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory"
      >
        Skip to content
      </a>
      {site.announcement && (
        <div className="bg-ink px-4 py-2 text-center text-xs tracking-wide text-ivory">{site.announcement}</div>
      )}
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
