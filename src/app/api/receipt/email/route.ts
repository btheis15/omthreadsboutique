import { type NextRequest, NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";

/** "Email me this receipt" on an in-person sale's receipt page: the Om Threads admin sends it. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { token?: unknown; email?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token : "";
  const email = typeof body?.email === "string" ? body.email.trim().slice(0, 120) : "";
  if (catalogSource !== "shop" || !/^[\w-]{10,64}$/.test(token)) return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
  try {
    const { status, data } = await shopApi(`/api/receipt/${token}/email`, { method: "POST", body: { email }, shopperIp: shopperIp(req.headers) });
    if (status !== 200) return NextResponse.json({ error: typeof data.error === "string" ? data.error : "Couldn't send it just now." }, { status });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Couldn't send it just now. Please try again in a moment." }, { status: 503 });
  }
}
