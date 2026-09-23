import type { Metadata, Viewport } from "next";
import { Kalnia, Mukta, Tiro_Devanagari_Hindi } from "next/font/google";
import { site, siteUrl } from "@/lib/site";
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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: `${site.name} | Shawls & Stoles from North India`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: "website", locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#fbf6ee",
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
        {/* Lets CSS hide scroll-reveal content only when JS is available to reveal it. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
