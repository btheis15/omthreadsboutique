import { NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";

/** The Bitcoin Cash price ran out before anything was sent: ask for a new one (same order, same items). */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  if (catalogSource !== "shop" || !body?.token || !/^[\w-]{10,64}$/.test(body.token)) return NextResponse.json({ error: "Order not found." }, { status: 400 });
  try {
    const { status, data } = await shopApi("/api/checkout/bch/renew", { method: "POST", shopperIp: shopperIp(request.headers), body: { token: body.token } });
    return NextResponse.json(status === 200 ? { ok: true } : { error: typeof data.error === "string" ? data.error : "Couldn't get a new price. Please try again." }, { status });
  } catch {
    return NextResponse.json({ error: "Checkout is taking a break. Please try again in a minute." }, { status: 503 });
  }
}
