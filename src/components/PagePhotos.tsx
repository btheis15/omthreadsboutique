import type { PagePhoto } from "@/lib/types";
import { ProductImage } from "./ProductImage";

function Photo({ photo, sizes, className = "", style }: { photo: PagePhoto; sizes: string; className?: string; style?: React.CSSProperties }) {
  return (
    <figure className={`m-0 ${className}`} style={style}>
      <div className="relative w-full overflow-hidden rounded-2xl bg-sand" style={{ aspectRatio: `${photo.width} / ${photo.height}` }}>
        <ProductImage image={photo} sizes={sizes} />
      </div>
      {photo.caption && <figcaption className="mt-2 text-sm leading-snug text-muted">{photo.caption}</figcaption>}
    </figure>
  );
}

/** Rows for several photos: up to three a row, four as two pairs. */
function rowsOf(photos: PagePhoto[]): PagePhoto[][] {
  const size = photos.length === 4 ? 2 : 3;
  const rows: PagePhoto[][] = [];
  for (let i = 0; i < photos.length; i += size) rows.push(photos.slice(i, i + size));
  return rows;
}

/**
 * Photos on a page, each shown whole. One photo on its own; several in rows
 * where each photo's width follows its shape, so a row's photos are all the
 * same height without cropping anyone. `beside` floats a single photo next to
 * its section's text on wider screens.
 */
export function PagePhotos({ photos, beside }: { photos: PagePhoto[]; beside?: "left" | "right" }) {
  if (!photos.length) return null;
  if (photos.length === 1) {
    const [photo] = photos;
    // A tall photo full width would fill the whole screen.
    const tall = photo.height > photo.width;
    if (beside) {
      const side = beside === "left" ? "md:float-left md:mr-8" : "md:float-right md:ml-8";
      const phone = tall ? "mx-auto max-w-xs md:max-w-none" : "";
      return <Photo photo={photo} sizes="(min-width: 768px) 320px, 100vw" className={`mb-6 md:mt-1 md:w-[42%] ${phone} ${side}`} />;
    }
    return <Photo photo={photo} sizes="(min-width: 768px) 768px, 100vw" className={`my-8 ${tall ? "mx-auto max-w-md" : ""}`} />;
  }
  return (
    <div className="my-8 space-y-3 md:space-y-4">
      {rowsOf(photos).map((row, i) => (
        <div key={i} className="flex items-start gap-3 md:gap-4">
          {row.map((photo, j) => (
            <Photo
              key={j}
              photo={photo}
              sizes={`(min-width: 768px) ${Math.round(768 / row.length)}px, ${Math.round(100 / row.length)}vw`}
              className="min-w-0"
              style={{ flex: `${photo.width / photo.height} 1 0%` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
