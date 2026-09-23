import { PortableText, type PortableTextBlock } from "next-sanity";
import type { ContentSection } from "@/lib/types";

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
    return (
      <div className="prose-om">
        {value.map((s, i) => (
          <section key={i}>
            {s.heading && <h2>{s.heading}</h2>}
            {s.paragraphs.map((p, j) => (
              <p key={j}>{p}</p>
            ))}
          </section>
        ))}
      </div>
    );
  }
  return (
    <div className="prose-om">
      <PortableText value={value as PortableTextBlock[]} />
    </div>
  );
}
