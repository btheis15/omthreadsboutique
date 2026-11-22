import type { Metadata } from "next";
import Link from "next/link";
import { ShawlQuiz } from "@/components/ShawlQuiz";
import { getCollection, getCollections, getLists, getProducts } from "@/lib/catalog";
import { buildQuiz, quizSteps } from "@/lib/quiz";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Find your shawl",
  description: "Answer a few quick questions and we'll point you to pieces in stock that fit.",
  alternates: { canonical: "/find-your-shawl" },
};

export default async function FindYourShawlPage() {
  const [products, lists, shown] = await Promise.all([getProducts(), getLists(), getCollections()]);
  // Collections the owner hides from the home page still count; look up the titles of any the pieces are in.
  const titles = new Map(shown.map((c) => [c.slug, c.title]));
  const slugs = new Set(products.filter((p) => p.stock !== 0).flatMap((p) => p.collections));
  await Promise.all(
    [...slugs]
      .filter((s) => !titles.has(s))
      .map(async (s) => {
        const c = await getCollection(s);
        if (c) titles.set(s, c.title);
      }),
  );
  const model = buildQuiz(products, lists, titles);

  if (!model.products.length || !quizSteps(model).length) {
    return (
      <section className="container-page mx-auto max-w-xl py-14 text-center">
        <h1 className="font-display text-3xl">Find your shawl</h1>
        <p className="mt-3 text-muted">There isn&apos;t enough in stock to choose between right now.</p>
        <Link href="/shop" className="btn btn-outline mt-6">
          See the shop
        </Link>
      </section>
    );
  }
  return <ShawlQuiz model={model} />;
}
