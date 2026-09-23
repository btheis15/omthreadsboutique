import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPageView } from "@/components/ContentPageView";
import { getPage } from "@/lib/catalog";

const policies = ["shipping", "returns", "privacy", "terms"];

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;
export const dynamicParams = false;

export function generateStaticParams() {
  return policies.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  return { title: page?.title, alternates: { canonical: `/policies/${slug}` } };
}

export default async function PolicyPage({ params }: Props) {
  const page = await getPage((await params).slug);
  if (!page) notFound();
  return <ContentPageView page={page} />;
}
