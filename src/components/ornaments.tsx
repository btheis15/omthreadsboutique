/**
 * Hand-drawn SVG motifs from North Indian textile and Mughal architecture:
 * the Kashmiri buta (paisley), jaali lattice screens, lotus mandalas, and
 * block-print borders. All use `currentColor` so they pick up the text color.
 */

type SvgProps = React.SVGProps<SVGSVGElement>;

/** Kashmiri buta (paisley) outline with its curled tip and inner detailing. */
export const PAISLEY_PATH =
  "M52 138C22 138 6 116 8 92C10 66 30 52 48 40C62 31 72 20 70 8C69 4 66 2 62 2C78 2 92 16 94 36C97 64 94 98 80 120C73 131 63 138 52 138Z";

export function Paisley({ detailed = true, ...props }: SvgProps & { detailed?: boolean }) {
  return (
    <svg viewBox="0 0 100 140" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...props}>
      <path d={PAISLEY_PATH} />
      {detailed && (
        <>
          <path
            d="M52 126C31 126 20 111 21 94C22 76 36 66 50 57C60 50 68 42 72 32C80 46 82 72 76 96C71 114 63 126 52 126Z"
            strokeWidth="1.4"
          />
          {/* lotus in the belly */}
          <g strokeWidth="1.4">
            <path d="M50 110C44 102 44 92 50 84C56 92 56 102 50 110Z" />
            <path d="M50 110C41 108 35 101 35 93C43 94 48 100 50 110Z" />
            <path d="M50 110C59 108 65 101 65 93C57 94 52 100 50 110Z" />
          </g>
          <circle cx="50" cy="72" r="3" fill="currentColor" stroke="none" />
          {[
            [14, 96],
            [17, 80],
            [25, 66],
            [37, 55],
            [88, 58],
            [88, 82],
            [84, 104],
            [74, 124],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" fill="currentColor" stroke="none" />
          ))}
        </>
      )}
    </svg>
  );
}

/** Lotus mandala built from rings of petals. */
export function Mandala(props: SvgProps) {
  const ring = (count: number, r: number, len: number, w: number, offset = 0) =>
    Array.from({ length: count }, (_, i) => {
      const a = (360 / count) * i + offset;
      return (
        <path
          key={`${r}-${i}`}
          d={`M0 ${-r}C${w} ${-r - len * 0.35} ${w * 0.6} ${-r - len * 0.8} 0 ${-r - len}C${-w * 0.6} ${-r - len * 0.8} ${-w} ${-r - len * 0.35} 0 ${-r}Z`}
          transform={`rotate(${a})`}
        />
      );
    });
  return (
    <svg viewBox="-200 -200 400 400" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true" {...props}>
      <circle r="18" />
      <circle r="6" fill="currentColor" stroke="none" />
      {ring(8, 20, 34, 12)}
      <circle r="62" />
      {ring(16, 64, 42, 10, 11.25)}
      <circle r="112" strokeDasharray="2 6" />
      {ring(24, 114, 40, 8)}
      <circle r="160" />
      {ring(48, 162, 22, 4, 3.75)}
      <circle r="190" strokeDasharray="1 5" />
    </svg>
  );
}

/** Repeating jaali (lattice screen) of eight-point stars, for backgrounds. */
export function JaaliPattern({ id = "jaali", opacity = 0.18, ...props }: SvgProps & { id?: string; opacity?: number }) {
  return (
    <svg aria-hidden="true" width="100%" height="100%" {...props}>
      <defs>
        <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1" opacity={opacity}>
            <rect x="16" y="16" width="24" height="24" />
            <rect x="16" y="16" width="24" height="24" transform="rotate(45 28 28)" />
            <circle cx="28" cy="28" r="5" />
            <path d="M0 28H8.5M47.5 28H56M28 0V8.5M28 47.5V56" />
            <path d="M0 0L11 11M56 0L45 11M0 56L11 45M56 56L45 45" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Block-print style border: a row of small butas between fine rules. */
export function BorderBand({ className = "", id = "band" }: { className?: string; id?: string }) {
  return (
    <svg aria-hidden="true" className={`block h-6 w-full ${className}`} preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="40" height="24" patternUnits="userSpaceOnUse">
          <g fill="currentColor">
            <path
              transform="translate(13 3) scale(0.13)"
              d={PAISLEY_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
            />
            <circle cx="33" cy="12" r="1.6" />
          </g>
          <path d="M0 0.5H40M0 23.5H40" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="24" fill={`url(#${id})`} />
    </svg>
  );
}

/** Small section divider: rules with a centered buta, drawn in on scroll. */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-4 text-zari ${className}`} aria-hidden="true">
      <span className="h-px w-16 bg-current opacity-60 md:w-24" data-reveal="grow" />
      <svg viewBox="0 0 100 140" className="draw h-8 w-auto" data-reveal="draw" fill="none" stroke="currentColor" strokeWidth="4">
        <path d={PAISLEY_PATH} pathLength={1} />
      </svg>
      <span className="h-px w-16 bg-current opacity-60 md:w-24" data-reveal="grow" />
    </div>
  );
}

/** Om symbol set in Devanagari type. */
export function OmMark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`font-deva leading-none ${className}`}>
      ॐ
    </span>
  );
}
