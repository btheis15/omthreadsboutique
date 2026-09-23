import type { SwatchPattern } from "@/lib/types";
import { PAISLEY_PATH } from "./ornaments";

/**
 * Generated textile artwork used for sample products that have no photos yet:
 * paisley (buta), jaali lattice, bandhani dots, block-print rows, stripes.
 * Pure SVG, so it is tiny and crisp at any size.
 */
export function Swatch({
  base,
  accent,
  pattern,
  className,
}: {
  base: string;
  accent: string;
  pattern: SwatchPattern;
  className?: string;
}) {
  const id = `sw-${pattern}-${base.slice(1)}-${accent.slice(1)}`;
  return (
    <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className={className} role="presentation">
      <defs>
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.16" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.24" />
        </linearGradient>
        <pattern id={`${id}-weave`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 1.5h6M0 4.5h6" stroke={accent} strokeOpacity="0.14" strokeWidth="1" />
        </pattern>
        <pattern id={`${id}-paisley`} width="90" height="110" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={accent} strokeWidth="7" strokeOpacity="0.75">
            <path d={PAISLEY_PATH} transform="translate(8 8) scale(0.36)" />
            <path d={PAISLEY_PATH} transform="translate(82 102) rotate(180) scale(0.36)" />
          </g>
          <circle cx="68" cy="22" r="2.5" fill={accent} fillOpacity="0.7" />
          <circle cx="22" cy="88" r="2.5" fill={accent} fillOpacity="0.7" />
        </pattern>
        <pattern id={`${id}-jaali`} width="40" height="40" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={accent} strokeOpacity="0.55" strokeWidth="1.4">
            <rect x="11" y="11" width="18" height="18" />
            <rect x="11" y="11" width="18" height="18" transform="rotate(45 20 20)" />
            <circle cx="20" cy="20" r="3.5" />
            <path d="M0 20h6.5M33.5 20H40M20 0v6.5M20 33.5V40" />
          </g>
        </pattern>
        <pattern id={`${id}-bandhani`} width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="4.5" cy="4.5" r="2.2" fill="none" stroke={accent} strokeOpacity="0.85" strokeWidth="1.2" />
          <circle cx="13.5" cy="13.5" r="2.2" fill="none" stroke={accent} strokeOpacity="0.85" strokeWidth="1.2" />
          <circle cx="13.5" cy="4.5" r="0.9" fill={accent} fillOpacity="0.6" />
        </pattern>
        <pattern id={`${id}-block`} width="50" height="46" patternUnits="userSpaceOnUse">
          <g fill={accent} fillOpacity="0.7">
            <path d={PAISLEY_PATH} transform="translate(8 6) scale(0.2)" />
            <circle cx="38" cy="12" r="3" />
            <circle cx="38" cy="30" r="1.6" />
            <circle cx="30" cy="21" r="1.6" />
            <circle cx="46" cy="21" r="1.6" />
          </g>
        </pattern>
        <pattern id={`${id}-stripe`} width="80" height="500" patternUnits="userSpaceOnUse">
          <rect width="26" height="500" fill={accent} fillOpacity="0.55" />
          <rect x="36" width="6" height="500" fill={accent} fillOpacity="0.4" />
          <rect x="50" width="2" height="500" fill="#fff" fillOpacity="0.3" />
        </pattern>
        <pattern id={`${id}-border`} width="40" height="28" patternUnits="userSpaceOnUse">
          <path d={PAISLEY_PATH} transform="translate(12 3) scale(0.15)" fill={accent} />
          <circle cx="34" cy="14" r="2" fill={accent} />
        </pattern>
      </defs>
      <rect width="400" height="500" fill={base} />
      <rect width="400" height="500" fill={`url(#${id}-weave)`} />
      {pattern !== "plain" && pattern !== "weave" && <rect width="400" height="500" fill={`url(#${id}-${pattern})`} />}
      {/* woven pallu border with buta row, then fringe */}
      <rect y="382" width="400" height="58" fill={base} />
      <rect y="382" width="400" height="3" fill={accent} />
      <rect y="392" width="400" height="28" fill={`url(#${id}-border)`} />
      <rect y="426" width="400" height="3" fill={accent} />
      <rect y="433" width="400" height="1.5" fill={accent} fillOpacity="0.7" />
      <g stroke={accent} strokeOpacity="0.55" strokeWidth="2.4" strokeLinecap="round">
        {Array.from({ length: 40 }, (_, i) => (
          <path key={i} d={`M${5 + i * 10} 440v${44 + (i % 4) * 5}`} />
        ))}
      </g>
      <rect width="400" height="500" fill={`url(#${id}-shade)`} />
    </svg>
  );
}
