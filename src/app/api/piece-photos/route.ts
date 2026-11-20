import { NextResponse } from "next/server";
import { getLists, getProduct } from "@/lib/catalog";
import { craftByValue, materialLabel } from "@/lib/lists";
import type { ProductImage } from "@/lib/types";

/** What the checkout's photo viewer shows for one piece. */
export type PiecePhotos = {
  images: ProductImage[];
  /** Each option's own photo (by option id), so the viewer can start on the colour being bought and skip the others'. */
  optionImages: Record<string, string>;
  /** Short facts under the photos, e.g. "Wool", "70 × 200 cm", "Kullu weave", "Made in Himachal Pradesh". */
  details: string[];
};

/**
 * The photos and a few facts for the pieces in a shopper's cart (GET ?slugs=a,b), for the checkout page.
 * The cart only remembers one photo per line; this fills in the rest. Read from the cached catalog.
 */
export async function GET(request: Request) {
  const slugs = [...new Set((new URL(request.url).searchParams.get("slugs") ?? "").split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 20);
  const [lists, products] = await Promise.all([getLists(), Promise.all(slugs.map((s) => getProduct(s)))]);
  const out: Record<string, PiecePhotos> = {};
  products.forEach((p, i) => {
    if (!p) return;
    const craft = craftByValue(lists, p.craft);
    out[slugs[i]] = {
      images: p.images,
      optionImages: Object.fromEntries((p.variants ?? []).filter((v) => v.image?.url).map((v) => [v.id, v.image!.url!])),
      details: [materialLabel(lists, p.material), p.dimensions, craft?.label, p.origin ? `Made in ${p.origin}` : undefined].filter((d): d is string => Boolean(d?.trim())),
    };
  });
  return NextResponse.json(out, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
}
