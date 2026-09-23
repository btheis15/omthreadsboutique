import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { CACHE_TAG } from "@/lib/catalog";

/**
 * Called by a Sanity webhook whenever a product, collection or page is
 * published, so changes appear on the site within seconds.
 * Setup steps are in ADMIN_GUIDE.md.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ message: "Missing SANITY_REVALIDATE_SECRET" }, { status: 500 });

  const { isValidSignature, body } = await parseBody<{ _type?: string }>(req, secret, true);
  if (!isValidSignature) return NextResponse.json({ message: "Invalid signature" }, { status: 401 });

  revalidateTag(CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
  return NextResponse.json({ revalidated: true, type: body?._type ?? null });
}
