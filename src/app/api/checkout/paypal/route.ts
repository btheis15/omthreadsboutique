import { NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";

/** A PayPal or Venmo button was pressed: the admin makes PayPal's order for the (already priced) order. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: string; fundingSource?: string } | null;
  if (catalogSource !== "shop" || !body?.token) return NextResponse.json({ error: "Checkout isn't available." }, { status: 400 });
  try {
    const { status, data } = await shopApi("/api/checkout/paypal/order", {
      method: "POST",
      shopperIp: shopperIp(request.headers),
      body: { token: body.token, fundingSource: body.fundingSource === "venmo" ? "venmo" : "paypal" },
    });
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: "Checkout is taking a break. Please try again in a few minutes." }, { status: 503 });
  }
}
