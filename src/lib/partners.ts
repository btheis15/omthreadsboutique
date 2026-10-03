import "server-only";
import { NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";

/**
 * Sales partners' requests (signing up, their page, the links we email them) go to the shop's admin as they
 * are, with only the named text fields passed on. The admin decides everything; this site holds nothing.
 */
export function partnerRoute(path: string, fields: string[], fallback: string, flags: string[] = []) {
  return async function POST(request: Request) {
    if (catalogSource !== "shop") return NextResponse.json({ error: "Selling for Om Threads isn't open right now." }, { status: 503 });
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const pass: Record<string, unknown> = {};
    for (const f of fields) if (typeof body?.[f] === "string") pass[f] = (body[f] as string).slice(0, 200);
    for (const f of flags) if (body?.[f] === true) pass[f] = true;
    try {
      const { status, data } = await shopApi(path, { method: "POST", shopperIp: shopperIp(request.headers), body: pass });
      return NextResponse.json(status === 200 ? data : { error: typeof data.error === "string" ? data.error : fallback, errors: data.errors }, { status, headers: { "Cache-Control": "no-store" } });
    } catch {
      return NextResponse.json({ error: "The shop is taking a break. Please try again in a few minutes." }, { status: 503 });
    }
  };
}
