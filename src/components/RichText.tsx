import { PortableText, type PortableTextBlock } from "next-sanity";
import type { ContentSection } from "@/lib/types";
import { PagePhotos } from "./PagePhotos";

function isSections(body: PortableTextBlock[] | ContentSection[] | string[]): body is ContentSection[] {
  return body.length > 0 && typeof body[0] === "object" && "paragraphs" in body[0];
}

export function RichText({ value }: { value: PortableTextBlock[] | ContentSection[] | string[] }) {
  if (!value.length) return null;
  if (typeof value[0] === "string") {
    return (
      <div className="prose-om">
        {(value as string[]).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    );
  }
  if (isSections(value)) {
    // A single photo sits beside its section's text, alternating sides down the page; several go below it.
    let beside = 0;
    return (
      <div className="prose-om">
        {value.map((s, i) => {
          const photos = s.photos ?? [];
          const side = photos.length === 1 ? (beside++ % 2 === 0 ? "right" : "left") : undefined;
          return (
            <section key={i} className={photos.length ? "flow-root" : undefined}>
              {s.heading && <h2>{s.heading}</h2>}
              {side && <PagePhotos photos={photos} beside={side} />}
              {s.paragraphs.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              {photos.length > 1 && <PagePhotos photos={photos} />}
            </section>
          );
        })}
      </div>
    );
  }
  return (
    <div className="prose-om">
      <PortableText value={value as PortableTextBlock[]} />
    </div>
  );
}
