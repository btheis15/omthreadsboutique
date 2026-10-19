import { type NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/catalog";
import { tagId } from "@/lib/tags";

/**
 * A printed tag's QR code (see src/lib/tags.ts): opens the piece's page, with the option on the tag
 * (e.g. its colour) chosen. A piece that isn't on the site (sold in person only, or gone) opens the shop.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const id = tagId((await params).code);
  const products = id ? await getProducts() : [];
  for (const p of products) {
    const variant = p.variants?.find((v) => v.id === id);
    if (p.id === id || variant) {
      const to = new URL(`/product/${encodeURIComponent(p.slug)}`, req.url);
      if (variant) to.searchParams.set("option", variant.id);
      return NextResponse.redirect(to, 307);
    }
  }
  return NextResponse.redirect(new URL("/shop", req.url), 307);
}
