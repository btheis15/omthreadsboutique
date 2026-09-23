import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { CACHE_TAG, isShopCatalogReachable } from "@/lib/catalog";

/**
 * Refreshes the site's cached catalog so changes appear within seconds.
 * Called by the Om Threads admin on the Mac mini (Authorization: Bearer
 * REVALIDATE_SECRET), or by a signed Sanity webhook. Setup: ADMIN_GUIDE.md.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET || process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ message: "Missing REVALIDATE_SECRET" }, { status: 500 });

  const auth = req.headers.get("authorization") ?? "";
  if (auth.startsWith("Bearer ")) {
    if (!safeEqual(auth.slice(7), secret)) return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
    // Only drop the cached catalog once the fresh one is reachable. Otherwise
    // every page would error until the Mac mini came back.
    if (!(await isShopCatalogReachable()))
      return NextResponse.json({ message: "Catalog unreachable; keeping cached pages" }, { status: 503 });
    refresh();
    return NextResponse.json({ revalidated: true, source: "admin" });
  }

  const { isValidSignature, body } = await parseBody<{ _type?: string }>(req, secret, true);
  if (!isValidSignature) return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  refresh();
  return NextResponse.json({ revalidated: true, type: body?._type ?? null });
}

function refresh() {
  revalidateTag(CACHE_TAG, { expire: 0 });
  revalidatePath("/", "layout");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
