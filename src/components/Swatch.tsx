import type { SwatchPattern } from "@/lib/types";

/**
 * Generated textile artwork used for sample products that have no photos yet.
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
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="presentation"
    >
      <defs>
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <pattern id={`${id}-weave`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 3h12M0 9h12" stroke={accent} strokeOpacity="0.22" strokeWidth="2" />
          <path d="M3 0v12" stroke="#000" strokeOpacity="0.06" strokeWidth="2" />
        </pattern>
        <pattern id={`${id}-stripe`} width="80" height="500" patternUnits="userSpaceOnUse">
          <rect width="28" height="500" fill={accent} fillOpacity="0.55" />
          <rect x="40" width="6" height="500" fill={accent} fillOpacity="0.35" />
          <rect x="54" width="3" height="500" fill="#fff" fillOpacity="0.25" />
        </pattern>
        <pattern id={`${id}-paisley`} width="100" height="120" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={accent} strokeOpacity="0.7" strokeWidth="2.2">
            <path d="M50 20c22 0 32 26 18 44-10 13-30 16-38 4-7-11 4-22 14-16" />
            <circle cx="50" cy="44" r="4" fill={accent} fillOpacity="0.6" />
            <path d="M0 90c10-8 20-8 30 0M70 90c10-8 20-8 30 0" strokeOpacity="0.45" />
          </g>
        </pattern>
      </defs>
      <rect width="400" height="500" fill={base} />
      {pattern !== "plain" && <rect width="400" height="500" fill={`url(#${id}-${pattern})`} />}
      {pattern === "plain" && <rect width="400" height="500" fill={`url(#${id}-weave)`} opacity="0.6" />}
      {/* woven border + fringe */}
      <rect y="410" width="400" height="14" fill={accent} fillOpacity="0.8" />
      <rect y="430" width="400" height="4" fill={accent} fillOpacity="0.6" />
      <g stroke={base} strokeWidth="3" strokeLinecap="round" style={{ filter: "brightness(0.8)" }}>
        {Array.from({ length: 34 }, (_, i) => (
          <path key={i} d={`M${6 + i * 11.6} 440v${48 + (i % 3) * 6}`} />
        ))}
      </g>
      <rect width="400" height="500" fill={`url(#${id}-shade)`} />
    </svg>
  );
}
