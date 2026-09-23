import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPageView } from "@/components/ContentPageView";
import { getPage } from "@/lib/catalog";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("about");
  return { title: page?.title, description: page?.intro, alternates: { canonical: "/about" } };
}

export default async function AboutPage() {
  const page = await getPage("about");
  if (!page) notFound();
  return <ContentPageView page={page} />;
}
