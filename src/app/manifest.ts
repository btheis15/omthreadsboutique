import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Added to a home screen, the shop is "Om Threads" with the logo on cream. It still opens as the
 * website in the browser (shoppers keep its back button and share sheet).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "Om Threads",
    description: site.description,
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
