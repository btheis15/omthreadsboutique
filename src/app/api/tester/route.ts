import { type NextRequest, NextResponse } from "next/server";
import { getCheckout } from "@/lib/catalog";
import { TESTER_COOKIE, isTester } from "@/lib/payments";

/**
 * The tester link from the Om Threads admin (Orders → Checkout setup):
 * /api/tester?key=… lets this browser see the checkout while it's in test
 * mode. /api/tester?off=1 forgets it.
 */
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") ?? "";
  const to = new URL("/checkout", req.url);
  if (req.nextUrl.searchParams.get("off") === "1") {
    const res = NextResponse.redirect(to);
    res.cookies.delete(TESTER_COOKIE);
    return res;
  }
  // Checked against the admin's current link, so an old or mistyped link says so.
  const ok = /^[\w-]{20,64}$/.test(key) && isTester(await getCheckout(), key);
  to.searchParams.set("tester", ok ? "on" : "invalid");
  const res = NextResponse.redirect(to);
  if (ok) res.cookies.set(TESTER_COOKIE, key, { httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
