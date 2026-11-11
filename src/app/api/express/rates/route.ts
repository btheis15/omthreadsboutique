import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";
import { type CheckoutLine, TESTER_COOKIE } from "@/lib/payments";

/**
 * Apple Pay / Google Pay sheet: shipping options for the partial address the wallet shares
 * (city, state, ZIP, country; no street yet). The Om Threads admin asks the carrier and works
 * out the tax per option; this only passes the question along.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { lines?: CheckoutLine[]; address?: Record<string, unknown>; coupon?: unknown } | null;
  const lines = Array.isArray(body?.lines) ? body.lines.map((l) => ({ productId: String(l.productId ?? ""), variantId: l.variantId ? String(l.variantId) : undefined, qty: Number(l.qty) })) : [];
  if (!lines.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  if (catalogSource !== "shop") return NextResponse.json({ error: "Online checkout isn't available yet." }, { status: 501 });
  const a = body?.address ?? {};
  const str = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 100) : "");
  const address = { city: str(a.city), state: str(a.state), postal_code: str(a.postal_code), country: str(a.country).toUpperCase() };
  const coupon = typeof body?.coupon === "string" ? body.coupon.trim().slice(0, 30) : "";

  const testerKey = (await cookies()).get(TESTER_COOKIE)?.value;
  try {
    const { status, data } = await shopApi("/api/express/rates", {
      method: "POST",
      shopperIp: shopperIp(request.headers),
      body: { lines, country: address.country, address, coupon: coupon || undefined, testerKey },
    });
    if (status === 200 && data.fallback === true) return NextResponse.json({ fallback: true, rates: [] });
    if (status === 200 && typeof data.quoteId === "string" && Array.isArray(data.rates)) return NextResponse.json(data);
    return NextResponse.json({ error: typeof data.error === "string" ? data.error : "Couldn't get shipping options right now.", errors: data.errors }, { status: status >= 400 ? status : 502 });
  } catch {
    return NextResponse.json({ error: "Couldn't get shipping options right now. Please try again in a few minutes." }, { status: 503 });
  }
}
