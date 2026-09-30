import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSettings } from "@/lib/catalog";
import { TESTER_COOKIE, checkoutFor } from "@/lib/payments";
import { CheckoutView } from "./CheckoutView";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

type Props = { searchParams: Promise<{ cancelled?: string; tester?: string }> };

export default async function CheckoutPage({ searchParams }: Props) {
  const [params, jar, settings] = await Promise.all([searchParams, cookies(), getSettings()]);
  const checkout = await checkoutFor(jar.get(TESTER_COOKIE)?.value);
  return (
    <CheckoutView
      checkout={checkout}
      cancelled={params.cancelled === "1"}
      testerLink={params.tester === "on" ? "on" : params.tester === "invalid" ? "invalid" : null}
      returnDays={settings.returnDays}
    />
  );
}
