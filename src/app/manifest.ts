import type { MetadataRoute } from "next";
import { getT } from "@/lib/catalog";

/**
 * Added to a home screen, the shop is "Om Threads" with the logo on cream. It still opens as the
 * website in the browser (shoppers keep its back button and share sheet).
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getT();
  return {
    name: t("siteName"),
    short_name: "Om Threads",
    description: t("siteDescription"),
    start_url: "/",
    display: "browser",
    background_color: "#fdfaf2",
    theme_color: "#fdfaf2",
    icons: [
      { src: "/home-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/home-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
