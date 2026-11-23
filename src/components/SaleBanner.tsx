import Link from "next/link";

/** Site-wide sale banner (Black Friday etc.): a rich ink-and-zari band above the thin strips. The whole band links to the shop. */
export function SaleBanner({ title, text, endsOn }: { title: string; text?: string; endsOn?: string }) {
  // Parsed at noon so the date doesn't shift with the time zone (same as ProductPurchase).
  const ends = endsOn
    ? new Date(`${endsOn}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : null;
  const label = `${title}${text ? `: ${text}` : ""}${ends ? `. Ends ${ends}` : ""}. Shop the sale`;
  return (
    <Link
      href="/shop"
      aria-label={label}
      className="group relative block overflow-hidden border-y border-zari bg-gradient-to-r from-[#10192a] via-indigo-deep to-[#10192a] px-3 py-2 text-ivory sm:py-2.5"
    >
      {/* inset zari hairline */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[3px] h-px bg-zari/50" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-[3px] h-px bg-zari/50" />
      {/* a soft gold glint that sweeps across the band every few seconds (none with reduced motion) */}
      <span
        aria-hidden="true"
        className="sale-glint pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 bg-[linear-gradient(100deg,transparent,rgba(227,191,128,0.22)_45%,rgba(255,246,220,0.32)_50%,rgba(227,191,128,0.22)_55%,transparent)] motion-safe:block"
      />
      <span className="mx-auto flex max-w-6xl items-center justify-center gap-x-3 sm:gap-x-4">
        <span className="min-w-0 flex-1 text-center sm:flex-none leading-tight sm:flex sm:items-baseline sm:gap-x-3">
          <span className="font-display text-base tracking-wide whitespace-nowrap sm:text-lg">
            <span aria-hidden="true" className="sale-twinkle inline-block text-zari-light">✦</span>{" "}
            <span className="bg-[linear-gradient(110deg,var(--color-zari-light)_35%,#fffaf0_50%,var(--color-zari-light)_65%)] bg-[length:200%_100%] bg-clip-text text-transparent motion-safe:animate-[sale-shimmer_3.5s_linear_infinite]">
              {title}
            </span>
            {" "}<span aria-hidden="true" className="sale-twinkle sale-twinkle-late inline-block text-zari-light">✦</span>
          </span>
          {(text || ends) && (
            <span className="block truncate text-[11px] text-ivory/90 sm:inline sm:overflow-visible sm:text-sm">
              {text}
              {text && ends && <span aria-hidden="true" className="mx-1.5 hidden text-zari-light sm:inline">·</span>}
              {ends && <span className={`text-zari-light ${text ? "hidden sm:inline" : ""}`}>Ends {ends}</span>}
            </span>
          )}
        </span>
        <span className="shrink-0 rounded-full bg-rani px-3 py-1 text-[11px] font-medium tracking-wide whitespace-nowrap text-ivory transition group-hover:bg-accent-dark sm:px-4 sm:text-xs">
          Shop the sale →
        </span>
      </span>
    </Link>
  );
}
