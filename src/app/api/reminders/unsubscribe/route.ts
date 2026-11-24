import { NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";

/**
 * Turns the reminder email off for the person the link was made for. The shop checks the token. Accepts a plain
 * form post (works without JavaScript, then sends the visitor back to the page) or JSON.
 */
export async function POST(request: Request) {
  const isForm = (request.headers.get("content-type") ?? "").includes("form");
  let token = "";
  if (isForm) {
    const form = await request.formData().catch(() => null);
    const v = form?.get("t");
    token = typeof v === "string" ? v : "";
  } else {
    const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
    token = typeof body?.token === "string" ? body.token : "";
  }
  token = token.trim().slice(0, 200);

  let result: "ok" | "invalid" | "later" = "later";
  if (!token) result = "invalid";
  else if (catalogSource === "shop") {
    try {
      const { status, data } = await shopApi("/api/reminders/unsubscribe", { method: "POST", shopperIp: shopperIp(request.headers), body: { token } });
      result = status === 200 && data.ok !== false ? "ok" : status === 400 || status === 404 || status === 422 ? "invalid" : "later";
    } catch {
      result = "later";
    }
  }
  if (isForm) return NextResponse.redirect(new URL(`/unsubscribe?r=${result}&t=${encodeURIComponent(token)}`, request.url), 303);
  return NextResponse.json(result === "ok" ? { ok: true } : { error: result }, { status: result === "ok" ? 200 : result === "invalid" ? 400 : 503 });
}
