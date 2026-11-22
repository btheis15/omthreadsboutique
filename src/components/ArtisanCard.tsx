import Link from "next/link";
import type { Craft } from "@/lib/crafts";

/**
 * "Made in <origin> · <craft>": only what the piece really has (its origin and craft fields, the craft's own summary
 * from the admin's list). The craft's box links to its page; nothing is shown when the piece has neither.
 */
export function ArtisanCard({ craft, origin, craftTitle }: { craft?: Craft; origin?: string; craftTitle?: string }) {
  const place = origin?.trim();
  if (!craft && !place) return null;
  const box = "mt-8 flex items-center gap-4 rounded-2xl border border-line bg-sand p-5";
  if (!craft) return <p className={`${box} font-medium`}>Made in {place}</p>;
  return (
    <Link href={`/crafts#${craft.value}`} className={`${box} transition hover:border-zari`}>
      <span className="font-deva text-3xl text-accent">{craft.hindi}</span>
      <span>
        <span className="block font-medium">{place ? `Made in ${place} · ${craft.label}` : craftTitle}</span>
        <span className="block text-sm text-muted">{craft.summary}</span>
      </span>
    </Link>
  );
}
