import { NextResponse } from "next/server";
import { getProducts, isSoldOut } from "@/lib/catalog";
import { type CheckoutLine, paymentProvider } from "@/lib/payments";

/**
 * Creates a checkout session for the cart.
 *
 * Prices are always re-read from the catalog on the server. Never trust
 * prices sent by the browser. When Stripe is added (Phase 3), create the
 * Stripe Checkout Session here from `lineItems` and return its `url`.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { lines?: CheckoutLine[] } | null;
  const lines = Array.isArray(body?.lines) ? body.lines : [];
  if (!lines.length) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });

  const products = await getProducts();
  const lineItems = [];
  for (const line of lines) {
    const product = products.find((p) => p.id === line.productId);
    const qty = Math.floor(Number(line.qty));
    if (!product || !(qty > 0)) {
      return NextResponse.json({ error: "An item in your cart is no longer available." }, { status: 400 });
    }
    if (isSoldOut(product) || (product.stock !== undefined && qty > product.stock)) {
      return NextResponse.json({ error: `${product.title} is sold out or low in stock.` }, { status: 409 });
    }
    lineItems.push({ product, qty, amount: Math.round(product.price * 100) });
  }

  const provider = paymentProvider();
  if (!provider.onSiteCheckout) {
    return NextResponse.json(
      { error: "Online checkout isn't available yet. Please complete your purchase on Etsy." },
      { status: 501 },
    );
  }

  // Phase 3: Stripe Checkout goes here.
  return NextResponse.json({ error: `Payment provider "${provider.id}" is not set up yet.` }, { status: 501 });
}
