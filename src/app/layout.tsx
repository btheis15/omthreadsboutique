import type { Metadata, Viewport } from "next";
import { Kalnia, Mukta, Tiro_Devanagari_Hindi } from "next/font/google";
import { getT } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";
import "./globals.css";

// Mukta is by Ek Type (Mumbai); Tiro Devanagari carries the Hindi accents.
const mukta = Mukta({
  variable: "--font-mukta",
  subsets: ["latin", "devanagari"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});
const kalnia = Kalnia({ variable: "--font-kalnia", subsets: ["latin"], weight: "variable", display: "swap" });
const tiro = Tiro_Devanagari_Hindi({
  variable: "--font-tiro",
  subsets: ["devanagari", "latin"],
  weight: "400",
  style: ["normal", "italic"],
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
      className={`${mukta.variable} ${kalnia.variable} ${tiro.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Meta (Facebook / Instagram Shops) domain verification: plain HTML in the head of every page. */}
        <meta name="facebook-domain-verification" content="gu76jw9po145z7wu17vb4g0krwjwze" />
        {/* Lets CSS hide scroll-reveal content only when JS is available to reveal it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
