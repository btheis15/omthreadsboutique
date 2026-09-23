import type { ContentPage } from "@/lib/types";
import { RichText } from "./RichText";

export function ContentPageView({ page, children }: { page: ContentPage; children?: React.ReactNode }) {
  return (
    <article className="container-page max-w-3xl pt-10 md:pt-16">
      <h1 className="text-4xl md:text-6xl">{page.title}</h1>
      {page.intro && <p className="mt-4 text-lg text-muted md:text-xl">{page.intro}</p>}
      <div className="mt-8 text-[1.0625rem]">
        <RichText value={page.body} />
      </div>
      {children}
    </article>
  );
}
