import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";
import { type CheckoutLine, TESTER_COOKIE } from "@/lib/payments";

/**
 * Apple Pay / Google Pay sheet, once the shopper has approved it: the admin re-reads every price,
 * checks the shipping quote, works out the tax for the full address, saves the order and opens the
 * payment for the exact total. Nothing about money from the browser is trusted (the expected total is
 * only compared with the real one).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const raw = body?.lines as CheckoutLine[] | undefined;
  const lines = Array.isArray(raw) ? raw.map((l) => ({ productId: String(l.productId ?? ""), variantId: l.variantId ? String(l.variantId) : undefined, qty: Number(l.qty) })) : [];
  if (!lines.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  if (catalogSource !== "shop") return NextResponse.json({ error: "Online checkout isn't available yet." }, { status: 501 });
  const str = (v: unknown, n = 200) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const sh = (body?.shipping ?? {}) as { name?: unknown; address?: Record<string, unknown> };
  const ad = sh.address ?? {};
  const shipping = {
    name: str(sh.name),
    address: { line1: str(ad.line1), line2: str(ad.line2) || undefined, city: str(ad.city), state: str(ad.state), postal_code: str(ad.postal_code, 20), country: str(ad.country, 2).toUpperCase() },
  };
  const coupon = str(body?.coupon, 30);
  const expected = Number(body?.expectedTotalCents);

  const testerKey = (await cookies()).get(TESTER_COOKIE)?.value;
  try {
    const { status, data } = await shopApi("/api/express/order", {
      method: "POST",
      shopperIp: shopperIp(request.headers),
      body: {
        lines,
        quoteId: str(body?.quoteId, 100),
        rateId: str(body?.rateId, 200),
        coupon: coupon || undefined,
        giftNote: str(body?.giftNote, 255) || undefined,
        name: str(body?.name),
        email: str(body?.email),
        phone: str(body?.phone, 40),
        shipping,
        expectedTotalCents: Number.isFinite(expected) ? Math.round(expected) : undefined,
        testerKey,
      },
    });
    if (status === 200 && typeof data.clientSecret === "string" && typeof data.orderToken === "string") {
      return NextResponse.json({ clientSecret: data.clientSecret, orderToken: data.orderToken, totalCents: data.totalCents, taxCents: data.taxCents });
    }
    return NextResponse.json({ error: typeof data.error === "string" ? data.error : "Couldn't start the payment.", errors: data.errors }, { status: status >= 400 ? status : 502 });
  } catch {
    return NextResponse.json({ error: "Checkout is taking a break. Please try again in a few minutes." }, { status: 503 });
  }
}
