import type { Metadata } from "next";
import { PartnerPage } from "@/components/partners/PartnerPage";
import type { SharePiece } from "@/components/partners/shared";
import { getProducts, isSoldOut } from "@/lib/catalog";

export const metadata: Metadata = { title: "Your seller page", robots: { index: false } };

export const revalidate = 300;

export default async function PartnerMePage() {
  // The pieces a partner can share, each with their link (the page itself is the partner's, in the browser).
  const pieces: SharePiece[] = (await getProducts()).map((p) => ({
    slug: p.slug,
    title: p.title,
    image: p.images[0]?.url ? { url: p.images[0].url, alt: p.images[0].alt } : null,
    soldOut: isSoldOut(p),
  }));
  return (
    <div className="container-page max-w-3xl pt-10 md:pt-16">
      <PartnerPage pieces={pieces} />
    </div>
  );
}
