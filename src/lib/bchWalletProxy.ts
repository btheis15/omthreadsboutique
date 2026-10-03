import "server-only";
import { NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";

/**
 * Paying from a connected wallet: the page's requests go to the shop's admin as they are
 * (what the wallet holds, a quote, the transaction to sign, the signed one), with the order's token checked here.
 */
export function bchWalletRoute(path: string, fields: string[], fallback: string) {
  return async function POST(request: Request) {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const token = typeof body?.token === "string" ? body.token : "";
    if (catalogSource !== "shop" || !/^[\w-]{10,64}$/.test(token)) return NextResponse.json({ error: "Order not found." }, { status: 400 });
    const pass: Record<string, unknown> = { token };
    for (const f of fields) if (typeof body?.[f] === "string") pass[f] = body[f];
    try {
      const { status, data } = await shopApi(path, { method: "POST", shopperIp: shopperIp(request.headers), body: pass });
      return NextResponse.json(status === 200 ? data : { error: typeof data.error === "string" ? data.error : fallback }, { status });
    } catch {
      return NextResponse.json({ error: "Checkout is taking a break. Please try again in a minute." }, { status: 503 });
    }
  };
}
