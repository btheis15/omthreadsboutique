import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPageView } from "@/components/ContentPageView";
import { getPage } from "@/lib/catalog";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("care-guide");
  return { title: page?.title, description: page?.intro, alternates: { canonical: "/care-guide" } };
}

export default async function CareGuidePage() {
  const page = await getPage("care-guide");
  if (!page) notFound();
  return <ContentPageView page={page} />;
}
