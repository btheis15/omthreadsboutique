/**
 * Payment provider abstraction.
 *
 * The storefront only talks to this interface, so switching on real
 * payments (Phase 3) means adding one provider here. No UI changes needed.
 *
 *  - "etsy"   (default): no on-site payments; shoppers complete purchase on Etsy.
 *  - "stripe" : Stripe Checkout (hosted page → PCI SAQ A). Not yet implemented.
 */

export type CheckoutLine = { productId: string; qty: number };

export type PaymentProviderId = "etsy" | "stripe";

export type PaymentProviderInfo = {
  id: PaymentProviderId;
  /** True when shoppers can pay directly on this site. */
  onSiteCheckout: boolean;
  label: string;
};

export function paymentProvider(): PaymentProviderInfo {
  const id = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER as PaymentProviderId) || "etsy";
  switch (id) {
    case "stripe":
      return { id, onSiteCheckout: true, label: "Secure checkout" };
    default:
      return { id: "etsy", onSiteCheckout: false, label: "Complete purchase on Etsy" };
  }
}
