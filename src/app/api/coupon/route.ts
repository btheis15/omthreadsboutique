import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";
import { type CheckoutLine, TESTER_COOKIE } from "@/lib/payments";

/**
 * Checks a typed coupon code against the cart, for the checkout page to show
 * the discount. The Om Threads admin decides (and checks again when the order
 * is priced), so this only passes the question along.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown; lines?: CheckoutLine[] } | null;
  const code = typeof body?.code === "string" ? body.code.trim().slice(0, 30) : "";
  if (!code) return NextResponse.json({ error: "Type a coupon code first." }, { status: 400 });
  const lines = Array.isArray(body?.lines) ? body.lines.map((l) => ({ productId: String(l.productId ?? ""), variantId: l.variantId ? String(l.variantId) : undefined, qty: Number(l.qty) })) : [];
  if (!lines.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  if (catalogSource !== "shop") return NextResponse.json({ error: "Coupon codes aren't available yet." }, { status: 501 });

  const testerKey = (await cookies()).get(TESTER_COOKIE)?.value;
  try {
    const { status, data } = await shopApi("/api/coupon", { method: "POST", shopperIp: shopperIp(request.headers), body: { code, lines, testerKey } });
    if (status === 200 && typeof data.discountCents === "number") {
      return NextResponse.json({ code: data.code, label: data.label, discountCents: data.discountCents, text: data.text });
    }
    return NextResponse.json({ error: typeof data.error === "string" ? data.error : "That coupon code isn't valid." }, { status: status >= 400 ? status : 502 });
  } catch {
    return NextResponse.json({ error: "Couldn't check that code right now. Please try again in a few minutes." }, { status: 503 });
  }
}
