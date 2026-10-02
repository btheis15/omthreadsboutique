import type { Craft } from "@/lib/crafts";

/** Endless ribbon of craft names in English and Devanagari: the crafts the shop carries, repeated to fill the width. */
export function Marquee({ crafts }: { crafts: Pick<Craft, "value" | "label" | "hindi">[] }) {
  const ribbon = Array.from({ length: Math.ceil(10 / Math.max(crafts.length, 1)) }, () => crafts).flat();
  const items = ribbon.map((c, i) => (
    <span key={`${c.value}-${i}`} className="flex shrink-0 items-center gap-3 pr-8">
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
