import { NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";

/**
 * Passes "this shopper reached checkout" to the shop, which may send one reminder email if the order isn't finished
 * (only with consent). Fire-and-forget from the page: whatever happens here, the answer is ok, so checkout is never affected.
 * The shop update may not be installed yet (404); that is silent too.
 */
const OK = () => NextResponse.json({ ok: true });

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const email = typeof body?.email === "string" ? body.email.trim().slice(0, 200) : "";
  if (!body || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !Array.isArray(body.lines) || body.lines.length === 0 || body.lines.length > 30) return OK();
  const lines = body.lines.map((l: Record<string, unknown>) => ({
    productId: String(l?.productId ?? "").slice(0, 100),
    ...(l?.variantId ? { variantId: String(l.variantId).slice(0, 100) } : {}),
    qty: Math.max(1, Math.min(99, Math.floor(Number(l?.qty)) || 1)),
  }));
  if (catalogSource !== "shop") return OK();
  try {
    await shopApi("/api/checkout/started", {
      method: "POST",
      shopperIp: shopperIp(request.headers),
      body: {
        email,
        ...(typeof body.name === "string" && body.name.trim() ? { name: body.name.trim().slice(0, 100) } : {}),
        consent: body.consent === true,
        lines,
        ...(typeof body.coupon === "string" && body.coupon.trim() ? { coupon: body.coupon.trim().slice(0, 30) } : {}),
      },
    });
  } catch {
    // shop unreachable: stay silent
  }
  return OK();
}
