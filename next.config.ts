import type { NextConfig } from "next";

const shopApiUrl = (process.env.SHOP_API_URL ?? "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL("https://cdn.sanity.io/images/**")],
  },
  // Photos and videos uploaded in the Om Threads admin live on the Mac mini.
  // Serving them through this site keeps one domain and lets Vercel's CDN
  // cache them (the files never change, see omthreads-admin/src/public-app.js).
  // PayPal's and Venmo's buttons open a window that has to be able to talk back to the checkout page.
  async headers() {
    return [{ source: "/checkout", headers: [{ key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" }] }];
  },
  async rewrites() {
    return shopApiUrl ? [{ source: "/media/:path*", destination: `${shopApiUrl}/media/:path*` }] : [];
  },
};

export default nextConfig;
