import { NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";

/** The shopper approved in PayPal's or Venmo's window: the admin collects the payment. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: string; orderId?: string } | null;
  if (catalogSource !== "shop" || !body?.token || !body.orderId) return NextResponse.json({ error: "Checkout isn't available." }, { status: 400 });
  try {
    const { status, data } = await shopApi("/api/checkout/paypal/approve", { method: "POST", shopperIp: shopperIp(request.headers), body: { token: body.token, orderId: body.orderId } });
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: "We couldn't confirm the payment just now. If you were charged, you'll get a confirmation email." }, { status: 503 });
  }
}
