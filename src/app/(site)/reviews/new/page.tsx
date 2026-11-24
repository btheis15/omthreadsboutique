import type { Metadata } from "next";
import { ReviewForm } from "@/components/ReviewForm";
import { getProducts, getT } from "@/lib/catalog";

export const metadata: Metadata = { title: "Write a review", robots: { index: false, follow: true } };

export default async function NewReviewPage({ searchParams }: { searchParams: Promise<{ product?: string | string[] }> }) {
  const [{ product }, t, products] = await Promise.all([searchParams, getT(), getProducts()]);
  const initial = (Array.isArray(product) ? product[0] : product)?.toLowerCase();
  return (
    <div className="container-page mx-auto max-w-2xl py-10 md:py-16">
      <h1 className="text-3xl md:text-4xl">{t("reviewsFormHeading")}</h1>
      <p className="mb-6 mt-3 text-muted">{t("reviewsFormIntro")}</p>
      <ReviewForm pieces={products.map((p) => ({ slug: p.slug, title: p.title }))} initialProduct={initial} thanks={t("reviewsThanks")} />
    </div>
  );
}
