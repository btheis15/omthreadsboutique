import type { Metadata, Viewport } from "next";
import { Kalnia, Mukta, Tiro_Devanagari_Hindi } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getT } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// Mukta is by Ek Type (Mumbai); Tiro Devanagari carries the Hindi accents.
// Speed: only the Latin files are preloaded (the Devanagari ones, about 65 KB each per weight, were fetched on every
// page before anything could paint, ahead of the photo; the browser still loads them on demand when a page
// has Devanagari text). Weight 300 and Tiro's italic aren't used anywhere.
const mukta = Mukta({
  variable: "--font-mukta",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
const kalnia = Kalnia({ variable: "--font-kalnia", subsets: ["latin"], weight: "variable", display: "swap" });
const tiro = Tiro_Devanagari_Hindi({
  variable: "--font-tiro",
  subsets: ["devanagari"],
  weight: "400",
  style: "normal",
  // Not preloaded: it's only the Hindi accents (the ॐ in the top bar), and 63 KB is too much to fetch ahead of the photo.
  preload: false,
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: t("seoHomeTitle"), template: `%s | ${t("siteName")}` },
    description: t("siteDescription"),
    openGraph: { siteName: t("siteName"), type: "website", locale: "en_US" },
    twitter: { card: "summary_large_image" },
    // The name under the icon when it's added to an iPhone home screen.
    appleWebApp: { title: "Om Threads" },
  };
}

export const viewport: Viewport = {
  themeColor: "#fdfaf2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      // Tells Next.js to turn smooth scrolling off while it jumps to the top of a new page (otherwise the page
      // visibly scrolls up during the page transition).
      data-scroll-behavior="smooth"
      className={`${mukta.variable} ${kalnia.variable} ${tiro.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Meta (Facebook / Instagram Shops) domain verification: plain HTML in the head of every page. */}
        <meta name="facebook-domain-verification" content="gu76jw9po145z7wu17vb4g0krwjwze" />
        <meta name="facebook-domain-verification" content="ix37imgh8ape4yg69nvzze3ymwzgti" />
        {/* Lets CSS hide scroll-reveal content only when JS is available to reveal it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
