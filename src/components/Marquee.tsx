import { crafts } from "@/lib/crafts";

/** Endless ribbon of craft names in English and Devanagari. */
export function Marquee() {
  const items = crafts.map((c) => (
    <span key={c.value} className="flex shrink-0 items-center gap-3 pr-8">
      <span className="font-display text-xl md:text-2xl">{c.label}</span>
      <span className="font-deva text-lg text-zari-light md:text-xl">{c.hindi}</span>
      <span className="pl-5 text-zari-light" aria-hidden="true">
        ✦
      </span>
    </span>
  ));
  return (
    <div className="marquee overflow-hidden bg-accent py-4 text-ivory" aria-label="Crafts we carry">
      <div className="marquee-track flex w-max">
        <div className="flex">{items}</div>
        <div className="flex" aria-hidden="true">
          {items}
        </div>
      </div>
    </div>
  );
}
