import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";
import { type CheckoutLine, TESTER_COOKIE } from "@/lib/payments";

/**
 * Live shipping options for the cart and address. The Om Threads admin asks
 * the carrier, keeps the answer as a short-lived quote, and checks it again
 * when the order is placed, so this only passes the question along.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { lines?: CheckoutLine[]; country?: string; customer?: unknown } | null;
  const lines = Array.isArray(body?.lines) ? body.lines.map((l) => ({ productId: String(l.productId ?? ""), variantId: l.variantId ? String(l.variantId) : undefined, qty: Number(l.qty) })) : [];
  if (!lines.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  if (catalogSource !== "shop") return NextResponse.json({ error: "Online checkout isn't available yet. Please buy on Etsy." }, { status: 501 });

  const testerKey = (await cookies()).get(TESTER_COOKIE)?.value;
  try {
    const { status, data } = await shopApi("/api/shipping-rates", {
      method: "POST",
      shopperIp: shopperIp(request.headers),
      body: { lines, country: body?.country, customer: body?.customer, testerKey },
    });
    if (status === 200 && typeof data.quoteId === "string" && Array.isArray(data.rates)) {
      return NextResponse.json({ quoteId: data.quoteId, rates: data.rates, expiresAt: data.expiresAt });
    }
    return NextResponse.json({ error: typeof data.error === "string" ? data.error : "Couldn't get shipping options right now.", errors: data.errors }, { status: status >= 400 ? status : 502 });
  } catch {
    return NextResponse.json({ error: "Couldn't get shipping options right now. Please try again in a few minutes." }, { status: 503 });
  }
}
