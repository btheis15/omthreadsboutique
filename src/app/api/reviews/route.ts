import { NextResponse } from "next/server";
import { catalogSource, shopApi, shopperIp } from "@/lib/catalog";

type Body = { name?: unknown; location?: unknown; email?: unknown; rating?: unknown; text?: unknown; productSlug?: unknown; website?: unknown };
const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Customer review: checked here, then passed to the shop (which holds it as pending until the owner approves). */
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 8 * 1024) return NextResponse.json({ error: "That's too long." }, { status: 413 });
  let body: Body;
  try {
    body = JSON.parse(raw) as Body;
  } catch {
    return NextResponse.json({ error: "Please try again." }, { status: 400 });
  }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Please try again." }, { status: 400 });
  // Honeypot: a bot filled the hidden field. Say thanks and drop it.
  if (s(body.website)) return NextResponse.json({ ok: true });

  const name = s(body.name), location = s(body.location), email = s(body.email), text = s(body.text), productSlug = s(body.productSlug).slice(0, 120);
  const rating = body.rating;
  const errors: Record<string, string> = {};
  if (!name || name.length > 60) errors.name = "Please add your name (up to 60 letters).";
  if (location.length > 60) errors.location = "Please keep your town under 60 letters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) errors.email = "Please add a valid email.";
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "Please choose a star rating.";
  if (text.length < 20 || text.length > 1000) errors.text = "Please write between 20 and 1,000 characters.";
  if (Object.keys(errors).length) return NextResponse.json({ error: "Please check the highlighted fields.", errors }, { status: 422 });
  if (catalogSource !== "shop") return NextResponse.json({ error: "Reviews aren't open yet. Please check back soon." }, { status: 501 });

  try {
    const { status, data } = await shopApi("/api/reviews", {
      method: "POST",
      shopperIp: shopperIp(request.headers),
      body: { name, ...(location && { location }), email, rating, text, ...(productSlug && { productSlug }) },
    });
    if (status === 200 && data.ok === true) return NextResponse.json({ ok: true });
    if (status === 422) return NextResponse.json({ error: typeof data.error === "string" ? data.error : "Please check the highlighted fields.", errors: data.errors ?? {} }, { status: 422 });
    if (status === 429) return NextResponse.json({ error: "Too many tries. Please wait a few minutes." }, { status: 429 });
    return NextResponse.json({ error: "Couldn't send your review right now. Please try again in a few minutes." }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "Couldn't send your review right now. Please try again in a few minutes." }, { status: 503 });
  }
}
