import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPageView } from "@/components/ContentPageView";
import { getPage } from "@/lib/catalog";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("faq");
  return { title: page?.title, description: page?.intro, alternates: { canonical: "/faq" } };
}

export default async function FaqPage() {
  const page = await getPage("faq");
  if (!page) notFound();
  return <ContentPageView page={page} />;
}
