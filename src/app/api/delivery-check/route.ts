import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";
import { TESTER_COOKIE } from "@/lib/payments";

/**
 * Asks the Om Threads admin whether a ZIP code is close enough for personal
 * delivery, for the checkout page to say so. The admin decides (and checks
 * again when the order is priced), so this only passes the question along.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { zip?: unknown } | null;
  const zip = typeof body?.zip === "string" ? body.zip.trim().slice(0, 5) : "";
  if (!/^\d{5}$/.test(zip)) return NextResponse.json({ error: "Enter a 5-digit ZIP code." }, { status: 400 });
  if (catalogSource !== "shop") return NextResponse.json({ error: "Delivery isn't available yet." }, { status: 501 });

  const testerKey = (await cookies()).get(TESTER_COOKIE)?.value;
  try {
    const { status, data } = await shopApi("/api/delivery-check", { method: "POST", shopperIp: shopperIp(request.headers), body: { zip, testerKey } });
    if (status === 200 && typeof data.ok === "boolean") return NextResponse.json({ ok: data.ok, miles: typeof data.miles === "number" ? data.miles : null });
    return NextResponse.json({ error: typeof data.error === "string" ? data.error : "Couldn't check that ZIP." }, { status: status >= 400 ? status : 502 });
  } catch {
    return NextResponse.json({ error: "Couldn't check that ZIP right now. Please try again in a few minutes." }, { status: 503 });
  }
}
