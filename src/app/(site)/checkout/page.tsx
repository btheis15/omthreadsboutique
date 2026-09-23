import type { Metadata } from "next";
import { paymentProvider } from "@/lib/payments";
import { CheckoutView } from "./CheckoutView";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  const provider = paymentProvider();
  return <CheckoutView onSiteCheckout={provider.onSiteCheckout} />;
}
