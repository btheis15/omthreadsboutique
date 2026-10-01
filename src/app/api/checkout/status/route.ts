import { type NextRequest, NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";

/** Where an order's payment stands, for the payment screen to update itself (Bitcoin Cash). */
export async function GET(req: NextRequest) {
  const order = req.nextUrl.searchParams.get("order") ?? "";
  if (catalogSource !== "shop" || !/^[\w-]{10,64}$/.test(order)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  try {
    const { status, data } = await shopApi(`/api/checkout/order/${order}`, { shopperIp: shopperIp(req.headers) });
    if (status !== 200) return NextResponse.json({ error: typeof data.error === "string" ? data.error : "Order not found." }, { status });
    return NextResponse.json({ status: data.status, bch: data.bch ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Couldn't check just now." }, { status: 503 });
  }
}
