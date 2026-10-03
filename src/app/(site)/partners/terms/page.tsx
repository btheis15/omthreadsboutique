import type { Metadata } from "next";
import Link from "next/link";
import { SellerTerms } from "@/components/partners/SellerTerms";
import { getCheckout } from "@/lib/catalog";

export const metadata: Metadata = { title: "Seller terms", alternates: { canonical: "/partners/terms" } };

export const revalidate = 300;

export default async function SellerTermsPage() {
  const program = (await getCheckout())?.partners ?? null;
  return (
    <div className="container-page max-w-3xl pt-10 md:pt-16">
      <p className="eyebrow">Sell for Om Threads</p>
      <h1 className="mt-1 text-4xl md:text-5xl">Seller terms</h1>
      <div className="mt-6 rounded-2xl border border-line bg-white p-5 md:p-8">
        <SellerTerms ratePercent={program?.ratePercent ?? null} business={program?.business ?? null} />
      </div>
      <p className="mt-6">
        <Link href="/partners" className="underline underline-offset-4">
          ← Sell for Om Threads
        </Link>
      </p>
    </div>
  );
}
