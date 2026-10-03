import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";
import { type CheckoutLine, TESTER_COOKIE } from "@/lib/payments";

/**
 * Starts a payment for the cart. The Om Threads admin re-reads every price
 * and stock count (nothing about money from the browser is trusted), saves
 * the order and returns the payment page to send the shopper to (Stripe,
 * Exodus, the thank-you page with Zelle's details, or the Bitcoin Cash
 * payment screen), or, for PayPal and Venmo, what the page needs to show
 * PayPal's buttons.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    lines?: CheckoutLine[];
    provider?: string;
    country?: string;
    rateId?: string;
    testAs?: string;
    customer?: unknown;
    giftNote?: string;
    receipt?: string;
  } | null;
  const lines = Array.isArray(body?.lines) ? body.lines.map((l) => ({ productId: String(l.productId ?? ""), variantId: l.variantId ? String(l.variantId) : undefined, qty: Number(l.qty) })) : [];
  if (!lines.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  if (catalogSource !== "shop") return NextResponse.json({ error: "Online checkout isn't available yet. Please buy on Etsy." }, { status: 501 });

  const testerKey = (await cookies()).get(TESTER_COOKIE)?.value;
  try {
    const { status, data } = await shopApi("/api/checkout", {
      method: "POST",
      shopperIp: shopperIp(request.headers),
      body: { lines, provider: body?.provider, country: body?.country, rateId: body?.rateId, testAs: body?.testAs, customer: body?.customer, giftNote: typeof body?.giftNote === "string" ? body.giftNote.slice(0, 255) : undefined, receipt: ["email", "token", "both"].includes(body?.receipt ?? "") ? body?.receipt : undefined, testerKey },
    });
    if (status === 200 && typeof data.url === "string") return NextResponse.json({ url: data.url });
    // PayPal and Venmo: the order is priced; the checkout page now shows PayPal's own buttons.
    if (status === 200 && data.paypal) return NextResponse.json({ paypal: data.paypal });
    return NextResponse.json({ error: typeof data.error === "string" ? data.error : "Checkout isn't available right now.", errors: data.errors }, { status: status >= 400 ? status : 502 });
  } catch {
    return NextResponse.json({ error: "Checkout is taking a break. Please try again in a few minutes, or buy on Etsy." }, { status: 503 });
  }
}
