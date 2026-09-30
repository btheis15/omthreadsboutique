import { type NextRequest, NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";

/**
 * Where PayPal sends the shopper back when it used a full-page redirect
 * instead of its window (?order=<our token>&token=<PayPal order>): collect,
 * then show the thank-you page.
 */
export async function GET(req: NextRequest) {
  const order = req.nextUrl.searchParams.get("order") ?? "";
  const paypalOrder = req.nextUrl.searchParams.get("token") ?? "";
  const back = new URL("/checkout?cancelled=1", req.url);
  if (catalogSource !== "shop" || !/^[\w-]{10,64}$/.test(order) || !/^\w{5,40}$/.test(paypalOrder)) return NextResponse.redirect(back);
  try {
    await shopApi("/api/checkout/paypal/approve", { method: "POST", shopperIp: shopperIp(req.headers), body: { token: order, orderId: paypalOrder } });
  } catch {
    /* the thank-you page still shows where the order stands */
  }
  return NextResponse.redirect(new URL(`/checkout/success?order=${order}`, req.url));
}
